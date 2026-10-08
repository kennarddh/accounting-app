import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { OrderSortField, OrderStatus, PaymentMethod, SortOrder } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import OrderService, { OrderFindManyOptions } from '../OrderService'

class FindManyOrders extends Controller {
	constructor(private orderService = DI.get(OrderService)) {
		super('FindManyOrders')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManyOrders>,
		response: CelosiaResponse,
	) {
		const { search, status, paymentMethod, createdById, fromDate, toDate, pagination, sort } =
			request.query

		const options = RemoveUndefinedValueFromObject({
			filter: {
				search,
				status,
				paymentMethod,
				createdById,
				fromDate: fromDate !== undefined ? new Date(fromDate) : undefined,
				toDate: toDate !== undefined ? new Date(toDate) : undefined,
			},
			pagination,
			sort,
		}) satisfies OrderFindManyOptions

		const { pagination: resultPagination, items } = await this.orderService.findMany(options)

		response.status(200).json({
			errors: {},
			data: {
				pagination: resultPagination,
				list: items.map(order => ({
					id: order.id,
					orderNumber: order.orderNumber,
					date: order.date.getTime(),
					status: order.status,
					paymentMethod: order.paymentMethod,
					totalAmount: order.totalAmount.toString(),
					totalCost: order.totalCost.toString(),
					cashier: {
						id: order.cashier.id,
						name: order.cashier.name,
					},
					itemsCount: order.items.length,
					createdAt: order.createdAt.getTime(),
					updatedAt: order.updatedAt.getTime(),
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			search: z.string().optional(),
			status: z.enum(OrderStatus).optional(),
			paymentMethod: z.enum(PaymentMethod).optional(),
			createdById: z.coerce.bigint().min(1n).optional(),
			fromDate: z.coerce.number().positive().optional(),
			toDate: z.coerce.number().positive().optional(),
			pagination: ZodPagination.optional(),
			sort: z
				.object({
					field: z.enum(OrderSortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManyOrders
