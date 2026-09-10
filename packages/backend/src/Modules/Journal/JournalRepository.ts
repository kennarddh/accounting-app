import { UnpackArray } from 'Types/Types'

import { Prisma } from 'PrismaGenerated/client'

import { DataAccessError, InvalidStateError } from '../../Errors'
import PrismaRepository from '../../Repositories/PrismaRepository'
import { PaginationOptions } from '../../Repositories/Types'

export interface JournalQueryOptions {
	select?: Prisma.JournalEntrySelect
	include?: Prisma.JournalEntryInclude
}

export interface JournalQueryUniqueOptions extends JournalQueryOptions {
	filter: Prisma.JournalEntryWhereUniqueInput
}

export interface JournalQueryAllOptions extends JournalQueryOptions {
	filter?: Prisma.JournalEntryWhereInput
	sort?:
		Prisma.JournalEntryOrderByWithRelationInput | Prisma.JournalEntryOrderByWithRelationInput[]
	pagination?: PaginationOptions
}

export interface JournalCountOptions {
	filter?: Prisma.JournalEntryWhereInput
	sort?:
		Prisma.JournalEntryOrderByWithRelationInput | Prisma.JournalEntryOrderByWithRelationInput[]
}

export interface JournalCreateOptions extends JournalQueryOptions {
	data: Prisma.JournalEntryCreateArgs['data']
}

class JournalRepository extends PrismaRepository {
	constructor(prisma: Prisma.TransactionClient) {
		super('JournalRepository', prisma)
	}

	async findUnique<T = unknown>(options: JournalQueryUniqueOptions) {
		try {
			const result = await this.prisma.journalEntry.findUnique({
				where: options.filter,
				...(options.select !== undefined ? { select: options.select } : {}),
				...(options.include !== undefined ? { include: options.include } : {}),
			})

			return result as (typeof result & T) | null
		} catch (error) {
			this.logger.error('Find unique.', error)
			throw new DataAccessError()
		}
	}

	async findMany<T = unknown>(options: JournalQueryAllOptions = {}) {
		const pagination = this.buildPrismaPagination(options.pagination)

		try {
			const result = await this.prisma.journalEntry.findMany({
				...(options.filter !== undefined ? { where: options.filter } : {}),
				...(options.sort !== undefined ? { orderBy: options.sort } : {}),
				...(options.select !== undefined ? { select: options.select } : {}),
				...(options.include !== undefined ? { include: options.include } : {}),
				...(pagination !== undefined ? { skip: pagination.skip } : {}),
				...(pagination !== undefined ? { take: pagination.take } : {}),
			})

			return result as (UnpackArray<typeof result> & T)[]
		} catch (error) {
			this.logger.error('Find many.', error)
			throw new DataAccessError()
		}
	}

	async count(options: JournalCountOptions): Promise<number> {
		try {
			return await this.prisma.journalEntry.count({
				...(options.filter !== undefined ? { where: options.filter } : {}),
				...(options.sort !== undefined ? { orderBy: options.sort } : {}),
			})
		} catch (error) {
			this.logger.error('Count.', error)
			throw new DataAccessError()
		}
	}

	async create(options: JournalCreateOptions) {
		try {
			return await this.prisma.journalEntry.create({
				data: options.data,
				...(options.select !== undefined ? { select: options.select } : {}),
				...(options.include !== undefined ? { include: options.include } : {}),
			})
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
				const constraintIndex = (error.meta as any)?.driverAdapterError?.cause?.constraint
					?.index

				if (constraintIndex === 'journal_entries_entryNumber_key') {
					throw new InvalidStateError('create', 'duplicateEntryNumber')
				}
			}

			this.logger.error('Create.', error)

			throw new DataAccessError()
		}
	}
}

export default JournalRepository
