import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import OrderService from '../OrderService'

class FindOrderById extends Controller {
	constructor(private orderService = DI.get(OrderService)) {
		super('FindOrderById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindOrderById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		const order = await this.orderService.findById(id)

		response.status(200).json({
			errors: {},
			data: {
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
					username: order.cashier.username,
				},
				journalEntry: order.journalEntry
					? {
							id: order.journalEntry.id,
							entryNumber: order.journalEntry.entryNumber,
						}
					: null,
				items: order.items.map(item => ({
					id: item.id,
					product: {
						id: item.product.id,
						sku: item.product.sku,
						name: item.product.name,
					},
					quantity: item.quantity.toString(),
					unitPrice: item.unitPrice.toString(),
					unitCost: item.unitCost.toString(),
					subtotal: item.subtotal.toString(),
				})),
				createdAt: order.createdAt.getTime(),
				updatedAt: order.updatedAt.getTime(),
			},
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindOrderById
