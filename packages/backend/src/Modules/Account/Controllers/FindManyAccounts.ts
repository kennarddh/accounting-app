import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { AccountSortField, AccountType, SortOrder } from '@accounting-app/common'
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
		const { search, pagination, sort, types, isActive } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: { search, types, isActive },
			pagination,
			sort,
		}) satisfies AccountFindManyOptions

		try {
			const data = await this.accountService.list(options)

			return response.status(200).json({
				errors: {},
				data,
			})
		} catch (error) {
			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}

	public override get query() {
		return z.object({
			search: z.string().optional(),
			types: z.array(z.enum(AccountType)).optional(),
			isActive: z.boolean().optional(),
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
