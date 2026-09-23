import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ProductService from '../ProductService'

class DisableProduct extends Controller {
	constructor(private productService = DI.get(ProductService)) {
		super('DisableProduct')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<DisableProduct>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		await this.productService.disable(id)

		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default DisableProduct
