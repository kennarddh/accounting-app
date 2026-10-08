import { DI, Injectable, Service } from '@celosiajs/core'

import {
	ApiErrorResource,
	OrderSortField,
	OrderStatus,
	PaymentMethod,
	SortOrder,
	StockMovementType,
} from '@accounting-app/common'

import { BusinessRuleError, NotFoundError, ResourceDisabledError } from 'Errors'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'
import PosConfigurationService from 'Modules/PosConfiguration/PosConfigurationService'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'

export interface OrderItemCreateInput {
	productId: bigint
	quantity: string
}

export interface OrderCreateData {
	orderNumber: string
	date: Date
	status?: OrderStatus
	paymentMethod: PaymentMethod
	createdById: bigint
	items: OrderItemCreateInput[]
}

export interface OrderFilterOptions {
	search?: string
	status?: OrderStatus
	paymentMethod?: PaymentMethod
	fromDate?: Date
	toDate?: Date
	createdById?: bigint
}

export interface OrderFindManyOptions extends FindManyOptions<OrderSortField> {
	filter?: OrderFilterOptions
}

@Injectable()
class OrderService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private configurationService = DI.get(ConfigurationService),
		private posConfigurationService = DI.get(PosConfigurationService),
	) {
		super('OrderService')
	}

	private buildWhereFilter(filter?: OrderFilterOptions) {
		if (!filter) return {}

		const where: Prisma.OrderWhereInput = {}

		if (filter.search !== undefined) {
			where.orderNumber = {
				contains: filter.search,
				mode: 'insensitive',
			}
		}

		if (filter.status !== undefined) {
			where.status = filter.status
		}

		if (filter.paymentMethod !== undefined) {
			where.paymentMethod = filter.paymentMethod
		}

		if (filter.createdById !== undefined) {
			where.createdById = filter.createdById
		}

		if (filter.fromDate !== undefined || filter.toDate !== undefined) {
			where.date = {
				...(filter.fromDate !== undefined ? { gte: filter.fromDate } : {}),
				...(filter.toDate !== undefined ? { lte: filter.toDate } : {}),
			}
		}

		return where
	}

	private get dataSelect() {
		return {
			id: true,
			orderNumber: true,
			date: true,
			status: true,
			paymentMethod: true,
			totalAmount: true,
			totalCost: true,
			cashier: { select: { id: true, name: true, username: true } },
			items: {
				select: {
					id: true,
					product: { select: { id: true, sku: true, name: true } },
					quantity: true,
					unitPrice: true,
					unitCost: true,
					subtotal: true,
				},
			},
			journalEntry: {
				select: {
					id: true,
					entryNumber: true,
				},
			},
			createdAt: true,
			updatedAt: true,
		} satisfies Prisma.OrderSelect
	}

	async findById(id: bigint) {
		try {
			return await this.db.client.order.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Order)
		}
	}

	async findMany(options: OrderFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.OrderOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: { createdAt: SortOrder.Descending }

		const [total, orders] = await Promise.all([
			this.db.client.order.count({ where }),
			this.db.client.order.findMany({
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
			items: orders,
		}
	}

	async create(data: OrderCreateData) {
		const status = data.status ?? OrderStatus.Completed

		try {
			return await this.db.transaction(async tx => {
				const config = await this.posConfigurationService.get()

				// 1. Fetch products from database
				const uniqueProductIds = Array.from(new Set(data.items.map(i => i.productId)))
				const products = await tx.product.findMany({
					where: { id: { in: uniqueProductIds } },
				})

				if (products.length !== uniqueProductIds.length) {
					throw new NotFoundError(ApiErrorResource.Product)
				}

				// Check for disabled products
				const disabledProduct = products.find(p => p.disabledAt !== null)
				if (disabledProduct) {
					throw new ResourceDisabledError(ApiErrorResource.Product, {
						field: 'productId',
						meta: {
							id: disabledProduct.id,
							sku: disabledProduct.sku,
							name: disabledProduct.name,
						},
					})
				}

				const productMap = new Map(products.map(p => [p.id, p]))

				// 2. Calculate line items, total amount, and total cost on the backend
				let totalAmount = new Prisma.Decimal(0)
				let totalCost = new Prisma.Decimal(0)

				const calculatedItems = data.items.map(item => {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const product = productMap.get(item.productId)!
					const quantity = new Prisma.Decimal(item.quantity)

					if (quantity.lessThanOrEqualTo(0)) {
						throw new BusinessRuleError(
							ApiErrorResource.OrderItem,
							'Quantity must be greater than zero.',
							{ field: 'quantity' },
						)
					}

					const unitPrice = product.price
					const unitCost = product.costPrice
					const subtotal = quantity.mul(unitPrice)
					const subtotalCost = quantity.mul(unitCost)

					totalAmount = totalAmount.add(subtotal)
					totalCost = totalCost.add(subtotalCost)

					return {
						productId: item.productId,
						quantity,
						unitPrice,
						unitCost,
						subtotal,
					}
				})

				// 3. Resolve GL account for payment
				const paymentAccountId =
					data.paymentMethod === PaymentMethod.Cash
						? config.cashAccountId
						: config.bankAccountId

				// 4. Build balanced Double-Entry Journal
				const journalLines: Prisma.JournalLineUncheckedCreateWithoutJournalEntryInput[] = [
					{
						accountId: paymentAccountId,
						debit: totalAmount,
						credit: 0,
						description: `Customer payment (${data.paymentMethod}) for ${data.orderNumber}`,
					},
					{
						accountId: config.salesRevenueAccountId,
						debit: 0,
						credit: totalAmount,
						description: `Sales Revenue for ${data.orderNumber}`,
					},
				]

				// COGS & Inventory Asset entry
				if (totalCost.greaterThan(0)) {
					journalLines.push(
						{
							accountId: config.cogsAccountId,
							debit: totalCost,
							credit: 0,
							description: `Cost of Goods Sold for ${data.orderNumber}`,
						},
						{
							accountId: config.inventoryAssetAccountId,
							debit: 0,
							credit: totalCost,
							description: `Inventory reduction for ${data.orderNumber}`,
						},
					)
				}

				const journal = await tx.journalEntry.create({
					data: {
						entryNumber: `JE-${data.orderNumber}`,
						date: data.date,
						description: `POS Order ${data.orderNumber}`,
						createdById: data.createdById,
						lines: {
							create: journalLines,
						},
					},
					select: { id: true },
				})

				// 5. Create Order & Line Items
				const order = await tx.order.create({
					data: {
						orderNumber: data.orderNumber,
						date: data.date,
						status,
						paymentMethod: data.paymentMethod,
						totalAmount,
						totalCost,
						createdById: data.createdById,
						journalEntryId: journal.id,
						items: {
							create: calculatedItems.map(item => ({
								productId: item.productId,
								quantity: item.quantity,
								unitPrice: item.unitPrice,
								unitCost: item.unitCost,
								subtotal: item.subtotal,
							})),
						},
						stockMovements: {
							create: calculatedItems.map(item => ({
								productId: item.productId,
								type: StockMovementType.Sale,
								quantity: item.quantity.negated(), // Negative quantity out for sales
								costPerUnit: item.unitCost,
								createdById: data.createdById,
							})),
						},
					},
					select: { id: true, orderNumber: true },
				})

				// 6. Deduct current stock on each product
				await Promise.all(
					calculatedItems.map(item =>
						tx.product.update({
							where: { id: item.productId },
							data: {
								currentStock: {
									decrement: item.quantity,
								},
							},
						}),
					),
				)

				return order
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Order, {
				orderNumber: data.orderNumber,
			})
		}
	}
}

export default OrderService
