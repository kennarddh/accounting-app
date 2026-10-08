import OrderService from '../OrderService'
import { OrderStatus, PaymentMethod } from '@accounting-app/common'
import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'
import { JWTVerifiedData } from 'Middlewares/VerifyJWT'
import { DecimalRegex } from 'Utils/Constants'
import z from 'zod/v4'

class CreateOrder extends Controller {
	constructor(private orderService = DI.get(OrderService)) {
		super('CreateOrder')
	}

	public async index(
		data: JWTVerifiedData,
		request: ControllerRequest<CreateOrder>,
		response: CelosiaResponse,
	) {
		const { orderNumber, date, status, paymentMethod, items } = request.body
		const createdById = data.user.id

		const order = await this.orderService.create({
			orderNumber,
			date: new Date(date),
			status,
			paymentMethod,
			createdById,
			items,
		})

		response.status(200).json({
			errors: {},
			data: {
				id: order.id,
			},
		})
	}

	public override get body() {
		return z.object({
			orderNumber: z.string().trim().min(1).max(100),
			date: z.coerce.date(),
			status: z.enum(OrderStatus),
			paymentMethod: z.enum(PaymentMethod),
			items: z
				.array(
					z.object({
						productId: z.coerce.bigint().min(1n),
						quantity: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
					}),
				)
				.min(1),
		})
	}
}

export default CreateOrder
