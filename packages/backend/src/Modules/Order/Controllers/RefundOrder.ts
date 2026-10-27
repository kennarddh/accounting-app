import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import { OrderStatus } from '@accounting-app/common'
import z from 'zod/v4'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import OrderService from '../OrderService'

class RefundOrder extends Controller {
	constructor(private orderService = DI.get(OrderService)) {
		super('RefundOrder')
	}

	public async index(
		data: JWTVerifiedData,
		request: ControllerRequest<RefundOrder>,
		response: CelosiaResponse,
	) {
		const { id } = request.params
		const { status, reason } = request.body
		const userId = data.user.id

		let targetStatus: OrderStatus

		if (status) {
			targetStatus = status
		} else {
			targetStatus = OrderStatus.Refunded
		}

		const updatedOrder = await this.orderService.refund(id, userId, targetStatus, reason)

		response.status(200).json({
			errors: {},
			data: {
				id: updatedOrder.id.toString(),
				status: updatedOrder.status,
			},
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}

	public override get body() {
		return z.object({
			status: z.enum([OrderStatus.Refunded, OrderStatus.Cancelled]).optional(),
			reason: z.string().trim().max(200).optional(),
		})
	}
}

export default RefundOrder
