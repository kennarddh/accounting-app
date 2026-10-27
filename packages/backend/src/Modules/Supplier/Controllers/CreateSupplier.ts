import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import SupplierService from '../SupplierService'

class CreateSupplier extends Controller {
	constructor(private supplierService = DI.get(SupplierService)) {
		super('CreateSupplier')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<CreateSupplier>,
		response: CelosiaResponse,
	) {
		const { code, name, contact, email, phone, address, terms } = request.body

		const supplier = await this.supplierService.create({
			code,
			name,
			contact,
			email,
			phone,
			address,
			terms,
		})

		response.status(200).json({
			errors: {},
			data: {
				id: supplier.id.toString(),
			},
		})
	}

	public override get body() {
		return z.object({
			code: z.string().trim().min(1).max(50),
			name: z.string().trim().min(1).max(100),
			contact: z.string().trim().max(100).optional(),
			email: z.email().optional(),
			phone: z.string().trim().max(50).optional(),
			address: z.string().trim().optional(),
			terms: z.string().trim().max(50).optional(),
		})
	}
}

export default CreateSupplier
