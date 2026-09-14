import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import UserSessionService from '../UserSessionService'

class FindUserSessionById extends Controller {
	constructor(private userSessionService = DI.get(UserSessionService)) {
		super('FindUserSessionById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindUserSessionById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		const userSession = await this.userSessionService.findById(id)

		response.status(200).json({
			errors: {},
			data: {
				id: userSession.id,
				user: {
					id: userSession.user.id,
					name: userSession.user.name,
				},
				ipAddress: userSession.ipAddress,
				createdAt: userSession.createdAt.getTime(),
				expireAt: userSession.expireAt.getTime(),
				lastRefreshAt: userSession.lastRefreshAt.getTime(),
				loggedOutAt: userSession.loggedOutAt?.getTime() ?? null,
				revokedAt: userSession.revokedAt?.getTime() ?? null,
			},
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindUserSessionById
