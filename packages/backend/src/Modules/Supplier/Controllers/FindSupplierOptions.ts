import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import SupplierService from '../SupplierService'

class FindSupplierOptions extends Controller {
	constructor(private supplierService = DI.get(SupplierService)) {
		super('FindSupplierOptions')
	}

	public async index(
		_: EmptyObject,
		__: ControllerRequest<FindSupplierOptions>,
		response: CelosiaResponse,
	) {
		const suppliers = await this.supplierService.findOptions()

		response.status(200).json({
			errors: {},
			data: {
				list: suppliers.map(s => ({
					id: s.id.toString(),
					code: s.code,
					name: s.name,
					terms: s.terms,
				})),
			},
		})
	}
}

export default FindSupplierOptions
