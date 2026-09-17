import { DI, Injectable, Service } from '@celosiajs/core'

import {
	AccountSortField,
	AccountType,
	ApiErrorResource,
	FilterEnableDisable,
	SortOrder,
} from '@accounting-app/common'

import { DeepPartialAndUndefined } from 'Types/Types'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import { ResourceDisabledError } from 'Errors'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'

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

@Injectable()
class AccountService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('AccountService')
	}

	private buildWhereFilter(filter?: AccountFilterOptions) {
		if (!filter) return {}

		const where: Prisma.AccountWhereInput = {}

		if (filter.search !== undefined)
			where.OR = [
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
			where.type = {
				in: filter.types,
			}

		if (filter.active !== undefined && filter.active !== FilterEnableDisable.All)
			where.disabledAt = filter.active === FilterEnableDisable.Active ? null : { not: null }

		return where
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
		try {
			return await this.db.client.account.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}

	async findMany(options: AccountFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.AccountOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: { code: SortOrder.Ascending }

		const [total, accounts] = await Promise.all([
			this.db.client.account.count({ where }),
			this.db.client.account.findMany({
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
			items: accounts,
		}
	}

	async create(data: AccountCreateData) {
		try {
			return await this.db.client.account.create({
				data: {
					code: data.code,
					name: data.name,
					type: data.type,
				},
				select: { id: true },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Account, { code: data.code })
		}
	}

	async update(id: bigint, data: DeepPartialAndUndefined<AccountUpdateData>) {
		const updateData: Prisma.AccountUpdateArgs['data'] = RemoveUndefinedValueFromObject(data)

		try {
			await this.db.transaction(async tx => {
				const account = await tx.account.findUniqueOrThrow({
					where: { id },
					select: { id: true, disabledAt: true },
				})

				if (account.disabledAt !== null)
					throw new ResourceDisabledError(ApiErrorResource.Account)

				await tx.account.update({
					where: { id },
					data: updateData,
				})
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Account, { code: data.code })
		}
	}

	async disable(id: bigint) {
		try {
			await this.db.client.account.update({
				where: { id },
				data: { disabledAt: new Date() },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Account)
		}
	}

	async enable(id: bigint) {
		try {
			await this.db.client.account.update({
				where: { id },
				data: { disabledAt: null },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Account)
		}
	}
}

export default AccountService
