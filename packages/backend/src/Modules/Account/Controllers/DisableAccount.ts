import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import AccountService from '../AccountService'

class DisableAccount extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('DisableAccount')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<DisableAccount>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		await this.accountService.disable(id)

		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default DisableAccount
