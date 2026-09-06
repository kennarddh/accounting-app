import { UnpackArray } from 'Types/Types'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import { Prisma } from 'PrismaGenerated/client'

import { DataAccessError, ResourceNotFoundError } from '../../Errors'
import PrismaRepository from '../../Repositories/PrismaRepository'
import { PaginationOptions } from '../../Repositories/Types'

export interface UserSessionQueryOptions {
	select?: Prisma.UserSessionSelect
}

export interface UserSessionQueryUniqueOptions extends UserSessionQueryOptions {
	filter: Prisma.UserSessionWhereUniqueInput
}

export interface UserSessionQueryAllOptions extends UserSessionQueryOptions {
	filter?: Prisma.UserSessionWhereInput
	sort?: Prisma.UserSessionOrderByWithRelationInput | Prisma.UserSessionOrderByWithRelationInput[]
	pagination?: PaginationOptions
}

export interface UserSessionCountOptions {
	filter?: Prisma.UserSessionWhereInput
	sort?: Prisma.UserSessionOrderByWithRelationInput | Prisma.UserSessionOrderByWithRelationInput[]
}

export interface UserSessionUpdateOptions {
	filter: Prisma.UserSessionWhereUniqueInput
	data: Prisma.UserSessionUpdateArgs['data']
}

export interface UserSessionUpdateManyOptions {
	filter?: Prisma.UserSessionWhereInput
	data: Prisma.UserSessionUpdateArgs['data']
}

export interface UserSessionCreateOptions extends UserSessionQueryOptions {
	data: Prisma.UserSessionCreateArgs['data']
}

class UserSessionRepository extends PrismaRepository {
	constructor(prisma: Prisma.TransactionClient) {
		super('UserSessionRepository', prisma)
	}

	async findUnique<T = unknown>(options: UserSessionQueryUniqueOptions) {
		try {
			const result = await this.prisma.userSession.findUnique({
				where: options.filter,
				...(options.select !== undefined ? { select: options.select } : {}),
			})

			return result as (typeof result & T) | null
		} catch (error) {
			this.logger.error('Find unique.', error)

			throw new DataAccessError()
		}
	}

	async findMany<T = unknown>(options: UserSessionQueryAllOptions = {}) {
		const pagination = this.buildPrismaPagination(options.pagination)

		try {
			const result = await this.prisma.userSession.findMany({
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

	async count(options: UserSessionCountOptions): Promise<number> {
		try {
			return await this.prisma.userSession.count({
				...(options.filter !== undefined ? { where: options.filter } : {}),
				...(options.sort !== undefined ? { orderBy: options.sort } : {}),
			})
		} catch (error) {
			this.logger.error('Count.', error)

			throw new DataAccessError()
		}
	}

	async create(options: UserSessionCreateOptions) {
		try {
			return await this.prisma.userSession.create({
				data: options.data,
				...(options.select !== undefined ? { select: options.select } : {}),
			})
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					throw new ResourceNotFoundError('userSession')
				}
			}

			this.logger.error('Create.', error)

			throw new DataAccessError()
		}
	}

	async update(options: UserSessionUpdateOptions) {
		try {
			await this.prisma.userSession.update({
				data: options.data,
				where: options.filter,
				select: { id: true },
			})
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					throw new ResourceNotFoundError('userSession')
				}
			}

			this.logger.error('Update.', error)

			throw new DataAccessError()
		}
	}

	async updateMany(options: UserSessionUpdateManyOptions) {
		try {
			await this.prisma.userSession.updateMany({
				data: RemoveUndefinedValueFromObject(options.data),
				...(options.filter !== undefined ? { where: options.filter } : {}),
			})
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					throw new ResourceNotFoundError('userSession')
				}
			}

			this.logger.error('Update many.', error)

			throw new DataAccessError()
		}
	}
}

export default UserSessionRepository
