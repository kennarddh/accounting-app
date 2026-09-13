import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import handleControllerError from 'Utils/HandleControllerError'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

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
			return handleControllerError(error, response, this.logger)
		}
	}
}

export default Logout
