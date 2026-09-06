import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { SortOrder, UserSessionSortField } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import UserSessionService, { UserSessionFindManyOptions } from '../UserSessionService'

class FindManyUserSessions extends Controller {
	constructor(private userSessionService = DI.get(UserSessionService)) {
		super('FindManyUserSessions')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManyUserSessions>,
		response: CelosiaResponse,
	) {
		const { includeInactive, userId, pagination, sort } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: {
				userId,
				includeInactive,
			},
			pagination,
			sort,
		}) satisfies UserSessionFindManyOptions

		try {
			const data = await this.userSessionService.list(options)

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
			includeInactive: z.stringbool().default(false),
			userId: z.coerce.bigint().min(1n).optional(),
			pagination: ZodPagination.optional(),
			sort: z
				.object({
					field: z.enum(UserSessionSortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManyUserSessions
