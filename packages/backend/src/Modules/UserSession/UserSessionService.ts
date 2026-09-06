import { DI, Injectable, Service } from '@celosiajs/core'

import { SortOrder, UserSessionSortField } from '@accounting-app/common'

import UnitOfWork from 'Repositories/UnitOfWork/UnitOfWork'

import { InvalidStateError, ResourceNotFoundError } from 'Errors'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'
import UserSessionRepository, { UserSessionQueryAllOptions } from './UserSessionRepository'

export interface UserSession {
	id: bigint
	accessTokenJti: string
	refreshTokenJti: string
	ipAddress: string
	user: { id: bigint; name: string }
	loggedOutAt: Date | null
	revokedAt: Date | null
	expireAt: Date
	lastRefreshAt: Date
	createdAt: Date
}

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

export interface UserSessionCountOptions {
	filter?: UserSessionFilterOptions
}

@Injectable()
class UserSessionService extends Service {
	constructor(
		private unitOfWork = DI.get(UnitOfWork),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('UserService')
	}

	private transformData(
		data: Prisma.UserSessionGetPayload<{
			select: UserSessionService['dataSelect']
		}>,
	): UserSession {
		return {
			id: data.id,
			accessTokenJti: data.accessTokenJti,
			refreshTokenJti: data.refreshTokenJti,
			ipAddress: data.ipAddress,
			user: {
				id: data.user.id,
				name: data.user.name,
			},
			loggedOutAt: data.loggedOutAt,
			revokedAt: data.revokedAt,
			expireAt: data.expireAt,
			lastRefreshAt: data.lastRefreshAt,
			createdAt: data.createdAt,
		}
	}

	private buildRepositoryFilterOptions(filter: UserSessionFilterOptions) {
		const repositoryFilter: Prisma.UserSessionWhereInput = {}

		if (filter.userId !== undefined) repositoryFilter.userId = filter.userId

		if (filter.includeInactive !== true) {
			repositoryFilter.expireAt = { gte: new Date() }
			repositoryFilter.revokedAt = null
			repositoryFilter.loggedOutAt = null
		}

		return repositoryFilter
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
		return await this.unitOfWork.execute(async transaction => {
			const result = await transaction.getRepository(UserSessionRepository).findUnique<{
				user: { id: bigint; name: string }
			}>({
				filter: { id },
				select: this.dataSelect,
			})

			if (result === null) return null

			return this.transformData(result)
		})
	}

	async findByAccessTokenJti(accessTokenJti: string) {
		return await this.unitOfWork.execute(async transaction => {
			const result = await transaction.getRepository(UserSessionRepository).findUnique<{
				user: { id: bigint; name: string }
			}>({
				filter: { accessTokenJti },
				select: this.dataSelect,
			})

			if (result === null) return null

			return this.transformData(result)
		})
	}

	async findByRefreshTokenJti(refreshTokenJti: string) {
		return await this.unitOfWork.execute(async transaction => {
			const result = await transaction.getRepository(UserSessionRepository).findUnique<{
				user: { id: bigint; name: string }
			}>({
				filter: { refreshTokenJti },
				select: this.dataSelect,
			})

			if (result === null) return null

			return this.transformData(result)
		})
	}

	async findMany(options: UserSessionFindManyOptions = {}) {
		const repositoryOptions: UserSessionQueryAllOptions = {
			select: this.dataSelect,
		}

		if (options.sort !== undefined) {
			repositoryOptions.sort = {
				[options.sort.field]: options.sort.order ?? SortOrder.Ascending,
			}
		}

		if (options.filter !== undefined) {
			repositoryOptions.filter = this.buildRepositoryFilterOptions(options.filter)
		}

		if (options.pagination !== undefined) {
			repositoryOptions.pagination = {
				limit: Math.min(
					options.pagination.limit ??
						this.configurationService.configurations.pagination.defaultLimit,
					this.configurationService.configurations.pagination.defaultMaxLimit,
				),
				page: options.pagination.page ?? 0,
			}
		}

		return await this.unitOfWork.execute(async transaction =>
			transaction.getRepository(UserSessionRepository).findMany<{
				user: { id: bigint; name: string }
			}>(repositoryOptions),
		)
	}

	async count(options: UserSessionCountOptions): Promise<number> {
		const repositoryOptions: UserSessionQueryAllOptions = {}

		if (options.filter !== undefined) {
			repositoryOptions.filter = this.buildRepositoryFilterOptions(options.filter)
		}

		return await this.unitOfWork.execute(async transaction =>
			transaction.getRepository(UserSessionRepository).count(repositoryOptions),
		)
	}

	async list(options: UserSessionFindManyOptions = {}) {
		return await this.unitOfWork.execute(async () => {
			const result = await this.findMany(options)
			const count = await this.count(options)

			return {
				pagination: {
					page: options.pagination?.page ?? 0,
					limit:
						options.pagination?.limit ??
						this.configurationService.configurations.pagination.defaultLimit,
					total: count,
				},
				list: result.map(userSession => ({
					id: userSession.id.toString(),
					user: {
						id: userSession.user.id.toString(),
						name: userSession.user.name,
					},
					ipAddress: userSession.ipAddress,
					createdAt: userSession.createdAt.getTime(),
					expireAt: userSession.expireAt.getTime(),
					lastRefreshAt: userSession.lastRefreshAt.getTime(),
					loggedOutAt: userSession.loggedOutAt?.getTime() ?? null,
					revokedAt: userSession.revokedAt?.getTime() ?? null,
				})),
			}
		})
	}

	async create(data: UserSessionCreateData) {
		return await this.unitOfWork.execute(async transaction => {
			return await transaction.getRepository(UserSessionRepository).create({
				data: {
					...data,
					accessTokenJti: this.generateJti(),
					refreshTokenJti: this.generateJti(),
				},
			})
		})
	}

	async revoke(id: bigint) {
		await this.unitOfWork.execute(async transaction => {
			const userSession = await this.findById(id)

			if (userSession === null) throw new ResourceNotFoundError('userSession')

			if (!this.isSessionActive(userSession))
				throw new InvalidStateError('revoke', 'sessionInactive')

			await transaction
				.getRepository(UserSessionRepository)
				.update({ filter: { id }, data: { revokedAt: new Date() } })
		})
	}

	async revokeAllByUserId(userId: bigint) {
		await this.unitOfWork.execute(async transaction => {
			await transaction.getRepository(UserSessionRepository).updateMany({
				filter: {
					userId,
					revokedAt: null,
					loggedOutAt: null,
					expireAt: { gte: new Date() },
				},
				data: {
					revokedAt: new Date(),
				},
			})
		})
	}

	async logout(id: bigint) {
		await this.unitOfWork.execute(async transaction => {
			const userSession = await this.findById(id)

			if (userSession === null) throw new ResourceNotFoundError('userSession')

			if (!this.isSessionActive(userSession))
				throw new InvalidStateError('logout', 'sessionInactive')

			await transaction
				.getRepository(UserSessionRepository)
				.update({ filter: { id }, data: { loggedOutAt: new Date() } })
		})
	}

	isSessionActive(userSession: UserSession) {
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
		await this.unitOfWork.execute(async transaction => {
			await transaction.getRepository(UserSessionRepository).update({
				filter: { id },
				data: {
					lastRefreshAt: new Date(),
					accessTokenJti: this.generateJti(),
					refreshTokenJti: this.generateJti(),
					expireAt,
				},
			})
		})
	}
}

export default UserSessionService
