import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

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

		await this.accountService.enable(id)

		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default EnableAccount
