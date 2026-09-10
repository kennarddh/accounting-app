import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { JournalEntrySortField, SortOrder } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import JournalService, { JournalFindManyOptions } from '../JournalService'

class FindManyJournalEntries extends Controller {
	constructor(private accountService = DI.get(JournalService)) {
		super('FindManyJournalEntries')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindManyJournalEntries>,
		response: CelosiaResponse,
	) {
		const { search, pagination, sort, accountId, createdById, fromDate, toDate } = request.query

		const options = RemoveUndefinedValueFromObject({
			filter: {
				search,
				accountId,
				createdById,
				fromDate: fromDate === undefined ? undefined : new Date(fromDate),
				toDate: toDate === undefined ? undefined : new Date(toDate),
			},
			pagination,
			sort,
		}) satisfies JournalFindManyOptions

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
			accountId: z.coerce.bigint().min(1n).optional(),
			createdById: z.coerce.bigint().min(1n).optional(),
			fromDate: z.number().positive().optional(),
			toDate: z.number().positive().optional(),
			pagination: ZodPagination.optional(),
			sort: z
				.object({
					field: z.enum(JournalEntrySortField),
					order: z.enum(SortOrder).optional(),
				})
				.optional(),
		})
	}
}

export default FindManyJournalEntries
