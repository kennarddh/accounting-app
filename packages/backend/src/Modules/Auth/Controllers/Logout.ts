import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import ConfigurationService from 'Modules/Configuration/ConfigurationService'

import UserSessionService from '../../UserSession/UserSessionService'

class Logout extends Controller {
	constructor(
		private userSessionService = DI.get(UserSessionService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('AuthLogout')
	}

	public async index(
		data: JWTVerifiedData,
		_: ControllerRequest<Logout>,
		response: CelosiaResponse,
	) {
		await this.userSessionService.logout(data.user.session.id)

		response.clearCookie('refreshToken', {
			secure: this.configurationService.configurations.nodeEnv === 'production',
			httpOnly: true,
			sameSite: 'lax',
		})

		response.status(204).send()
	}
}

export default Logout
