import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import SupplierService from '../SupplierService'

class EnableSupplier extends Controller {
	constructor(private supplierService = DI.get(SupplierService)) {
		super('EnableSupplier')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<EnableSupplier>,
		response: CelosiaResponse,
	) {
		const { id } = request.params
		await this.supplierService.enable(id)
		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default EnableSupplier
