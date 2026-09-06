import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import UserSessionService from '../UserSessionService'

class RevokeAllUserSessionsByUserId extends Controller {
	constructor(private userSessionService = DI.get(UserSessionService)) {
		super('RevokeAllUserSessionsByUserId')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<RevokeAllUserSessionsByUserId>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			await this.userSessionService.revokeAllByUserId(id)

			return response.status(204).send()
		} catch (error) {
			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default RevokeAllUserSessionsByUserId
