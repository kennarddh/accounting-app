import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import { StockAdjustmentType } from '@accounting-app/common'
import z from 'zod/v4'

import { DecimalRegex, SignedDecimalRegex } from 'Utils/Constants'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import StockAdjustmentService from '../StockAdjustmentService'

class CreateStockAdjustment extends Controller {
	constructor(private stockAdjustmentService = DI.get(StockAdjustmentService)) {
		super('CreateStockAdjustment')
	}

	public async index(
		data: JWTVerifiedData,
		request: ControllerRequest<CreateStockAdjustment>,
		response: CelosiaResponse,
	) {
		const { adjustmentNumber, date, type, reason, items, supplierId } = request.body
		const createdById = data.user.id

		const stockAdjustment = await this.stockAdjustmentService.create({
			adjustmentNumber,
			date,
			type,
			reason,
			createdById,
			supplierId,
			items,
		})

		response.status(200).json({
			errors: {},
			data: {
				id: stockAdjustment.id.toString(),
			},
		})
	}

	public override get body() {
		return z.object({
			adjustmentNumber: z.string().trim().min(1).max(100),
			date: z.coerce.date(),
			type: z.enum(StockAdjustmentType),
			reason: z.string().trim().min(1).max(100),
			supplierId: z.coerce.bigint().min(1n).optional(),
			items: z
				.array(
					z.object({
						productId: z.coerce.bigint().min(1n),
						quantity: z
							.string()
							.regex(SignedDecimalRegex, 'Must be a valid decimal string'),
						unitCost: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
					}),
				)
				.refine(items => new Set(items.map(i => i.productId)).size === items.length, {
					message: 'Each product can only appear once per stock adjustment.',
				}),
		})
	}
}

export default CreateStockAdjustment
