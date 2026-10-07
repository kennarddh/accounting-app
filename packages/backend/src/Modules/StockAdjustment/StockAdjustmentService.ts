import { DI, Injectable, Service } from '@celosiajs/core'

import {
	ApiErrorResource,
	SortOrder,
	StockAdjustmentSortField,
	StockAdjustmentType,
} from '@accounting-app/common'

import { NotFoundError } from 'Errors'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'

export interface StockAdjustmentItemCreateData {
	productId: bigint
	quantity: string
	unitCost: string
	subtotalCost: string
}

export interface StockAdjustmentCreateData {
	adjustmentNumber: string
	date: Date
	type: StockAdjustmentType
	reason: string
	totalCost: string
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
			handlePrismaError(error, ApiErrorResource.User)
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
		config: {
			inventoryAssetAccountId: bigint
			spoilageExpenseAccountId: bigint
			shrinkageExpenseAccountId: bigint
			inventoryGainAccountId: bigint
			accountsPayableAccountId: bigint
		},
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
		const totalCostDec = new Prisma.Decimal(data.totalCost)
		const isNegative = totalCostDec.isNegative()

		try {
			return await this.db.transaction(async tx => {
				const config = await tx.posConfiguration.findFirst()

				if (!config) {
					// Throws a standard Error -> Skips handlePrismaError -> Triggers 500 Internal Server Error + Logs to Winston!
					throw new Error(
						'POS Configuration is not initialized. Please run database seed.',
					)
				}

				// Verify all products exist and are active
				const productIds = data.items.map(i => i.productId)
				const products = await tx.product.findMany({
					where: { id: { in: productIds }, disabledAt: null },
				})

				if (products.length !== productIds.length) {
					throw new NotFoundError(ApiErrorResource.Product)
				}

				const mapping = this.resolveJournalAccounts(data.type, isNegative, config)

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
									debit: totalCostDec.abs(), // Always positive in journal lines
									credit: 0,
									description: mapping.debitDescription,
								},
								{
									accountId: mapping.creditAccountId,
									debit: 0,
									credit: totalCostDec.abs(),
									description: mapping.creditDescription,
								},
							],
						},
					},
					select: { id: true },
				})

				const stockAdjustment = await tx.stockAdjustment.create({
					data: {
						adjustmentNumber: data.adjustmentNumber,
						date: data.date,
						type: data.type,
						reason: data.reason,
						totalCost: totalCostDec,
						createdById: data.createdById,
						journalEntryId: journal.id,
						items: {
							create: data.items.map(item => ({
								productId: item.productId,
								quantity: new Prisma.Decimal(item.quantity),
								unitCost: new Prisma.Decimal(item.unitCost),
								subtotalCost: new Prisma.Decimal(item.subtotalCost),
							})),
						},
						stockMovements: {
							create: data.items.map(item => ({
								productId: item.productId,
								type: data.type,
								quantity: new Prisma.Decimal(item.quantity),
								createdById: data.createdById,
							})),
						},
					},
					select: { id: true, adjustmentNumber: true },
				})

				await Promise.all(
					data.items.map(item =>
						tx.product.update({
							where: { id: item.productId },
							data: {
								currentStock: {
									increment: new Prisma.Decimal(item.quantity), // Negative decrements, positive increments!
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
