import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import CategoryService from '../CategoryService'

class UpdateCategory extends Controller {
	constructor(private categoryService = DI.get(CategoryService)) {
		super('UpdateCategory')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<UpdateCategory>,
		response: CelosiaResponse,
	) {
		const { name } = request.body
		const { id } = request.params

		await this.categoryService.update(id, { name })

		response.sendStatus(204)
	}

	public override get body() {
		return z.object({
			name: z.string().trim().min(1).max(100).optional(),
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default UpdateCategory
