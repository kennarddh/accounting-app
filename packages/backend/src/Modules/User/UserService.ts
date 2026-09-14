import { DI, Injectable, Service } from '@celosiajs/core'

import { ApiErrorResource, SortOrder, UserSortField } from '@accounting-app/common'

import { DeepPartialAndUndefined } from 'Types/Types'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import PasswordHashService from '../Auth/PasswordHashService'
import ConfigurationService from '../Configuration/ConfigurationService'

export type User = Prisma.UserGetPayload<{
	select: {
		id: true
		username: true
		password: true
		createdBy: { select: { id: true; name: true } }
		name: true
		createdAt: true
		updatedAt: true
	}
}>

export interface UserCreateData {
	name: string
	username: string
	password: string
	createdById?: bigint
}

export interface UserUpdateData {
	name?: string
}

export interface UserFilterOptions {
	search?: string
}

export interface UserFindManyOptions extends FindManyOptions<UserSortField> {
	filter?: UserFilterOptions
}

@Injectable()
class UserService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private passwordHashService = DI.get(PasswordHashService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('UserService')
	}

	private buildWhereFilter(filter?: UserFilterOptions) {
		if (!filter) return {}

		const where: Prisma.UserWhereInput = {}

		if (filter.search !== undefined)
			where.OR = [
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

		return where
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
		try {
			return await this.db.client.user.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}

	async findByUsername(username: string) {
		return await this.db.client.user.findUnique({
			where: { username },
			select: this.dataSelect,
		})
	}

	async findMany(options: UserFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.UserOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: { id: SortOrder.Ascending }

		const [total, users] = await Promise.all([
			this.db.client.user.count({ where }),
			this.db.client.user.findMany({
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
			items: users,
		}
	}

	async create(data: UserCreateData) {
		const passwordDigest = await this.passwordHashService.hash(data.password)

		const { password: _, ...newData } = data

		try {
			// If the username is taken, the DB will reject it instantly.
			return await this.db.client.user.create({
				data: {
					...newData,
					password: passwordDigest,
				},
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}

	async updatePassword(id: bigint, newPassword: string) {
		const passwordDigest = await this.passwordHashService.hash(newPassword)

		try {
			// 2. Update directly. (Will throw NotFoundError if `id` doesn't exist).
			await this.db.client.user.update({
				where: { id },
				data: { password: passwordDigest },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}

	async update(id: bigint, data: DeepPartialAndUndefined<UserUpdateData>) {
		const updateData: Prisma.UserUpdateArgs['data'] = RemoveUndefinedValueFromObject(data)

		try {
			await this.db.client.user.update({
				where: { id },
				data: updateData,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}
}

export default UserService
