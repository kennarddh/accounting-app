import { DI, Injectable, Service } from '@celosiajs/core'

import {
	ApiErrorResource,
	SortOrder,
	StockAdjustmentSortField,
	StockAdjustmentType,
} from '@accounting-app/common'

import { BusinessRuleError, NotFoundError } from 'Errors'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'
import PosConfigurationService, {
	PosConfigurationData,
} from 'Modules/PosConfiguration/PosConfigurationService'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'

export interface StockAdjustmentItemCreateData {
	productId: bigint
	quantity: string
	unitCost: string
}

export interface StockAdjustmentCreateData {
	adjustmentNumber: string
	date: Date
	type: StockAdjustmentType
	reason: string
	createdById: bigint
	items: StockAdjustmentItemCreateData[]
}

export interface StockAdjustmentFilterOptions {
	search?: string
}

export interface StockAdjustmentFindManyOptions extends FindManyOptions<StockAdjustmentSortField> {
	filter?: StockAdjustmentFilterOptions
}

interface DynamicAccountMapping {
	debitAccountId: bigint
	creditAccountId: bigint
	debitDescription: string
	creditDescription: string
}

@Injectable()
class StockAdjustmentService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private configurationService = DI.get(ConfigurationService),
		private posConfigurationService = DI.get(PosConfigurationService),
	) {
		super('StockAdjustmentService')
	}

	private buildWhereFilter(filter?: StockAdjustmentFilterOptions) {
		if (!filter) return {}

		const where: Prisma.StockAdjustmentWhereInput = {}

		if (filter.search !== undefined)
			where.adjustmentNumber = {
				contains: filter.search,
				mode: 'insensitive',
			}

		return where
	}

	private get dataSelect() {
		return {
			id: true,
			adjustmentNumber: true,
			date: true,
			type: true,
			reason: true,
			totalCost: true,
			createdBy: { select: { id: true, name: true } },
			items: {
				select: {
					product: { select: { id: true, sku: true, name: true } },
					quantity: true,
					subtotalCost: true,
					unitCost: true,
				},
			},
			createdAt: true,
		} satisfies Prisma.StockAdjustmentSelect
	}

	async findById(id: bigint) {
		try {
			return await this.db.client.stockAdjustment.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.StockAdjustment)
		}
	}

	async findMany(options: StockAdjustmentFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.StockAdjustmentOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: {}

		const [total, stockAdjustments] = await Promise.all([
			this.db.client.stockAdjustment.count({ where }),
			this.db.client.stockAdjustment.findMany({
				where,
				select: this.dataSelect,
				skip,
				take,
				orderBy,
			}),
		])

		return {
			pagination: {
				page: options.pagination?.page ?? 0,
				limit: take,
				total,
			},
			items: stockAdjustments,
		}
	}

	/**
	 * Dynamically resolves debit & credit accounts from the POS configuration
	 * based on adjustment type and whether total cost is negative (loss) or positive (gain).
	 */
	private resolveJournalAccounts(
		type: StockAdjustmentType,
		isNegative: boolean,
		config: PosConfigurationData,
	): DynamicAccountMapping {
		// Case 1: WASTE (Always a stock reduction / expense)
		if (type === StockAdjustmentType.Waste) {
			return {
				debitAccountId: config.spoilageExpenseAccountId,
				creditAccountId: config.inventoryAssetAccountId,
				debitDescription: 'Inventory Spoilage / Waste Expense',
				creditDescription: 'Inventory Asset Reduction',
			}
		}

		// Case 2: CORRECTION (Count Discrepancy)
		if (type === StockAdjustmentType.Correction) {
			if (isNegative) {
				// Audit Shortage (Fewer items found -> Loss)
				return {
					debitAccountId: config.shrinkageExpenseAccountId,
					creditAccountId: config.inventoryAssetAccountId,
					debitDescription: 'Inventory Count Discrepancy (Shrinkage Loss)',
					creditDescription: 'Inventory Asset Reduction',
				}
			} else {
				// Audit Surplus (Extra items found -> Gain)
				return {
					debitAccountId: config.inventoryAssetAccountId,
					creditAccountId: config.inventoryGainAccountId,
					debitDescription: 'Inventory Asset Addition (Surplus)',
					creditDescription: 'Inventory Count Discrepancy Gain',
				}
			}
		}

		// Case 3: RESTOCK (Supplier Delivery / Restock Inflow)
		return {
			debitAccountId: config.inventoryAssetAccountId,
			creditAccountId: config.accountsPayableAccountId,
			debitDescription: 'Inventory Restock Addition',
			creditDescription: 'Accounts Payable for Supplier Goods',
		}
	}

	async create(data: StockAdjustmentCreateData) {
		try {
			return await this.db.transaction(async tx => {
				const config = await this.posConfigurationService.get()

				// 1. Guard against duplicate products in the same adjustment document
				const productIds = data.items.map(i => i.productId)
				if (new Set(productIds).size !== productIds.length) {
					throw new BusinessRuleError(
						ApiErrorResource.StockAdjustment,
						'Duplicate products in a stock adjustment are not allowed.',
						{ field: 'items' },
					)
				}

				// 2. Verify all products exist and are active
				const products = await tx.product.findMany({
					where: { id: { in: productIds }, disabledAt: null },
				})

				if (products.length !== productIds.length) {
					throw new NotFoundError(ApiErrorResource.Product)
				}

				// 3. Prepare normalized signed items & compute total cost on backend
				let computedTotalCost = new Prisma.Decimal(0)

				const preparedItems = data.items.map(item => {
					const rawQty = new Prisma.Decimal(item.quantity)
					const unitCost = new Prisma.Decimal(item.unitCost)

					// Waste is always an inventory deduction (negative)
					// Restock is always an inventory addition (positive)
					// Correction depends on whether quantity is positive or negative
					const signedQuantity =
						data.type === StockAdjustmentType.Waste ? rawQty.abs().negated() : rawQty

					const subtotalCost = signedQuantity.abs().mul(unitCost)
					computedTotalCost = computedTotalCost.add(subtotalCost)

					return {
						productId: item.productId,
						signedQuantity,
						unitCost,
						subtotalCost,
					}
				})

				// Determine if net adjustment is a loss (negative) or gain (positive)
				const isNegative =
					data.type === StockAdjustmentType.Waste ||
					preparedItems.some(i => i.signedQuantity.isNegative())

				const mapping = this.resolveJournalAccounts(data.type, isNegative, config)

				// 4. Create Double-Entry Journal Entry
				const journal = await tx.journalEntry.create({
					data: {
						entryNumber: `JE-${data.adjustmentNumber}`,
						date: data.date,
						description: `Inventory Adjustment (${data.type}): ${data.reason}`,
						createdById: data.createdById,
						lines: {
							create: [
								{
									accountId: mapping.debitAccountId,
									debit: computedTotalCost,
									credit: 0,
									description: mapping.debitDescription,
								},
								{
									accountId: mapping.creditAccountId,
									debit: 0,
									credit: computedTotalCost,
									description: mapping.creditDescription,
								},
							],
						},
					},
					select: { id: true },
				})

				// 5. Create Stock Adjustment & Items & Movements
				const stockAdjustment = await tx.stockAdjustment.create({
					data: {
						adjustmentNumber: data.adjustmentNumber,
						date: data.date,
						type: data.type,
						reason: data.reason,
						totalCost: computedTotalCost,
						createdById: data.createdById,
						journalEntryId: journal.id,
						items: {
							create: preparedItems.map(item => ({
								productId: item.productId,
								quantity: item.signedQuantity,
								unitCost: item.unitCost,
								subtotalCost: item.subtotalCost,
							})),
						},
						stockMovements: {
							create: preparedItems.map(item => ({
								productId: item.productId,
								type: data.type,
								quantity: item.signedQuantity,
								createdById: data.createdById,
							})),
						},
					},
					select: { id: true, adjustmentNumber: true },
				})

				// 6. Update product current stock (Increment handles both + and -)
				await Promise.all(
					preparedItems.map(item =>
						tx.product.update({
							where: { id: item.productId },
							data: {
								currentStock: {
									increment: item.signedQuantity,
								},
							},
						}),
					),
				)

				return stockAdjustment
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.StockAdjustment, {
				adjustmentNumber: data.adjustmentNumber,
				type: data.type,
			})
		}
	}
}

export default StockAdjustmentService
