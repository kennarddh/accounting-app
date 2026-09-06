import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind } from '@accounting-app/common'
import z from 'zod/v4'

import { UnauthorizedError } from 'Errors'

import ConfigurationService from '../../Configuration/ConfigurationService'
import AuthService from '../AuthService'

class Login extends Controller {
	constructor(
		private authService = DI.get(AuthService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('AuthLogin')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<Login>,
		response: CelosiaResponse,
	) {
		const { username, password } = request.body

		if (request.ip === undefined) {
			this.logger.warn('Missing IP address.', { requestId: request.id })

			return response.sendInternalServerError()
		}

		try {
			const { tokens, user } = await this.authService.login(username, password, request.ip)

			response.cookie('refreshToken', tokens.refreshToken, {
				secure: this.configurationService.configurations.nodeEnv === 'production',
				httpOnly: true,
				sameSite: 'lax',
				expires: new Date(
					Date.now() +
						this.configurationService.configurations.tokens.refresh.expire * 1000,
				),
			})

			return response.status(200).json({
				errors: {},
				data: {
					token: tokens.accessToken,
					user: {
						id: user.id.toString(),
						name: user.name,
						username: user.username,
					},
				},
			})
		} catch (error) {
			if (error instanceof UnauthorizedError) {
				return response.status(401).json({
					errors: {
						others: [
							{
								resource: null,
								kind: ApiErrorKind.Unauthorized,
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

	public override get body() {
		return z.object({
			username: z
				.string()
				.trim()
				.min(1)
				.max(50)
				.regex(/^(?!.*\s)/g, 'Must not contains white space.'),
			password: z
				.string()
				.min(8)
				.max(100)
				.regex(/^(?!.*\s)/g, 'Must not contains white space.'),
		})
	}
}

export default Login
