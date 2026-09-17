import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import CategoryService from '../CategoryService'

class FindCategoryById extends Controller {
	constructor(private categoryService = DI.get(CategoryService)) {
		super('FindCategoryById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindCategoryById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		const category = await this.categoryService.findById(id)

		response.status(200).json({
			errors: {},
			data: {
				id: category.id,
				name: category.name,
				createdAt: category.createdAt.getTime(),
				disabledAt: category.disabledAt?.getTime() ?? null,
			},
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindCategoryById
