import { DI, Injectable, Service } from '@celosiajs/core'

import {
	ApiErrorResource,
	FilterEnableDisable,
	ProductSortField,
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

export interface ProductCreateData {
	sku: string
	name: string
	price: string
	costPrice: string
	categoryId: bigint
}

export interface ProductUpdateData {
	name?: string
	price?: string
	costPrice?: string
	categoryId?: bigint
}

export interface ProductFilterOptions {
	search?: string
	active?: FilterEnableDisable
}

export interface ProductFindManyOptions extends FindManyOptions<ProductSortField> {
	filter?: ProductFilterOptions
}

@Injectable()
class ProductService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('ProductService')
	}

	private buildWhereFilter(filter?: ProductFilterOptions) {
		if (!filter) return {}

		const where: Prisma.ProductWhereInput = {}

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
			sku: true,
			name: true,
			price: true,
			costPrice: true,
			currentStock: true,
			category: { select: { id: true, name: true } },
			createdAt: true,
			updatedAt: true,
			disabledAt: true,
		} satisfies Prisma.ProductSelect
	}

	async findById(id: bigint) {
		try {
			return await this.db.client.product.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.User)
		}
	}

	async findMany(options: ProductFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.ProductOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: {}

		const [total, products] = await Promise.all([
			this.db.client.product.count({ where }),
			this.db.client.product.findMany({
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
			items: products,
		}
	}

	async create(data: ProductCreateData) {
		try {
			return await this.db.client.product.create({
				data: {
					sku: data.sku,
					name: data.name,
					price: new Prisma.Decimal(data.price),
					costPrice: new Prisma.Decimal(data.costPrice),
					categoryId: data.categoryId,
				},
				select: { id: true },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Product, { sku: data.sku, name: data.name })
		}
	}

	async update(id: bigint, data: DeepPartialAndUndefined<ProductUpdateData>) {
		const updateData: Prisma.ProductUpdateArgs['data'] = RemoveUndefinedValueFromObject(data)

		try {
			await this.db.transaction(async tx => {
				const product = await tx.product.findUniqueOrThrow({
					where: { id },
					select: { id: true, disabledAt: true },
				})

				if (product.disabledAt !== null)
					throw new ResourceDisabledError(ApiErrorResource.Product)

				await tx.product.update({
					where: { id },
					data: updateData,
				})
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Product, { name: data.name })
		}
	}

	async disable(id: bigint) {
		try {
			await this.db.client.product.update({
				where: { id },
				data: { disabledAt: new Date() },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Product)
		}
	}

	async enable(id: bigint) {
		try {
			await this.db.client.product.update({
				where: { id },
				data: { disabledAt: null },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Product)
		}
	}
}

export default ProductService
