import { DI, Injectable, Service } from '@celosiajs/core'

import {
	ApiErrorResource,
	CategorySortField,
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

export interface CategoryCreateData {
	name: string
}

export interface CategoryUpdateData {
	name?: string
}

export interface CategoryFilterOptions {
	search?: string
	active?: FilterEnableDisable
}

export interface CategoryFindManyOptions extends FindManyOptions<CategorySortField> {
	filter?: CategoryFilterOptions
}

@Injectable()
class CategoryService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('CategoryService')
	}

	private buildWhereFilter(filter?: CategoryFilterOptions) {
		if (!filter) return {}

		const where: Prisma.CategoryWhereInput = {}

		if (filter.search !== undefined)
			where.name = {
				contains: filter.search,
				mode: 'insensitive',
			}

		if (filter.active !== undefined && filter.active !== FilterEnableDisable.All)
			where.disabledAt = filter.active === FilterEnableDisable.Active ? null : { not: null }

		return where
	}

	private get dataSelect() {
		return {
			id: true,
			name: true,
			createdAt: true,
			disabledAt: true,
		} satisfies Prisma.CategorySelect
	}

	async findById(id: bigint) {
		try {
			return await this.db.client.category.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}

	async findMany(options: CategoryFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.CategoryOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: {}

		const [total, categories] = await Promise.all([
			this.db.client.category.count({ where }),
			this.db.client.category.findMany({
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
			items: categories,
		}
	}

	async create(data: CategoryCreateData) {
		try {
			return await this.db.client.category.create({
				data: {
					name: data.name,
				},
				select: { id: true },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Category, { name: data.name })
		}
	}

	async update(id: bigint, data: DeepPartialAndUndefined<CategoryUpdateData>) {
		const updateData: Prisma.CategoryUpdateArgs['data'] = RemoveUndefinedValueFromObject(data)

		try {
			await this.db.transaction(async tx => {
				const category = await tx.category.findUniqueOrThrow({
					where: { id },
					select: { id: true, disabledAt: true },
				})

				if (category.disabledAt !== null)
					throw new ResourceDisabledError(ApiErrorResource.Category)

				await tx.category.update({
					where: { id },
					data: updateData,
				})
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Category, { name: data.name })
		}
	}

	async disable(id: bigint) {
		try {
			await this.db.client.category.update({
				where: { id },
				data: { disabledAt: new Date() },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Category)
		}
	}

	async enable(id: bigint) {
		try {
			await this.db.client.category.update({
				where: { id },
				data: { disabledAt: null },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Category)
		}
	}
}

export default CategoryService
