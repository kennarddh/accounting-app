import { DI, Injectable, Service } from '@celosiajs/core'

import {
	ApiErrorResource,
	FilterEnableDisable,
	SortOrder,
	SupplierSortField,
} from '@accounting-app/common'

import { DeepPartialAndUndefined } from 'Types/Types'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import { ResourceDisabledError } from 'Errors'

import DatabaseService from 'Modules/Database/DatabaseService'
import { buildPrismaPagination, handlePrismaError } from 'Modules/Database/PrismaUtils'

import { Prisma } from 'PrismaGenerated/client'

import { FindManyOptions } from '../../Types/ServiceTypes'
import ConfigurationService from '../Configuration/ConfigurationService'

export interface SupplierCreateData {
	code: string
	name: string
	contact?: string | undefined
	email?: string | undefined
	phone?: string | undefined
	address?: string | undefined
	terms?: string | undefined
}

export interface SupplierUpdateData {
	code?: string
	name?: string
	contact?: string
	email?: string
	phone?: string
	address?: string
	terms?: string
}

export interface SupplierFilterOptions {
	search?: string
	active?: FilterEnableDisable
}

export interface SupplierFindManyOptions extends FindManyOptions<SupplierSortField> {
	filter?: SupplierFilterOptions
}

@Injectable()
class SupplierService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private configurationService = DI.get(ConfigurationService),
	) {
		super('SupplierService')
	}

	private buildWhereFilter(filter?: SupplierFilterOptions) {
		const where: Prisma.SupplierWhereInput = {}

		if (filter) {
			if (filter.search !== undefined) {
				where.OR = [
					{ code: { contains: filter.search, mode: 'insensitive' } },
					{ name: { contains: filter.search, mode: 'insensitive' } },
					{ contact: { contains: filter.search, mode: 'insensitive' } },
				]
			}

			if (filter.active !== undefined && filter.active !== FilterEnableDisable.All) {
				if (filter.active === FilterEnableDisable.Active) {
					where.disabledAt = null
				} else {
					where.disabledAt = { not: null }
				}
			}
		}

		return where
	}

	private get dataSelect() {
		return {
			id: true,
			code: true,
			name: true,
			contact: true,
			email: true,
			phone: true,
			address: true,
			terms: true,
			createdAt: true,
			updatedAt: true,
			disabledAt: true,
		} satisfies Prisma.SupplierSelect
	}

	async findById(id: bigint) {
		try {
			return await this.db.client.supplier.findUniqueOrThrow({
				where: { id },
				select: this.dataSelect,
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Supplier)
		}
	}

	async findMany(options: SupplierFindManyOptions = {}) {
		const { skip, take } = buildPrismaPagination(
			options.pagination,
			this.configurationService.configurations.pagination.defaultLimit,
			this.configurationService.configurations.pagination.defaultMaxLimit,
		)

		const where = this.buildWhereFilter(options.filter)
		const orderBy: Prisma.SupplierOrderByWithRelationInput = options.sort
			? { [options.sort.field]: options.sort.order ?? SortOrder.Ascending }
			: { code: SortOrder.Ascending }

		const [total, suppliers] = await Promise.all([
			this.db.client.supplier.count({ where }),
			this.db.client.supplier.findMany({
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
			items: suppliers,
		}
	}

	async findOptions() {
		return await this.db.client.supplier.findMany({
			where: { disabledAt: null },
			select: {
				id: true,
				code: true,
				name: true,
				terms: true,
			},
			orderBy: { name: 'asc' },
		})
	}

	async create(data: SupplierCreateData) {
		try {
			return await this.db.client.supplier.create({
				data: {
					code: data.code,
					name: data.name,
					contact: data.contact ?? null,
					email: data.email ?? null,
					phone: data.phone ?? null,
					address: data.address ?? null,
					terms: data.terms ?? null,
				},
				select: { id: true },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Supplier, {
				code: data.code,
				name: data.name,
			})
		}
	}

	async update(id: bigint, data: DeepPartialAndUndefined<SupplierUpdateData>) {
		const updateData: Prisma.SupplierUpdateArgs['data'] = RemoveUndefinedValueFromObject(data)

		try {
			await this.db.transaction(async tx => {
				const supplier = await tx.supplier.findUniqueOrThrow({
					where: { id },
					select: { id: true, disabledAt: true },
				})

				if (supplier.disabledAt !== null) {
					throw new ResourceDisabledError(ApiErrorResource.Supplier)
				} else {
					await tx.supplier.update({
						where: { id },
						data: updateData,
					})
				}
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Supplier, {
				code: data.code,
				name: data.name,
			})
		}
	}

	async disable(id: bigint) {
		try {
			await this.db.client.supplier.update({
				where: { id },
				data: { disabledAt: new Date() },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Supplier)
		}
	}

	async enable(id: bigint) {
		try {
			await this.db.client.supplier.update({
				where: { id },
				data: { disabledAt: null },
			})
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.Supplier)
		}
	}
}

export default SupplierService
