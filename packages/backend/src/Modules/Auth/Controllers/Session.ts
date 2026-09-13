import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import AuthService from '../AuthService'

class Session extends Controller {
	constructor(private authService = DI.get(AuthService)) {
		super('AuthSession')
	}

	public async index(
		data: JWTVerifiedData,
		request: ControllerRequest<Session>,
		response: CelosiaResponse,
	) {
		try {
			const userSession = await this.authService.findUserForGetSession(data.user.id)

			if (userSession === null) {
				this.logger.error('User not found during session endpoint.', {
					userId: data.user.id,
					userSessionId: data.user.session.id,
					requestId: request.id,
				})

				return response.sendInternalServerError()
			}

			return response.status(200).json({
				errors: {},
				data: {
					id: userSession.id.toString(),
					user: {
						id: userSession.user.id.toString(),
						name: userSession.user.name,
						username: userSession.user.username,
					},
					ipAddress: userSession.ipAddress,
					createdAt: userSession.createdAt.getTime(),
					expireAt: userSession.expireAt.getTime(),
					lastRefreshAt: userSession.lastRefreshAt.getTime(),
				},
			})
		} catch (error) {
			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}
}

export default Session
