import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import ProductService from '../ProductService'

class FindProductLookup extends Controller {
	constructor(private productService = DI.get(ProductService)) {
		super('FindProductLookup')
	}

	public async index(
		_: EmptyObject,
		__: ControllerRequest<FindProductLookup>,
		response: CelosiaResponse,
	) {
		const products = await this.productService.findLookup()

		response.status(200).json({
			errors: {},
			data: {
				list: products.map(product => ({
					id: product.id.toString(),
					sku: product.sku,
					name: product.name,
					price: product.price.toString(),
					costPrice: product.costPrice.toString(),
					currentStock: product.currentStock.toString(),
				})),
			},
		})
	}
}

export default FindProductLookup
