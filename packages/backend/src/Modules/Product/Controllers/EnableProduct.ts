import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ProductService from '../ProductService'

class EnableProduct extends Controller {
	constructor(private productService = DI.get(ProductService)) {
		super('EnableProduct')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<EnableProduct>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		await this.productService.enable(id)

		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default EnableProduct
