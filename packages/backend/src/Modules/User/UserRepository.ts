import { UnpackArray } from 'Types/Types'

import { Prisma } from 'PrismaGenerated/client'

import { DataAccessError } from '../../Errors'
import PrismaRepository from '../../Repositories/PrismaRepository'
import { PaginationOptions } from '../../Repositories/Types'

export interface UserQueryOptions {
	select?: Prisma.UserSelect
}

export interface UserQueryUniqueOptions extends UserQueryOptions {
	filter: Prisma.UserWhereUniqueInput
}

export interface UserQueryAllOptions extends UserQueryOptions {
	filter?: Prisma.UserWhereInput
	sort?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[]
	pagination?: PaginationOptions
}

export interface UserCountOptions {
	filter?: Prisma.UserWhereInput
	sort?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[]
}

export interface UserUpdateOptions {
	filter: Prisma.UserWhereUniqueInput
	data: Prisma.UserUpdateArgs['data']
}

export interface UserCreateOptions extends UserQueryOptions {
	data: Prisma.UserCreateArgs['data']
}

class UserRepository extends PrismaRepository {
	constructor(prisma: Prisma.TransactionClient) {
		super('UserRepository', prisma)
	}

	async findUnique<T = unknown>(options: UserQueryUniqueOptions) {
		try {
			const result = await this.prisma.user.findUnique({
				where: options.filter,
				...(options.select !== undefined ? { select: options.select } : {}),
			})

			return result as (typeof result & T) | null
		} catch (error) {
			this.logger.error('Find unique.', error)

			throw new DataAccessError()
		}
	}

	async findMany<T = unknown>(options: UserQueryAllOptions = {}) {
		const pagination = this.buildPrismaPagination(options.pagination)

		try {
			const result = await this.prisma.user.findMany({
				...(options.filter !== undefined ? { where: options.filter } : {}),
				...(options.sort !== undefined ? { orderBy: options.sort } : {}),
				...(options.select !== undefined ? { select: options.select } : {}),
				...(pagination !== undefined ? { skip: pagination.skip } : {}),
				...(pagination !== undefined ? { take: pagination.take } : {}),
			})

			return result as (UnpackArray<typeof result> & T)[]
		} catch (error) {
			this.logger.error('Find many.', error)

			throw new DataAccessError()
		}
	}

	async count(options: UserCountOptions): Promise<number> {
		try {
			return await this.prisma.user.count({
				...(options.filter !== undefined ? { where: options.filter } : {}),
				...(options.sort !== undefined ? { orderBy: options.sort } : {}),
			})
		} catch (error) {
			this.logger.error('Count.', error)

			throw new DataAccessError()
		}
	}

	async create(options: UserCreateOptions) {
		try {
			return await this.prisma.user.create({
				data: options.data,
				...(options.select !== undefined ? { select: options.select } : {}),
			})
		} catch (error) {
			this.logger.error('Create.', error)

			throw new DataAccessError()
		}
	}

	async update(options: UserUpdateOptions) {
		try {
			await this.prisma.user.update({
				data: options.data,
				where: options.filter,
				select: { id: true },
			})
		} catch (error) {
			this.logger.error('Update.', error)

			throw new DataAccessError()
		}
	}
}

export default UserRepository
