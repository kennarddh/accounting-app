import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
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

		try {
			const userSession = await this.userSessionService.findById(id)

			if (!userSession)
				return response.status(404).json({
					errors: {
						others: [
							{
								resource: ApiErrorResource.UserSession,
								kind: ApiErrorKind.NotFound,
							},
						],
					},
					data: {},
				})

			return response.status(200).json({
				errors: {},
				data: {
					id: userSession.id.toString(),
					user: {
						id: userSession.user.id.toString(),
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

export default FindUserSessionById
