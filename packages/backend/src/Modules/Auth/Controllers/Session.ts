import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import handleControllerError from 'Utils/HandleControllerError'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import UserSessionService from 'Modules/UserSession/UserSessionService'

class Session extends Controller {
	constructor(private userSessionService = DI.get(UserSessionService)) {
		super('AuthSession')
	}

	public async index(
		data: JWTVerifiedData,
		_: ControllerRequest<Session>,
		response: CelosiaResponse,
	) {
		try {
			const session = await this.userSessionService.getSessionDetails(data.user.session.id)

			return response.status(200).json({
				errors: {},
				data: {
					id: session.id,
					user: {
						id: session.user.id,
						name: session.user.name,
						username: session.user.username,
					},
					ipAddress: session.ipAddress,
					createdAt: session.createdAt.getTime(),
					expireAt: session.expireAt.getTime(),
					lastRefreshAt: session.lastRefreshAt.getTime(),
				},
			})
		} catch (error) {
			return handleControllerError(error, response, this.logger)
		}
	}
}

export default Session
