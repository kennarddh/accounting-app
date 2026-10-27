import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { FilterEnableDisable, SortOrder, SupplierSortField } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import SupplierService, { SupplierFindManyOptions } from '../SupplierService'

class FindManySuppliers extends Controller {
	constructor(private supplierService = DI.get(SupplierService)) {
		super('FindManySuppliers')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManySuppliers>,
		response: CelosiaResponse,
	) {
		const { search, pagination, sort, active } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: { search, active },
			pagination,
			sort,
		}) satisfies SupplierFindManyOptions

		const { pagination: resultPagination, items } = await this.supplierService.findMany(options)

		response.status(200).json({
			errors: {},
			data: {
				pagination: resultPagination,
				list: items.map(s => ({
					id: s.id.toString(),
					code: s.code,
					name: s.name,
					contact: s.contact,
					email: s.email,
					phone: s.phone,
					address: s.address,
					terms: s.terms,
					createdAt: s.createdAt.getTime(),
					updatedAt: s.updatedAt.getTime(),
					disabledAt: s.disabledAt ? s.disabledAt.getTime() : null,
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			search: z.string().optional(),
			active: z.enum(FilterEnableDisable).optional(),
			pagination: ZodPagination.optional(),
			sort: z
				.object({
					field: z.enum(SupplierSortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManySuppliers
