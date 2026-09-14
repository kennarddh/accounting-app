import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

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
		await this.userSessionService.logout(data.user.session.id)

		response.status(204).send()
	}
}

export default Logout
