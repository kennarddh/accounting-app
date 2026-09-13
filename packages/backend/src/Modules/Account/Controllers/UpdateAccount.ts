import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import handleControllerError from 'Utils/HandleControllerError'

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

		try {
			await this.accountService.update(id, { code, name })

			return response.sendStatus(204)
		} catch (error) {
			return handleControllerError(error, response, this.logger)
		}
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
