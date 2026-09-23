import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import { DecimalRegex } from 'Utils/Constants'

import ProductService from '../ProductService'

class UpdateProduct extends Controller {
	constructor(private productService = DI.get(ProductService)) {
		super('UpdateProduct')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<UpdateProduct>,
		response: CelosiaResponse,
	) {
		const { name, price, costPrice, categoryId } = request.body
		const { id } = request.params

		await this.productService.update(id, { name, price, costPrice, categoryId })

		response.sendStatus(204)
	}

	public override get body() {
		return z.object({
			name: z.string().trim().min(1).max(100),
			price: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
			costPrice: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
			categoryId: z.coerce.bigint().min(1n),
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default UpdateProduct
