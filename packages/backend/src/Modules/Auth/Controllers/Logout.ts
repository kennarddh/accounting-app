import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import { InvalidStateError, UnauthorizedError } from 'Errors'

import UserSessionService from '../../UserSession/UserSessionService'

class Logout extends Controller {
	constructor(private userSessionService = DI.get(UserSessionService)) {
		super('AuthLogout')
	}

	public async index(
		data: JWTVerifiedData,
		_: ControllerRequest<Logout>,
		response: CelosiaResponse,
	) {
		try {
			await this.userSessionService.logout(data.user.session.id)

			return response.status(204).send()
		} catch (error) {
			if (error instanceof UnauthorizedError) {
				// The purpose of this endpoint is to log the user out, so if the session is already invalid, we can just return a 204 No Content response.
				return response.status(204).send()
			} else if (
				error instanceof InvalidStateError &&
				error.operation === 'logout' &&
				error.state === 'sessionInactive'
			) {
				return response.status(409).json({
					errors: {
						others: [
							{
								resource: ApiErrorResource.UserSession,
								kind: ApiErrorKind.Inactive,
							},
						],
					},
					data: {},
				})
			}

			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}
}

export default Logout
