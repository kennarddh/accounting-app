import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import handleControllerError from 'Utils/HandleControllerError'

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

		try {
			await this.userSessionService.revoke(id)

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

export default RevokeUserSession
