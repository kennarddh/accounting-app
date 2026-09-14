import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ConfigurationService from '../../Configuration/ConfigurationService'
import AuthService from '../AuthService'

class Refresh extends Controller {
	constructor(
		private authService = DI.get(AuthService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('AuthRefresh')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<Refresh>,
		response: CelosiaResponse,
	) {
		const { refreshToken: currentRefreshToken } = request.cookies

		const { accessToken, refreshToken } = await this.authService.refresh(currentRefreshToken)

		response.cookie('refreshToken', refreshToken, {
			secure: this.configurationService.configurations.nodeEnv === 'production',
			httpOnly: true,
			sameSite: 'lax',
			expires: new Date(
				Date.now() + this.configurationService.configurations.tokens.refresh.expire * 1000,
			),
		})

		response.status(200).json({
			errors: {},
			data: {
				token: accessToken,
			},
		})
	}

	public override get cookies() {
		return z.object({
			refreshToken: z.string(),
		})
	}
}

export default Refresh
