import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ProductService from '../ProductService'

class FindProductById extends Controller {
	constructor(private productService = DI.get(ProductService)) {
		super('FindProductById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindProductById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		const product = await this.productService.findById(id)

		response.status(200).json({
			errors: {},
			data: {
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
			},
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindProductById
