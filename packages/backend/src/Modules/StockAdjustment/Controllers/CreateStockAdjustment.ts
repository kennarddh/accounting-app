import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { StockAdjustmentType } from '@accounting-app/common'
import z from 'zod/v4'

import { DecimalRegex, SignedDecimalRegex } from 'Utils/Constants'

import StockAdjustmentService from '../StockAdjustmentService'

class CreateStockAdjustment extends Controller {
	constructor(private stockAdjustmentService = DI.get(StockAdjustmentService)) {
		super('CreateStockAdjustment')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<CreateStockAdjustment>,
		response: CelosiaResponse,
	) {
		const { adjustmentNumber, date, type, reason, createdById, items } = request.body

		const stockAdjustment = await this.stockAdjustmentService.create({
			adjustmentNumber,
			date,
			type,
			reason,
			createdById,
			items,
		})

		response.status(200).json({
			errors: {},
			data: {
				id: stockAdjustment.id,
			},
		})
	}

	public override get body() {
		return z.object({
			adjustmentNumber: z.string().trim().min(1).max(100),
			date: z.coerce.date(),
			type: z.enum(StockAdjustmentType),
			reason: z.string().trim().min(1).max(100),
			createdById: z.coerce.bigint().min(1n),
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
