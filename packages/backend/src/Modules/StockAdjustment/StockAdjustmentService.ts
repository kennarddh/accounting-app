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

	async create(data: StockAdjustmentCreateData) {
		const totalCostDec = new Prisma.Decimal(data.totalCost)

		try {
			return await this.db.transaction(async tx => {
				// Verify all products exist and are active
				const productIds = data.items.map(i => i.productId)
				const products = await tx.product.findMany({
					where: { id: { in: productIds } },
				})

				if (products.length !== productIds.length) {
					throw new NotFoundError(ApiErrorResource.Product)
				}

				const journal = await tx.journalEntry.create({
					data: {
						entryNumber: `JE-${data.adjustmentNumber}`,
						date: data.date,
						description: `Inventory Adjustment (${data.type}): ${data.reason}`,
						createdById: data.createdById,
						lines: {
							create: [
								{
									// TODO: FIX hardcoded account id
									accountId: 1, // SPOILAGE_EXPENSE_ACCOUNT_ID, or dynamic based on type
									debit: totalCostDec.abs(),
									credit: 0,
									description: `Stock ${data.type} Expense`,
								},
								{
									accountId: 1, // INVENTORY_ASSET_ACCOUNT_ID,
									debit: 0,
									credit: totalCostDec.abs(),
									description: 'Inventory Asset reduction',
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
						totalCost: new Prisma.Decimal(data.totalCost),
						createdById: data.createdById,
						journalEntryId: journal.id,
						stockMovements: {
							create: data.items.map(item => ({
								productId: item.productId,
								type: data.type, // TODO: Create mapping/lookup between stock movement type <-> stock adjustment
								quantity: new Prisma.Decimal(item.quantity),
								costPerUnit: new Prisma.Decimal(item.unitCost),
								createdById: data.createdById,
							})),
						},
						items: {
							create: data.items.map(item => ({
								productId: item.productId,
								quantity: new Prisma.Decimal(item.quantity),
								unitCost: new Prisma.Decimal(item.unitCost),
								subtotalCost: new Prisma.Decimal(item.subtotalCost),
							})),
						},
					},
					select: { id: true },
				})

				await Promise.all(
					data.items.map(item =>
						tx.product.update({
							where: { id: item.productId },
							data: {
								currentStock: {
									increment: new Prisma.Decimal(item.quantity), // Negative quantity automatically decrements!
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
