import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import CategoryService from '../CategoryService'

class CreateCategory extends Controller {
	constructor(private categoryService = DI.get(CategoryService)) {
		super('CreateCategory')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<CreateCategory>,
		response: CelosiaResponse,
	) {
		const { name } = request.body

		const category = await this.categoryService.create({
			name,
		})

		response.status(200).json({
			errors: {},
			data: {
				id: category.id,
			},
		})
	}

	public override get body() {
		return z.object({
			name: z.string().trim().min(1).max(100),
		})
	}
}

export default CreateCategory
