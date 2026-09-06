import { UnpackArray } from 'Types/Types'

import { Prisma } from 'PrismaGenerated/client'

import { DataAccessError, ResourceNotFoundError } from '../../Errors'
import PrismaRepository from '../../Repositories/PrismaRepository'
import { PaginationOptions } from '../../Repositories/Types'

export interface AccountQueryOptions {
	select?: Prisma.AccountSelect
}

export interface AccountQueryUniqueOptions extends AccountQueryOptions {
	filter: Prisma.AccountWhereUniqueInput
}

export interface AccountQueryAllOptions extends AccountQueryOptions {
	filter?: Prisma.AccountWhereInput
	sort?: Prisma.AccountOrderByWithRelationInput | Prisma.AccountOrderByWithRelationInput[]
	pagination?: PaginationOptions
}

export interface AccountCountOptions {
	filter?: Prisma.AccountWhereInput
	sort?: Prisma.AccountOrderByWithRelationInput | Prisma.AccountOrderByWithRelationInput[]
}

export interface AccountUpdateOptions {
	filter: Prisma.AccountWhereUniqueInput
	data: Prisma.AccountUpdateArgs['data']
}

export interface AccountCreateOptions extends AccountQueryOptions {
	data: Prisma.AccountCreateArgs['data']
}

class AccountRepository extends PrismaRepository {
	constructor(prisma: Prisma.TransactionClient) {
		super('AccountRepository', prisma)
	}

	async findUnique<T = unknown>(options: AccountQueryUniqueOptions) {
		try {
			const result = await this.prisma.account.findUnique({
				where: options.filter,
				...(options.select !== undefined ? { select: options.select } : {}),
			})

			return result as (typeof result & T) | null
		} catch (error) {
			this.logger.error('Find unique.', error)

			throw new DataAccessError()
		}
	}

	async findMany<T = unknown>(options: AccountQueryAllOptions = {}) {
		const pagination = this.buildPrismaPagination(options.pagination)

		try {
			const result = await this.prisma.account.findMany({
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

	async count(options: AccountCountOptions): Promise<number> {
		try {
			return await this.prisma.account.count({
				...(options.filter !== undefined ? { where: options.filter } : {}),
				...(options.sort !== undefined ? { orderBy: options.sort } : {}),
			})
		} catch (error) {
			this.logger.error('Count.', error)

			throw new DataAccessError()
		}
	}

	async create(options: AccountCreateOptions) {
		try {
			return await this.prisma.account.create({
				data: options.data,
				...(options.select !== undefined ? { select: options.select } : {}),
			})
		} catch (error) {
			this.logger.error('Create.', error)

			throw new DataAccessError()
		}
	}

	async update(options: AccountUpdateOptions) {
		try {
			await this.prisma.account.update({
				data: options.data,
				where: options.filter,
				select: { id: true },
			})
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					throw new ResourceNotFoundError('account')
				}
			}

			this.logger.error('Update.', error)

			throw new DataAccessError()
		}
	}
}

export default AccountRepository
