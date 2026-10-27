import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import SupplierService from '../SupplierService'

class DisableSupplier extends Controller {
	constructor(private supplierService = DI.get(SupplierService)) {
		super('DisableSupplier')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<DisableSupplier>,
		response: CelosiaResponse,
	) {
		const { id } = request.params
		await this.supplierService.disable(id)
		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default DisableSupplier
