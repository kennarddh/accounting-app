import { DI, Injectable, Service } from '@celosiajs/core'

import { JournalEntrySortField, SortOrder } from '@accounting-app/common'

import UnitOfWork from 'Repositories/UnitOfWork/UnitOfWork'

import { InvalidStateError, ResourceNotFoundError } from 'Errors'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import AccountRepository from '../Account/AccountRepository'
import ConfigurationService from '../Configuration/ConfigurationService'
import JournalRepository, { JournalQueryAllOptions } from './JournalRepository'

export interface JournalLineItem {
	id: bigint
	account: { id: bigint; code: string; name: string }
	debit: Prisma.Decimal
	credit: Prisma.Decimal
	description: string
}

export interface JournalEntryDetail {
	id: bigint
	entryNumber: string
	date: Date
	description: string
	createdById: bigint
	createdAt: Date
	updatedAt: Date
	lines: JournalLineItem[]
}

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
	accountId?: bigint // Filter entries touching a specific account
}

export interface JournalFindManyOptions extends FindManyOptions<JournalEntrySortField> {
	filter?: JournalFilterOptions
}

export interface JournalCountOptions {
	filter?: JournalFilterOptions
}

@Injectable()
class JournalService extends Service {
	constructor(
		private unitOfWork = DI.get(UnitOfWork),
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
			createdById: true,
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

	private transformData(
		data: Prisma.JournalEntryGetPayload<{ select: JournalService['dataSelect'] }>,
	): JournalEntryDetail {
		return {
			id: data.id,
			entryNumber: data.entryNumber,
			date: data.date,
			description: data.description,
			createdById: data.createdById,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
			lines: data.lines.map(line => ({
				id: line.id,
				account: { id: line.account.id, code: line.account.code, name: line.account.name },
				debit: line.debit,
				credit: line.credit,
				description: line.description,
			})),
		}
	}

	private buildRepositoryFilterOptions(filter: JournalFilterOptions) {
		const repositoryFilter: Prisma.JournalEntryWhereInput = {}

		if (filter.search !== undefined) {
			repositoryFilter.OR = [
				{ entryNumber: { contains: filter.search, mode: 'insensitive' } },
				{ description: { contains: filter.search, mode: 'insensitive' } },
			]
		}

		if (filter.fromDate !== undefined || filter.toDate !== undefined) {
			repositoryFilter.date = {
				...(filter.fromDate !== undefined ? { gte: filter.fromDate } : {}),
				...(filter.toDate !== undefined ? { lte: filter.toDate } : {}),
			}
		}

		if (filter.createdById !== undefined) {
			repositoryFilter.createdById = filter.createdById
		}

		if (filter.accountId !== undefined) {
			repositoryFilter.lines = {
				some: { accountId: filter.accountId },
			}
		}

		return repositoryFilter
	}

	async findById(id: bigint) {
		return await this.unitOfWork.execute(async transaction => {
			const result = await transaction.getRepository(JournalRepository).findUnique<{
				lines: {
					id: bigint
					account: { id: bigint; code: string; name: string }
					debit: Prisma.Decimal
					credit: Prisma.Decimal
					description: string
					createdAt: Date
				}[]
			}>({
				filter: { id },
				select: this.dataSelect,
			})

			if (result === null) return null

			return this.transformData(result)
		})
	}

	async findMany(options: JournalFindManyOptions = {}) {
		const repositoryOptions: JournalQueryAllOptions = {
			select: this.dataSelect,
		}

		if (options.sort !== undefined) {
			repositoryOptions.sort = {
				[options.sort.field]: options.sort.order ?? SortOrder.Ascending,
			}
		} else {
			repositoryOptions.sort = { date: SortOrder.Descending }
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
			transaction.getRepository(JournalRepository).findMany<{
				lines: {
					id: bigint
					account: { id: bigint; code: string; name: string }
					debit: Prisma.Decimal
					credit: Prisma.Decimal
					description: string
					createdAt: Date
				}[]
			}>(repositoryOptions),
		)
	}

	async count(options: JournalCountOptions): Promise<number> {
		const repositoryOptions: JournalQueryAllOptions = {}

		if (options.filter !== undefined) {
			repositoryOptions.filter = this.buildRepositoryFilterOptions(options.filter)
		}

		return await this.unitOfWork.execute(async transaction =>
			transaction.getRepository(JournalRepository).count(repositoryOptions),
		)
	}

	async list(options: JournalFindManyOptions = {}) {
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
				list: result.map(entry => {
					const transformed = this.transformData(entry)

					return {
						id: transformed.id.toString(),
						entryNumber: transformed.entryNumber,
						date: transformed.date.getTime(),
						description: transformed.description,
						createdById: transformed.createdById.toString(),
						createdAt: transformed.createdAt.getTime(),
						lines: transformed.lines.map(line => ({
							id: line.id.toString(),
							account: {
								id: line.account.id.toString(),
								code: line.account.code,
								name: line.account.name,
							},
							debit: line.debit.toString(),
							credit: line.credit.toString(),
							description: line.description,
						})),
					}
				}),
			}
		})
	}

	async create(data: JournalCreateData) {
		if (data.lines.length < 2) {
			throw new InvalidStateError('create', 'minimumLinesRequired')
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
				throw new InvalidStateError('create', 'lineMustHaveDebitOrCredit')
			}

			// Amounts must never be negative
			if (debit.isNegative() || credit.isNegative()) {
				throw new InvalidStateError('create', 'negativeAmountNotAllowed')
			}

			totalDebit = totalDebit.plus(debit)
			totalCredit = totalCredit.plus(credit)
		}

		if (!totalDebit.equals(totalCredit)) {
			throw new InvalidStateError('create', 'journalEntryUnbalanced')
		}

		return await this.unitOfWork.execute(async transaction => {
			const accountIds = Array.from(new Set(data.lines.map(l => l.accountId)))

			const accounts = await transaction.getRepository(AccountRepository).findMany({
				filter: { id: { in: accountIds } },
			})

			if (accounts.length !== accountIds.length) {
				throw new ResourceNotFoundError('account')
			}

			const hasDisabledAccount = accounts.some(acc => acc.disabledAt !== null)

			if (hasDisabledAccount) {
				throw new InvalidStateError('create', 'accountDisabled')
			}

			return await transaction.getRepository(JournalRepository).create({
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
	}
}

export default JournalService
