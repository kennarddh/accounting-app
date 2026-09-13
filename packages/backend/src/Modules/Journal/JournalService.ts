import { DI, Injectable, Service } from '@celosiajs/core'

import { ApiErrorResource, JournalEntrySortField, SortOrder } from '@accounting-app/common'

import { BusinessRuleError, NotFoundError, ResourceDisabledError } from 'Errors'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'

export interface JournalLineCreateData {
	accountId: bigint
	debit: number | string | Prisma.Decimal
	credit: number | string | Prisma.Decimal
	description: string
}

export interface JournalCreateData {
	entryNumber: string
	date: Date
	description: string
	createdById: bigint
	lines: JournalLineCreateData[]
}

export interface JournalFilterOptions {
	search?: string
	fromDate?: Date
	toDate?: Date
	createdById?: bigint
	accountId?: bigint
}

export interface JournalFindManyOptions extends FindManyOptions<JournalEntrySortField> {
	filter?: JournalFilterOptions
}

@Injectable()
class JournalService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('JournalService')
	}

	private get dataSelect() {
		return {
			id: true,
			entryNumber: true,
			date: true,
			description: true,
			createdBy: {
				select: {
					id: true,
					name: true,
				},
			},
			createdAt: true,
			updatedAt: true,
			lines: {
				select: {
					id: true,
					account: {
						select: {
							id: true,
							code: true,
							name: true,
						},
					},
					debit: true,
					credit: true,
					description: true,
					createdAt: true,
				},
			},
		} satisfies Prisma.JournalEntrySelect
	}

	private buildWhereFilter(filter?: JournalFilterOptions) {
		if (!filter) return {}

		const where: Prisma.JournalEntryWhereInput = {}

		if (filter.search !== undefined) {
			where.OR = [
				{ entryNumber: { contains: filter.search, mode: 'insensitive' } },
				{ description: { contains: filter.search, mode: 'insensitive' } },
			]
		}

		if (filter.fromDate !== undefined || filter.toDate !== undefined) {
			where.date = {
				...(filter.fromDate !== undefined ? { gte: filter.fromDate } : {}),
				...(filter.toDate !== undefined ? { lte: filter.toDate } : {}),
			}
		}

		if (filter.createdById !== undefined) {
			where.createdById = filter.createdById
		}

		if (filter.accountId !== undefined) {
			where.lines = {
				some: { accountId: filter.accountId },
			}
		}

		return where
	}

	async findById(id: bigint) {
		try {
			return await this.db.client.journalEntry.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}

	async findMany(options: JournalFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.AccountOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: { id: SortOrder.Ascending }

		const [total, journalEntries] = await Promise.all([
			this.db.client.journalEntry.count({ where }),
			this.db.client.journalEntry.findMany({
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
			items: journalEntries,
		}
	}

	async create(data: JournalCreateData) {
		if (data.lines.length < 2) {
			throw new BusinessRuleError(
				ApiErrorResource.JournalEntry,
				'At least two lines are required.',
				{
					field: 'lines',
				},
			)
		}

		let totalDebit = new Prisma.Decimal(0)
		let totalCredit = new Prisma.Decimal(0)

		for (const line of data.lines) {
			const debit = new Prisma.Decimal(line.debit || 0)
			const credit = new Prisma.Decimal(line.credit || 0)

			// Exactly one must be greater than 0
			const hasDebit = debit.greaterThan(0)
			const hasCredit = credit.greaterThan(0)

			if ((hasDebit && hasCredit) || (!hasDebit && !hasCredit)) {
				throw new BusinessRuleError(
					ApiErrorResource.JournalEntry,
					'Debits and credits must be either both positive or both negative.',
					{
						field: 'lines',
					},
				)
			}

			// Amounts must never be negative
			if (debit.isNegative() || credit.isNegative()) {
				throw new BusinessRuleError(
					ApiErrorResource.JournalEntry,
					'Debits and credits cannot be negative.',
					{
						field: 'lines',
					},
				)
			}

			totalDebit = totalDebit.plus(debit)
			totalCredit = totalCredit.plus(credit)
		}

		if (!totalDebit.equals(totalCredit)) {
			throw new BusinessRuleError(
				ApiErrorResource.JournalEntry,
				'Debits and credits must be equal.',
				{
					field: 'lines',
					meta: {
						debitTotal: totalDebit.toString(),
						creditTotal: totalCredit.toString(),
						difference: totalDebit.minus(totalCredit).abs().toString(),
					},
				},
			)
		}

		try {
			return await this.db.transaction(async tx => {
				const accountIds = Array.from(new Set(data.lines.map(l => l.accountId)))

				const accounts = await tx.account.findMany({
					where: { id: { in: accountIds } },
				})

				if (accounts.length !== accountIds.length) {
					throw new NotFoundError(ApiErrorResource.Account)
				}

				const disabledAccount = accounts.find(acc => acc.disabledAt !== null)

				if (disabledAccount) {
					throw new ResourceDisabledError(ApiErrorResource.Account, {
						field: 'accountId',
						meta: {
							id: disabledAccount.id.toString(),
							code: disabledAccount.code,
							name: disabledAccount.name,
						},
					})
				}

				return await tx.journalEntry.create({
					data: {
						entryNumber: data.entryNumber,
						date: data.date,
						description: data.description,
						createdById: data.createdById,
						lines: {
							create: data.lines.map(line => ({
								accountId: line.accountId,
								debit: new Prisma.Decimal(line.debit),
								credit: new Prisma.Decimal(line.credit),
								description: line.description,
							})),
						},
					},
				})
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.JournalEntry)
		}
	}
}

export default JournalService
