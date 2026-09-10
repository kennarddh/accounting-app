import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import z from 'zod/v4'

import JournalService from '../JournalService'

class FindJournalEntryById extends Controller {
	constructor(private accountService = DI.get(JournalService)) {
		super('FindJournalEntryById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindJournalEntryById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			const account = await this.accountService.findById(id)

			if (!account)
				return response.status(404).json({
					errors: {
						others: [
							{
								resource: ApiErrorResource.JournalEntry,
								kind: ApiErrorKind.NotFound,
							},
						],
					},
					data: {},
				})

			return response.status(200).json({
				errors: {},
				data: {
					id: account.id.toString(),
					entryNumber: account.entryNumber,
					date: account.date.getTime(),
					description: account.description,
					createdById: account.createdById.toString(),
					createdAt: account.createdAt.getTime(),
					lines: account.lines.map(line => ({
						id: line.id.toString(),
						account: {
							id: line.account.id.toString(),
							code: line.account.code,
							name: line.account.name,
						},
						debit: line.debit.toString(),
						credit: line.credit.toString(),
						description: line.description,
					})),
				},
			})
		} catch (error) {
			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindJournalEntryById
