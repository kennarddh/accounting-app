import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { SortOrder, UserSortField } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import UserService, { UserFindManyOptions } from '../UserService'

class FindManyUsers extends Controller {
	constructor(private userService = DI.get(UserService)) {
		super('FindManyUsers')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManyUsers>,
		response: CelosiaResponse,
	) {
		const { search, pagination, sort } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: { search },
			pagination,
			sort,
		}) satisfies UserFindManyOptions

		try {
			const data = await this.userService.list(options)

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
			pagination: ZodPagination.optional(),
			sort: z
				.object({
					field: z.enum(UserSortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManyUsers
