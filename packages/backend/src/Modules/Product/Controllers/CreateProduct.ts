import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import { DecimalRegex } from 'Utils/Constants'

import ProductService from '../ProductService'

class CreateProduct extends Controller {
	constructor(private productService = DI.get(ProductService)) {
		super('CreateProduct')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<CreateProduct>,
		response: CelosiaResponse,
	) {
		const { sku, name, price, costPrice, categoryId } = request.body

		const product = await this.productService.create({
			sku,
			name,
			price,
			costPrice,
			categoryId,
		})

		response.status(200).json({
			errors: {},
			data: {
				id: product.id,
			},
		})
	}

	public override get body() {
		return z.object({
			sku: z.string().trim().min(1).max(100),
			name: z.string().trim().min(1).max(100),
			price: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
			costPrice: z.string().regex(DecimalRegex, 'Must be a valid decimal string'),
			categoryId: z.coerce.bigint().min(1n),
		})
	}
}

export default CreateProduct
