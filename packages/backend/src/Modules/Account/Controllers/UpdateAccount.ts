import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import AccountService from '../AccountService'

class UpdateAccount extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('UpdateAccount')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<UpdateAccount>,
		response: CelosiaResponse,
	) {
		const { code, name } = request.body
		const { id } = request.params

		await this.accountService.update(id, { code, name })

		response.sendStatus(204)
	}

	public override get body() {
		return z.object({
			code: z.string().trim().min(1).max(20).optional(),
			name: z.string().trim().min(1).max(100).optional(),
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default UpdateAccount
