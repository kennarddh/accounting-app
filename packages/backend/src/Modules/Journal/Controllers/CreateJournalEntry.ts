import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import z from 'zod/v4'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import { InvalidStateError, ResourceNotFoundError } from 'Errors'

import JournalService from '../JournalService'

// eslint-disable-next-line security/detect-unsafe-regex
const moneyRegex = /^(0|[1-9]\d{0,23})(\.\d{1,4})?$/

class CreateJournalEntry extends Controller {
	constructor(private journalService = DI.get(JournalService)) {
		super('CreateJournalEntry')
	}

	public async index(
		input: JWTVerifiedData,
		request: ControllerRequest<CreateJournalEntry>,
		response: CelosiaResponse,
	) {
		const { entryNumber, date, description, lines } = request.body
		const createdById = input.user.data.id

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
			if (
				error instanceof InvalidStateError &&
				error.operation === 'create' &&
				error.state === 'duplicateEntryNumber'
			) {
				return response.status(400).json({
					errors: {
						others: [
							{ resource: ApiErrorResource.JournalEntry, kind: ApiErrorKind.Taken },
						],
					},
					data: null,
				})
			}
			if (
				error instanceof InvalidStateError &&
				error.operation === 'create' &&
				error.state === 'journalEntryUnbalanced'
			) {
				return response.status(400).json({
					errors: {
						others: [
							{ resource: ApiErrorResource.JournalEntry, kind: ApiErrorKind.Invalid },
						],
					},
					message: 'Debits and credits must be equal.',
					data: null,
				})
			}
			if (
				error instanceof InvalidStateError &&
				error.operation === 'create' &&
				(error.state === 'lineMustHaveDebitOrCredit' ||
					error.state === 'negativeAmountNotAllowed' ||
					error.state === 'minimumLinesRequired')
			) {
				return response.status(400).json({
					errors: {
						others: [
							{ resource: ApiErrorResource.JournalEntry, kind: ApiErrorKind.Invalid },
						],
					},
					message: error.state,
					data: null,
				})
			}
			if (
				error instanceof InvalidStateError &&
				error.operation === 'create' &&
				error.state === 'accountDisabled'
			) {
				return response.status(400).json({
					errors: {
						others: [
							{ resource: ApiErrorResource.Account, kind: ApiErrorKind.Disabled },
						],
					},
					data: null,
				})
			}
			if (error instanceof ResourceNotFoundError && error.resource === 'account') {
				return response.status(404).json({
					errors: {
						others: [
							{ resource: ApiErrorResource.Account, kind: ApiErrorKind.NotFound },
						],
					},
					data: null,
				})
			}

			this.logger.error('Other.', error)

			return response.sendInternalServerError()
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
