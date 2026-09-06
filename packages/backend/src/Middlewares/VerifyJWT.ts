import {
	CelosiaRequest,
	CelosiaResponse,
	DI,
	EmptyObject,
	Middleware,
	NextFunction,
} from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'

import { UnauthorizedError } from 'Errors'

import AuthService from 'Modules/Auth/AuthService'
import { TokenExpiredError, TokenVerifyError } from 'Modules/Auth/Token/Errors'
import { User } from 'Modules/User/UserService'
import { UserSession } from 'Modules/UserSession/UserSessionService'

export interface JWTVerifiedData {
	user: {
		session: UserSession
		data: User
	}
}

export type OptionalJWTVerifiedData = Partial<JWTVerifiedData>

class VerifyJWT<Optional extends boolean> extends Middleware<
	CelosiaRequest,
	CelosiaResponse,
	EmptyObject,
	Optional extends true ? OptionalJWTVerifiedData : JWTVerifiedData
> {
	constructor(
		public optional: Optional,
		private authService = DI.get(AuthService),
	) {
		super('VerifyJWT')
	}

	public override async index(
		_: EmptyObject,
		request: CelosiaRequest,
		response: CelosiaResponse,
		next: NextFunction<Optional extends true ? OptionalJWTVerifiedData : JWTVerifiedData>,
	) {
		const accessTokenHeader = request.header('Access-Token')

		if (!accessTokenHeader) {
			if (this.optional) return next()

			return response.status(401).json({
				errors: {
					others: [
						{
							resource: ApiErrorResource.AccessToken,
							kind: ApiErrorKind.NotFound,
						},
					],
				},
				data: {},
			})
		}

		if (Array.isArray(accessTokenHeader))
			return response.status(401).json({
				errors: {
					others: [
						{
							resource: ApiErrorResource.AccessToken,
							kind: ApiErrorKind.CannotBeArray,
						},
					],
				},
				data: {},
			})

		// Removes "Bearer " prefix
		const accessToken = accessTokenHeader.split(' ')[1]

		if (!accessToken)
			return response.status(401).json({
				errors: {
					others: [
						{
							resource: ApiErrorResource.AccessToken,
							kind: ApiErrorKind.Invalid,
						},
					],
				},
				data: {},
			})

		try {
			const { userSession, user } = await this.authService.verifyAccessToken(accessToken)

			next({
				user: {
					session: userSession,
					data: user,
				},
			})
		} catch (error) {
			if (error instanceof TokenExpiredError) {
				return response.status(401).json({
					errors: {
						others: [
							{
								resource: ApiErrorResource.AccessToken,
								kind: ApiErrorKind.Expired,
							},
						],
					},
					data: {},
				})
			} else if (error instanceof TokenVerifyError) {
				return response.status(401).json({
					errors: {
						others: [
							{
								resource: ApiErrorResource.AccessToken,
								kind: ApiErrorKind.Invalid,
							},
						],
					},
					data: {},
				})
			} else if (error instanceof UnauthorizedError) {
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
}

export default VerifyJWT
