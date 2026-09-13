import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import handleControllerError from 'Utils/HandleControllerError'

import AccountService from '../AccountService'

class EnableAccount extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('EnableAccount')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<EnableAccount>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			await this.accountService.enable(id)

			return response.sendStatus(204)
		} catch (error) {
			return handleControllerError(error, response, this.logger)
		}
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default EnableAccount
