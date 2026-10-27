import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import SupplierService from '../SupplierService'

class FindSupplierById extends Controller {
	constructor(private supplierService = DI.get(SupplierService)) {
		super('FindSupplierById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindSupplierById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params
		const s = await this.supplierService.findById(id)

		response.status(200).json({
			errors: {},
			data: {
				id: s.id.toString(),
				code: s.code,
				name: s.name,
				contact: s.contact,
				email: s.email,
				phone: s.phone,
				address: s.address,
				terms: s.terms,
				createdAt: s.createdAt.getTime(),
				updatedAt: s.updatedAt.getTime(),
				disabledAt: s.disabledAt ? s.disabledAt.getTime() : null,
			},
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindSupplierById
