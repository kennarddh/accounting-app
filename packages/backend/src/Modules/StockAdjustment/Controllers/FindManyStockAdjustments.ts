import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { SortOrder, StockAdjustmentSortField } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import StockAdjustmentService, { StockAdjustmentFindManyOptions } from '../StockAdjustmentService'

class FindManyStockAdjustments extends Controller {
	constructor(private stockAdjustmentService = DI.get(StockAdjustmentService)) {
		super('FindManyStockAdjustments')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManyStockAdjustments>,
		response: CelosiaResponse,
	) {
		const { search, pagination, sort } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: { search },
			pagination,
			sort,
		}) satisfies StockAdjustmentFindManyOptions

		const { pagination: resultPagination, items } =
			await this.stockAdjustmentService.findMany(options)

		response.status(200).json({
			errors: {},
			data: {
				pagination: resultPagination,
				list: items.map(stockAdjustment => ({
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
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			search: z.string().optional(),
			pagination: ZodPagination.optional(),
			sort: z
				.object({
					field: z.enum(StockAdjustmentSortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManyStockAdjustments
