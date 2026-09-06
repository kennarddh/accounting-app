import { DI, Injectable, Service } from '@celosiajs/core'

import { SortOrder, UserSortField } from '@accounting-app/common'

import { DeepPartialAndUndefined } from 'Types/Types'

import RemoveKeyFromObjectImmutable from 'Utils/RemoveKeyFromObjectImmutable'
import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import UnitOfWork from 'Repositories/UnitOfWork/UnitOfWork'

import { InvalidStateError } from 'Errors'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import PasswordHashService from '../Auth/PasswordHashService'
import ConfigurationService from '../Configuration/ConfigurationService'
import UserRepository, { UserQueryAllOptions } from './UserRepository'

export interface User {
	id: bigint
	name: string
	username: string
	password: string
	createdBy: { id: bigint; name: string } | null
	createdAt: Date
	updatedAt: Date
}

export interface UserCreateData {
	name: string
	username: string
	password: string
	createdById?: bigint
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UserUpdateData {}

export interface UserFilterOptions {
	search?: string
}

export interface UserFindManyOptions extends FindManyOptions<UserSortField> {
	filter?: UserFilterOptions
}

export interface UserCountOptions {
	filter?: UserFilterOptions
}

@Injectable()
class UserService extends Service {
	constructor(
		private unitOfWork = DI.get(UnitOfWork),
		private passwordHashService = DI.get(PasswordHashService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('UserService')
	}

	private transformData(
		data: Prisma.UserGetPayload<{ select: UserService['dataSelect'] }>,
	): User {
		return {
			id: data.id,
			name: data.name,
			username: data.username,
			password: data.password,
			createdBy:
				data.createdBy === null
					? null
					: {
							id: data.createdBy.id,
							name: data.createdBy.name,
						},
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
		}
	}

	private buildRepositoryFilterOptions(filter: UserFilterOptions) {
		const repositoryFilter: Prisma.UserWhereInput = {}

		if (filter.search !== undefined)
			repositoryFilter.OR = [
				{
					name: {
						contains: filter.search,
						mode: 'insensitive',
					},
				},
				{
					username: {
						contains: filter.search,
						mode: 'insensitive',
					},
				},
			]

		return repositoryFilter
	}

	private get dataSelect() {
		return {
			id: true,
			username: true,
			password: true,
			createdBy: { select: { id: true, name: true } },
			name: true,
			createdAt: true,
			updatedAt: true,
		} satisfies Prisma.UserSelect
	}

	async findById(id: bigint) {
		return await this.unitOfWork.execute(async transaction => {
			const result = await transaction.getRepository(UserRepository).findUnique<{
				createdBy: { id: bigint; name: string } | null
			}>({
				filter: { id },
				select: this.dataSelect,
			})

			if (result === null) return null

			return this.transformData(result)
		})
	}

	async findByUsername(username: string) {
		return await this.unitOfWork.execute(async transaction => {
			const result = await transaction.getRepository(UserRepository).findUnique<{
				createdBy: { id: bigint; name: string } | null
				name: string
			}>({ filter: { username }, select: this.dataSelect })

			if (result === null) return null

			return this.transformData(result)
		})
	}

	async findMany(options: UserFindManyOptions = {}) {
		const repositoryOptions: UserQueryAllOptions = {
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
			transaction
				.getRepository(UserRepository)
				.findMany<{ createdBy: { id: bigint; name: string } | null }>(repositoryOptions),
		)
	}

	async count(options: UserCountOptions): Promise<number> {
		const repositoryOptions: UserQueryAllOptions = {}

		if (options.filter !== undefined) {
			repositoryOptions.filter = this.buildRepositoryFilterOptions(options.filter)
		}

		return await this.unitOfWork.execute(async transaction =>
			transaction.getRepository(UserRepository).count(repositoryOptions),
		)
	}

	async list(options: UserFindManyOptions = {}) {
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
				list: result.map(user => ({
					id: user.id.toString(),
					name: user.name,
					username: user.username,
					createdBy:
						user.createdBy === null
							? null
							: { id: user.createdBy.id.toString(), name: user.createdBy.name },
					createdAt: user.createdAt.getTime(),
					updatedAt: user.updatedAt.getTime(),
				})),
			}
		})
	}

	async create(data: UserCreateData) {
		return await this.unitOfWork.execute(async transaction => {
			const user = await this.findByUsername(data.username)

			if (user !== null) throw new InvalidStateError('create', 'userAlreadyExists')

			const passwordDigest = await this.passwordHashService.hash(data.password)

			const newData = RemoveKeyFromObjectImmutable(data, ['password'])

			return await transaction.getRepository(UserRepository).create({
				data: {
					...newData,
					password: passwordDigest,
				},
			})
		})
	}

	async updatePassword(id: bigint, newPassword: string) {
		const passworDigest = await this.passwordHashService.hash(newPassword)

		await this.unitOfWork.execute(async transaction =>
			transaction
				.getRepository(UserRepository)
				.update({ filter: { id }, data: { password: passworDigest } }),
		)
	}

	async update(id: bigint, data: DeepPartialAndUndefined<UserUpdateData>) {
		const updateData: Prisma.UserUpdateArgs['data'] = RemoveUndefinedValueFromObject(data)

		await this.unitOfWork.execute(async transaction => {
			await transaction
				.getRepository(UserRepository)
				.update({ filter: { id }, data: updateData })
		})
	}
}

export default UserService
