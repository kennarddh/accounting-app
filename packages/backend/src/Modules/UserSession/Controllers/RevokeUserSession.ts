import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import UserSessionService from '../UserSessionService'

class RevokeUserSession extends Controller {
	constructor(private userSessionService = DI.get(UserSessionService)) {
		super('RevokeUserSession')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<RevokeUserSession>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		await this.userSessionService.revoke(id)

		response.sendStatus(204)
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default RevokeUserSession
