import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import SupplierService from '../SupplierService'

class UpdateSupplier extends Controller {
	constructor(private supplierService = DI.get(SupplierService)) {
		super('UpdateSupplier')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<UpdateSupplier>,
		response: CelosiaResponse,
	) {
		const { id } = request.params
		const { code, name, contact, email, phone, address, terms } = request.body

		await this.supplierService.update(id, {
			code,
			name,
			contact,
			email,
			phone,
			address,
			terms,
		})

		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}

	public override get body() {
		return z.object({
			code: z.string().trim().min(1).max(50).optional(),
			name: z.string().trim().min(1).max(100).optional(),
			contact: z.string().trim().max(100).optional(),
			email: z.email().optional(),
			phone: z.string().trim().max(50).optional(),
			address: z.string().trim().optional(),
			terms: z.string().trim().max(50).optional(),
		})
	}
}

export default UpdateSupplier
