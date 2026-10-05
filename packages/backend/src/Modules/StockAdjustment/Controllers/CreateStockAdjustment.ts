import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { StockAdjustmentType } from '@accounting-app/common'
import z from 'zod/v4'

import { DecimalRegex } from 'Utils/Constants'

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
		const { adjustmentNumber, date, type, reason, totalCost, createdById, items } = request.body

		const stockAdjustment = await this.stockAdjustmentService.create({
			adjustmentNumber,
			date,
			type,
			reason,
			totalCost,
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
			date: z.coerce.date().min(new Date()),
			type: z.enum(StockAdjustmentType),
			reason: z.string().trim().min(1).max(100),
			totalCost: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
			createdById: z.coerce.bigint().min(1n),
			items: z.array(
				z.object({
					productId: z.coerce.bigint().min(1n),
					quantity: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
					unitCost: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
					subtotalCost: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
				}),
			),
		})
	}
}

export default CreateStockAdjustment
