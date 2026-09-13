import { DI, Injectable, Service } from '@celosiajs/core'

import { UnauthorizedError } from 'Errors'

import ConfigurationService from 'Modules/Configuration/ConfigurationService'
import DatabaseService from 'Modules/Database/DatabaseService'
import { handlePrismaError } from 'Modules/Database/PrismaUtils'
import UserService from 'Modules/User/UserService'
import UserSessionService from 'Modules/UserSession/UserSessionService'

import { UserSession } from 'PrismaGenerated/client'

import PasswordHashService from './PasswordHashService'
import AccessTokenService, { AccessTokenJWTPayload } from './Token/AccessTokenService'
import RefreshTokenService, { RefreshTokenJWTPayload } from './Token/RefreshTokenService'

@Injectable()
class AuthService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private userService = DI.get(UserService),
		private userSessionService = DI.get(UserSessionService),
		private passwordHashService = DI.get(PasswordHashService),
		private accessTokenService = DI.get(AccessTokenService),
		private refreshTokenService = DI.get(RefreshTokenService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('AuthService')
	}

	async createTokens(userSession: UserSession, currentTime: number, expireAt: number) {
		const accessTokenPayload = {
			jti: userSession.accessTokenJti,
			iat: currentTime,
			user: {
				id: userSession.userId.toString(),
				session: {
					id: userSession.id.toString(),
				},
			},
		} satisfies AccessTokenJWTPayload

		const accessToken = await this.accessTokenService.sign(accessTokenPayload)

		const refreshTokenPayload = {
			jti: userSession.refreshTokenJti,
			iat: currentTime,
			exp: expireAt,
		} satisfies RefreshTokenJWTPayload

		const refreshToken = await this.refreshTokenService.sign(refreshTokenPayload)

		return {
			accessToken,
			refreshToken,
		}
	}

	async login(username: string, password: string, ipAddress: string) {
		const user = await this.userService.findByUsername(username)

		if (user === null) throw new UnauthorizedError()

		const isPasswordCorrect = await this.passwordHashService.verify(user.password, password)

		if (!isPasswordCorrect) throw new UnauthorizedError()

		const currentTime = Math.floor(new Date().getTime() / 1000)
		const expireAt =
			currentTime + this.configurationService.configurations.tokens.refresh.expire

		const userSession = await this.userSessionService.create({
			userId: user.id,
			ipAddress,
			expireAt: new Date(expireAt * 1000),
		})

		const tokens = await this.createTokens(userSession, currentTime, expireAt)

		return {
			tokens: {
				accessToken: `Bearer ${tokens.accessToken}`,
				refreshToken: tokens.refreshToken,
			},
			user: {
				id: user.id,
				name: user.name,
				username: user.username,
			},
		}
	}

	async refresh(refreshToken: string) {
		const currentRefreshTokenPayload = await this.refreshTokenService.verify(refreshToken)

		try {
			const userSession = await this.db.client.userSession.findUnique({
				where: { refreshTokenJti: currentRefreshTokenPayload.jti },
				include: { user: true },
			})

			if (userSession === null) {
				this.logger.warn('User session not found while refresh.', {
					refreshTokenJti: currentRefreshTokenPayload.jti,
				})

				throw new UnauthorizedError()
			}

			if (!this.userSessionService.isSessionActive(userSession)) throw new UnauthorizedError()

			// TODO: Handle this potential account compromise better, e.g. add event log, send notification, or revoke all sessions for this user.
			// Potential account compromise, if the refresh token was used after the last refresh token was issued.
			if (
				currentRefreshTokenPayload.iat <
				userSession.lastRefreshAt.getTime() / 1000 -
					this.configurationService.configurations.tokens.refresh.clockTolerance
			) {
				this.logger.warn('Potential token replay/compromise detected.', {
					sessionId: userSession.id,
				})
				throw new UnauthorizedError()
			}

			const currentTime = Math.floor(new Date().getTime() / 1000)
			const expireAt =
				currentTime + this.configurationService.configurations.tokens.refresh.expire

			await this.userSessionService.refresh(userSession.id, new Date(expireAt * 1000))

			const newUserSession = await this.userSessionService.findById(userSession.id)

			if (newUserSession === null) {
				this.logger.warn('User session not found after refresh.', {
					userSessionId: userSession.id,
				})

				throw new UnauthorizedError()
			}

			const tokens = await this.createTokens(
				{
					...newUserSession,
					userId: newUserSession.user.id,
				},
				currentTime,
				expireAt,
			)

			return {
				accessToken: `Bearer ${tokens.accessToken}`,
				refreshToken: tokens.refreshToken,
			}
		} catch (error) {
			handlePrismaError(error, 'userSession')
		}
	}

	async verifyAccessToken(accessToken: string) {
		const currentAccessTokenPayload = await this.accessTokenService.verify(accessToken)

		return {
			user: {
				id: BigInt(currentAccessTokenPayload.user.id),
				session: {
					id: BigInt(currentAccessTokenPayload.user.session.id),
				},
			},
		}
	}

	async findUserForGetSession(userSessionId: bigint) {
		return await this.db.client.userSession.findUnique({
			where: { id: userSessionId },
			select: {
				id: true,
				ipAddress: true,
				createdAt: true,
				expireAt: true,
				lastRefreshAt: true,
				user: {
					select: {
						id: true,
						name: true,
						username: true,
					},
				},
			},
		})
	}
}

export default AuthService
