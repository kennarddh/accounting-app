import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import handleControllerError from 'Utils/HandleControllerError'

import JournalService from '../JournalService'

class FindJournalEntryById extends Controller {
	constructor(private journalService = DI.get(JournalService)) {
		super('FindJournalEntryById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindJournalEntryById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			const journalEntry = await this.journalService.findById(id)

			return response.status(200).json({
				errors: {},
				data: {
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
				},
			})
		} catch (error) {
			return handleControllerError(error, response, this.logger)
		}
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindJournalEntryById
