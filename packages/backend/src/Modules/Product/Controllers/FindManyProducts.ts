import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { FilterEnableDisable, ProductSortField, SortOrder } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import ProductService, { ProductFindManyOptions } from '../ProductService'

class FindManyProducts extends Controller {
	constructor(private productService = DI.get(ProductService)) {
		super('FindManyProducts')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManyProducts>,
		response: CelosiaResponse,
	) {
		const { search, pagination, sort, active } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: { search, active },
			pagination,
			sort,
		}) satisfies ProductFindManyOptions

		const { pagination: resultPagination, items } = await this.productService.findMany(options)

		response.status(200).json({
			errors: {},
			data: {
				pagination: resultPagination,
				list: items.map(product => ({
					id: product.id,
					sku: product.sku,
					name: product.name,
					price: product.price.toString(),
					costPrice: product.costPrice.toString(),
					currentStock: product.currentStock.toString(),
					category: {
						id: product.category.id,
						name: product.category.name,
					},
					createdAt: product.createdAt.getTime(),
					updatedAt: product.updatedAt.getTime(),
					disabledAt: product.disabledAt?.getTime() ?? null,
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			search: z.string().optional(),
			active: z.enum(FilterEnableDisable).optional(),
			pagination: ZodPagination.optional(),
			sort: z
				.object({
					field: z.enum(ProductSortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManyProducts
