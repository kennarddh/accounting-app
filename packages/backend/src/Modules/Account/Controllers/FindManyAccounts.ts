import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import {
	AccountSortField,
	AccountType,
	FilterEnableDisable,
	SortOrder,
} from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import AccountService, { AccountFindManyOptions } from '../AccountService'

class FindManyAccounts extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('FindManyAccounts')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManyAccounts>,
		response: CelosiaResponse,
	) {
		const { search, pagination, sort, types, active } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: { search, types, active },
			pagination,
			sort,
		}) satisfies AccountFindManyOptions

		const { pagination: resultPagination, items } = await this.accountService.findMany(options)

		response.status(200).json({
			errors: {},
			data: {
				pagination: resultPagination,
				list: items.map(account => ({
					id: account.id,
					code: account.code,
					name: account.name,
					type: account.type,
					createdAt: account.createdAt.getTime(),
					updatedAt: account.updatedAt.getTime(),
					disabledAt: account.disabledAt?.getTime() ?? null,
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			search: z.string().optional(),
			types: z.array(z.enum(AccountType)).optional(),
			active: z.enum(FilterEnableDisable).optional(),
			pagination: ZodPagination.optional(),
			sort: z
				.object({
					field: z.enum(AccountSortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManyAccounts
