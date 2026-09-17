import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { CategorySortField, FilterEnableDisable, SortOrder } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import CategoryService, { CategoryFindManyOptions } from '../CategoryService'

class FindManyCategories extends Controller {
	constructor(private categoryService = DI.get(CategoryService)) {
		super('FindManyCategories')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManyCategories>,
		response: CelosiaResponse,
	) {
		const { search, pagination, sort, active } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: { search, active },
			pagination,
			sort,
		}) satisfies CategoryFindManyOptions

		const { pagination: resultPagination, items } = await this.categoryService.findMany(options)

		response.status(200).json({
			errors: {},
			data: {
				pagination: resultPagination,
				list: items.map(category => ({
					id: category.id,
					name: category.name,
					createdAt: category.createdAt.getTime(),
					disabledAt: category.disabledAt?.getTime() ?? null,
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
					field: z.enum(CategorySortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManyCategories
