import { DI, Injectable, Service } from '@celosiajs/core'

import { ApiErrorResource, SortOrder, UserSessionSortField } from '@accounting-app/common'

import { UnauthorizedError } from 'Errors'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'

export type UserSession = Prisma.UserSessionGetPayload<{
	select: {
		id: true
		accessTokenJti: true
		refreshTokenJti: true
		ipAddress: true
		user: { select: { id: true; name: true } }
		loggedOutAt: true
		revokedAt: true
		expireAt: true
		lastRefreshAt: true
		createdAt: true
	}
}>

export interface UserSessionCreateData {
	ipAddress: string
	userId: bigint
	expireAt: Date
}

export interface UserSessionFilterOptions {
	userId?: bigint
	includeInactive?: boolean
}

export interface UserSessionFindManyOptions extends FindManyOptions<UserSessionSortField> {
	filter?: UserSessionFilterOptions
}

@Injectable()
class UserSessionService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('UserService')
	}

	private buildWhereFilter(filter?: UserSessionFilterOptions) {
		if (!filter) return {}

		const where: Prisma.UserSessionWhereInput = {}

		if (filter.userId !== undefined) where.userId = filter.userId

		if (filter.includeInactive !== true) {
			where.expireAt = { gte: new Date() }
			where.revokedAt = null
			where.loggedOutAt = null
		}

		return where
	}

	private get dataSelect() {
		return {
			id: true,
			accessTokenJti: true,
			refreshTokenJti: true,
			ipAddress: true,
			user: { select: { id: true, name: true } },
			loggedOutAt: true,
			revokedAt: true,
			expireAt: true,
			lastRefreshAt: true,
			createdAt: true,
		} satisfies Prisma.UserSessionSelect
	}

	private generateJti() {
		return crypto.randomUUID()
	}

	async findById(id: bigint) {
		try {
			return await this.db.client.userSession.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}

	async findMany(options: UserSessionFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.UserSessionOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: { id: SortOrder.Ascending }

		const [total, userSessions] = await Promise.all([
			this.db.client.userSession.count({ where }),
			this.db.client.userSession.findMany({
				where,
				select: this.dataSelect,
				skip,
				take,
				orderBy,
			}),
		])

		return {
			pagination: {
				page: options.pagination?.page ?? 0,
				limit: take,
				total,
			},
			items: userSessions,
		}
	}

	async create(data: UserSessionCreateData) {
		try {
			return await this.db.client.userSession.create({
				data: {
					...data,
					accessTokenJti: this.generateJti(),
					refreshTokenJti: this.generateJti(),
				},
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.UserSession)
		}
	}

	async revoke(id: bigint) {
		try {
			await this.db.client.userSession.update({
				where: { id },
				data: { revokedAt: new Date() },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.UserSession)
		}
	}

	async revokeAllByUserId(userId: bigint) {
		try {
			await this.db.client.userSession.updateMany({
				where: {
					userId,
					revokedAt: null,
					loggedOutAt: null,
					expireAt: { gte: new Date() },
				},
				data: {
					revokedAt: new Date(),
				},
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.UserSession)
		}
	}

	async logout(id: bigint) {
		try {
			await this.db.client.userSession.update({
				where: {
					id,
					loggedOutAt: null,
					revokedAt: null,
				},
				data: {
					loggedOutAt: new Date(),
				},
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.UserSession)
		}
	}

	public isSessionActive(
		userSession: Pick<UserSession, 'revokedAt' | 'loggedOutAt' | 'expireAt'>,
	) {
		if (userSession.revokedAt !== null) return false
		if (userSession.loggedOutAt !== null) return false

		// Leeway is used to account for clock skew and minor network latency.
		if (
			userSession.expireAt.getTime() <
			new Date().getTime() -
				this.configurationService.configurations.tokens.refresh.clockTolerance * 1000
		)
			return false

		return true
	}

	async refresh(id: bigint, expireAt: Date) {
		try {
			return await this.db.client.userSession.update({
				where: { id },
				data: {
					lastRefreshAt: new Date(),
					accessTokenJti: this.generateJti(),
					refreshTokenJti: this.generateJti(),
					expireAt,
				},
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.UserSession)
		}
	}

	async getSessionDetails(id: bigint) {
		const session = await this.db.client.userSession.findUnique({
			where: { id },
			include: { user: true },
		})

		if (!session || !this.isSessionActive(session)) {
			throw new UnauthorizedError('Session is invalid or expired.')
		}

		return session
	}
}

export default UserSessionService
