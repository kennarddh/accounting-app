import { DI, Injectable, Service } from '@celosiajs/core'

import {
	ApiErrorResource,
	SortOrder,
	StockAdjustmentSortField,
	StockAdjustmentType,
} from '@accounting-app/common'

import { BusinessRuleError, NotFoundError, ResourceDisabledError } from 'Errors'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'
import PosConfigurationService from 'Modules/PosConfiguration/PosConfigurationService'

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
	supplierId?: bigint | undefined
	items: StockAdjustmentItemCreateData[]
}

export interface StockAdjustmentFilterOptions {
	search?: string
}

export interface StockAdjustmentFindManyOptions extends FindManyOptions<StockAdjustmentSortField> {
	filter?: StockAdjustmentFilterOptions
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
			supplier: {
				select: {
					id: true,
					code: true,
					name: true,
				},
			},
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

	async create(data: StockAdjustmentCreateData) {
		try {
			return await this.db.transaction(async tx => {
				const config = await this.posConfigurationService.get()

				// Period Lock Guard
				if (config.closingLockDate && data.date <= config.closingLockDate) {
					const lockedStr = config.closingLockDate.toISOString().slice(0, 10)
					throw new BusinessRuleError(
						ApiErrorResource.StockAdjustment,
						`Cannot adjust stock in a closed accounting period (Locked through ${lockedStr}).`,
						{ field: 'date', meta: { date: lockedStr } },
					)
				}

				// 1. Guard against duplicate products
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

				// 3. Verify Supplier if provided on Restock
				let supplierName: string | undefined
				if (data.supplierId) {
					const s = await tx.supplier.findUnique({
						where: { id: data.supplierId },
						select: { id: true, name: true, disabledAt: true },
					})

					if (!s) {
						throw new NotFoundError(ApiErrorResource.Supplier)
					} else if (s.disabledAt !== null) {
						throw new ResourceDisabledError(ApiErrorResource.Supplier)
					} else {
						supplierName = s.name
					}
				}

				// 4. Prepare normalized signed items & compute totals
				let totalGainCost = new Prisma.Decimal(0)
				let totalLossCost = new Prisma.Decimal(0)

				const preparedItems = data.items.map(item => {
					const rawQty = new Prisma.Decimal(item.quantity)
					const unitCost = new Prisma.Decimal(item.unitCost)

					let signedQuantity: Prisma.Decimal
					if (data.type === StockAdjustmentType.Waste) {
						signedQuantity = rawQty.abs().negated()
					} else if (data.type === StockAdjustmentType.Restock) {
						signedQuantity = rawQty.abs()
					} else {
						signedQuantity = rawQty
					}

					if (signedQuantity.isZero()) {
						throw new BusinessRuleError(
							ApiErrorResource.StockAdjustment,
							'Adjustment quantity cannot be zero.',
							{ field: 'quantity' },
						)
					}

					const subtotalCost = signedQuantity.abs().mul(unitCost)

					if (signedQuantity.isPositive()) {
						totalGainCost = totalGainCost.add(subtotalCost)
					} else {
						totalLossCost = totalLossCost.add(subtotalCost)
					}

					return {
						productId: item.productId,
						signedQuantity,
						unitCost,
						subtotalCost,
					}
				})

				// 5. Build consolidated Double-Entry Journal Lines
				const journalLines: Prisma.JournalLineUncheckedCreateWithoutJournalEntryInput[] = []

				if (totalLossCost.greaterThan(0)) {
					const lossExpenseAccountId =
						data.type === StockAdjustmentType.Waste
							? config.spoilageExpenseAccountId
							: config.shrinkageExpenseAccountId

					journalLines.push(
						{
							accountId: lossExpenseAccountId,
							debit: totalLossCost,
							credit: 0,
							description: `Loss (${data.type}) for ${data.adjustmentNumber}`,
						},
						{
							accountId: config.inventoryAssetAccountId,
							debit: 0,
							credit: totalLossCost,
							description: `Inventory reduction for ${data.adjustmentNumber}`,
						},
					)
				}

				if (totalGainCost.greaterThan(0)) {
					const gainCreditAccountId =
						data.type === StockAdjustmentType.Restock
							? config.accountsPayableAccountId
							: config.inventoryGainAccountId

					const gainDescription =
						data.type === StockAdjustmentType.Restock
							? `Accounts Payable${supplierName ? ` to ${supplierName}` : ''} for Delivery ${data.adjustmentNumber}`
							: `Inventory Surplus for ${data.adjustmentNumber}`

					journalLines.push(
						{
							accountId: config.inventoryAssetAccountId,
							debit: totalGainCost,
							credit: 0,
							description: `Inventory addition for ${data.adjustmentNumber}`,
						},
						{
							accountId: gainCreditAccountId,
							debit: 0,
							credit: totalGainCost,
							description: gainDescription,
						},
					)
				}

				// 6. Create Journal Entry
				const journal = await tx.journalEntry.create({
					data: {
						entryNumber: `JE-${data.adjustmentNumber}`,
						date: data.date,
						description: `Inventory Adjustment (${data.type}): ${data.reason}`,
						createdById: data.createdById,
						lines: { create: journalLines },
					},
					select: { id: true },
				})

				// 7. Create Stock Adjustment with Supplier Relation
				const netCost = totalGainCost.minus(totalLossCost)

				const stockAdjustment = await tx.stockAdjustment.create({
					data: {
						adjustmentNumber: data.adjustmentNumber,
						date: data.date,
						type: data.type,
						reason: data.reason,
						totalCost: netCost.abs(),
						supplierId: data.supplierId ?? null,
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
								costPerUnit: item.unitCost,
								createdById: data.createdById,
							})),
						},
					},
					select: { id: true, adjustmentNumber: true },
				})

				// 8. Update product stock levels
				await Promise.all(
					preparedItems.map(item =>
						tx.product.update({
							where: { id: item.productId },
							data: {
								currentStock: { increment: item.signedQuantity },
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
