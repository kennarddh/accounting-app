import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import CategoryService from '../CategoryService'

class DisableCategory extends Controller {
	constructor(private categoryService = DI.get(CategoryService)) {
		super('DisableCategory')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<DisableCategory>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		await this.categoryService.disable(id)

		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default DisableCategory
