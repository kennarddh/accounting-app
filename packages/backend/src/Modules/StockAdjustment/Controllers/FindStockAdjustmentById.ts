import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import StockAdjustmentService from '../StockAdjustmentService'

class FindStockAdjustmentById extends Controller {
	constructor(private stockAdjustmentService = DI.get(StockAdjustmentService)) {
		super('FindStockAdjustmentById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindStockAdjustmentById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		const stockAdjustment = await this.stockAdjustmentService.findById(id)

		response.status(200).json({
			errors: {},
			data: {
				id: stockAdjustment.id,
				adjustmentNumber: stockAdjustment.adjustmentNumber,
				date: stockAdjustment.date.getTime(),
				type: stockAdjustment.type,
				reason: stockAdjustment.reason,
				totalCost: stockAdjustment.totalCost.toString(),
				createdBy: {
					id: stockAdjustment.createdBy.id,
					name: stockAdjustment.createdBy.name,
				},
				items: stockAdjustment.items.map(item => ({
					product: {
						id: item.product.id,
						sku: item.product.sku,
						name: item.product.name,
					},
					quantity: item.quantity.toString(),
					subtotalCost: item.subtotalCost.toString(),
					unitCost: item.unitCost.toString(),
				})),
				createdAt: stockAdjustment.createdAt.getTime(),
			},
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindStockAdjustmentById
