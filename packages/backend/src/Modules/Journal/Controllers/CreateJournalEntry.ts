import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import z from 'zod/v4'

import handleControllerError from 'Utils/HandleControllerError'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import JournalService from '../JournalService'

// eslint-disable-next-line security/detect-unsafe-regex
const moneyRegex = /^(0|[1-9]\d{0,23})(\.\d{1,4})?$/

class CreateJournalEntry extends Controller {
	constructor(private journalService = DI.get(JournalService)) {
		super('CreateJournalEntry')
	}

	public async index(
		data: JWTVerifiedData,
		request: ControllerRequest<CreateJournalEntry>,
		response: CelosiaResponse,
	) {
		const { entryNumber, date, description, lines } = request.body
		const createdById = data.user.id

		try {
			const journalEntry = await this.journalService.create({
				entryNumber,
				date: new Date(date),
				description,
				createdById,
				lines: lines.map(line => ({
					accountId: line.accountId,
					debit: line.debit,
					credit: line.credit,
					description: line.description,
				})),
			})

			return response.status(200).json({
				errors: {},
				data: {
					id: journalEntry.id.toString(),
				},
			})
		} catch (error) {
			return handleControllerError(error, response, this.logger)
		}
	}

	public override get body() {
		return z.object({
			entryNumber: z.string().trim().min(1).max(50),
			date: z.number().int().positive(),
			description: z.string().trim().min(1),
			lines: z
				.array(
					z.object({
						accountId: z.coerce.bigint().min(1n),
						debit: z.string().regex(moneyRegex, 'Must be a valid decimal string'),
						credit: z.string().regex(moneyRegex, 'Must be a valid decimal string'),
						description: z.string().trim().min(1),
					}),
				)
				.min(2),
		})
	}
}

export default CreateJournalEntry
