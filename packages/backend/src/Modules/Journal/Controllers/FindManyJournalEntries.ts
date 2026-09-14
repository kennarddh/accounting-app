import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { JournalEntrySortField, SortOrder } from '@accounting-app/common'
import z from 'zod/v4'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import ZodPagination from 'Validations/Zod/ZodPagination'

import JournalService, { JournalFindManyOptions } from '../JournalService'

class FindManyJournalEntries extends Controller {
	constructor(private journalService = DI.get(JournalService)) {
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

		const { pagination: resultPagination, items } = await this.journalService.findMany(options)

		response.status(200).json({
			errors: {},
			data: {
				pagination: resultPagination,
				list: items.map(journalEntry => ({
					id: journalEntry.id,
					entryNumber: journalEntry.entryNumber,
					date: journalEntry.date.getTime(),
					description: journalEntry.description,
					createdBy: {
						id: journalEntry.createdBy.id,
						name: journalEntry.createdBy.name,
					},
					lines: journalEntry.lines.map(line => ({
						id: line.id,
						account: {
							id: line.account.id,
							code: line.account.code,
							name: line.account.name,
						},
						debit: line.debit.toString(),
						credit: line.credit.toString(),
						description: line.description,
					})),
					createdAt: journalEntry.createdAt.getTime(),
					updatedAt: journalEntry.updatedAt.getTime(),
				})),
			},
		})
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
