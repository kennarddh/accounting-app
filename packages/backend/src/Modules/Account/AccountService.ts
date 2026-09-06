import { DI, Injectable, Service } from '@celosiajs/core'

import {
	AccountSortField,
	AccountType,
	FilterEnableDisable,
	SortOrder,
} from '@accounting-app/common'

import { DeepPartialAndUndefined } from 'Types/Types'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import UnitOfWork from 'Repositories/UnitOfWork/UnitOfWork'

import { InvalidStateError, ResourceNotFoundError } from 'Errors'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'
import AccountRepository, { AccountQueryAllOptions } from './AccountRepository'

export interface Account {
	id: bigint
	code: string
	name: string
	type: AccountType
	createdAt: Date
	updatedAt: Date
	disabledAt: Date | null
}

export interface AccountCreateData {
	code: string
	name: string
	type: AccountType
}

export interface AccountUpdateData {
	code?: string
	name?: string
}

export interface AccountFilterOptions {
	search?: string
	types?: AccountType[]
	active?: FilterEnableDisable
}

export interface AccountFindManyOptions extends FindManyOptions<AccountSortField> {
	filter?: AccountFilterOptions
}

export interface AccountCountOptions {
	filter?: AccountFilterOptions
}

@Injectable()
class AccountService extends Service {
	constructor(
		private unitOfWork = DI.get(UnitOfWork),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('AccountService')
	}

	private transformData(
		data: Prisma.AccountGetPayload<{ select: AccountService['dataSelect'] }>,
	): Account {
		return {
			id: data.id,
			code: data.code,
			name: data.name,
			type: data.type as AccountType,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
			disabledAt: data.disabledAt,
		}
	}

	private buildRepositoryFilterOptions(filter: AccountFilterOptions) {
		const repositoryFilter: Prisma.AccountWhereInput = {}

		if (filter.search !== undefined)
			repositoryFilter.OR = [
				{
					code: {
						contains: filter.search,
						mode: 'insensitive',
					},
				},
				{
					name: {
						contains: filter.search,
						mode: 'insensitive',
					},
				},
			]

		if (filter.types !== undefined && filter.types.length > 0)
			repositoryFilter.type = {
				in: filter.types,
			}

		if (filter.active !== undefined && filter.active !== FilterEnableDisable.All)
			repositoryFilter.disabledAt =
				filter.active === FilterEnableDisable.Active ? null : { not: null }

		return repositoryFilter
	}

	private get dataSelect() {
		return {
			id: true,
			code: true,
			name: true,
			type: true,
			createdAt: true,
			updatedAt: true,
			disabledAt: true,
		} satisfies Prisma.AccountSelect
	}

	async findById(id: bigint) {
		return await this.unitOfWork.execute(async transaction => {
			const result = await transaction.getRepository(AccountRepository).findUnique({
				filter: { id },
				select: this.dataSelect,
			})

			if (result === null) return null

			return this.transformData(result)
		})
	}

	async findMany(options: AccountFindManyOptions = {}) {
		const repositoryOptions: AccountQueryAllOptions = {
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
			transaction.getRepository(AccountRepository).findMany(repositoryOptions),
		)
	}

	async count(options: AccountCountOptions): Promise<number> {
		const repositoryOptions: AccountQueryAllOptions = {}

		if (options.filter !== undefined) {
			repositoryOptions.filter = this.buildRepositoryFilterOptions(options.filter)
		}

		return await this.unitOfWork.execute(async transaction =>
			transaction.getRepository(AccountRepository).count(repositoryOptions),
		)
	}

	async list(options: AccountFindManyOptions = {}) {
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
					code: user.code,
					name: user.name,
					type: user.type,
					createdAt: user.createdAt.getTime(),
					updatedAt: user.updatedAt.getTime(),
					disabledAt: user.disabledAt?.getTime() ?? null,
				})),
			}
		})
	}

	async create(data: AccountCreateData) {
		return await this.unitOfWork.execute(async transaction => {
			return await transaction.getRepository(AccountRepository).create({
				data,
			})
		})
	}

	async update(id: bigint, data: DeepPartialAndUndefined<AccountUpdateData>) {
		const updateData: Prisma.AccountUpdateArgs['data'] = RemoveUndefinedValueFromObject(data)

		await this.unitOfWork.execute(async transaction => {
			const account = await this.findById(id)

			if (account === null) throw new ResourceNotFoundError('account')

			if (account.disabledAt !== null) throw new InvalidStateError('update', 'disabled')

			await transaction
				.getRepository(AccountRepository)
				.update({ filter: { id }, data: updateData })
		})
	}

	async disable(id: bigint) {
		await this.unitOfWork.execute(async transaction => {
			await transaction.getRepository(AccountRepository).update({
				filter: { id },
				data: { disabledAt: new Date() },
			})
		})
	}

	async enable(id: bigint) {
		await this.unitOfWork.execute(async transaction => {
			await transaction.getRepository(AccountRepository).update({
				filter: { id },
				data: { disabledAt: null },
			})
		})
	}
}

export default AccountService
