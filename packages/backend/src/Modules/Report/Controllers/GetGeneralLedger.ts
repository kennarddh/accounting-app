import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import AccountService from 'Modules/Account/AccountService'

import ReportService from '../ReportService'

class GetGeneralLedger extends Controller {
	constructor(
		private reportService = DI.get(ReportService),
		private accountService = DI.get(AccountService),
	) {
		super('GetGeneralLedger')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetGeneralLedger>,
		response: CelosiaResponse,
	) {
		let accountId = request.query.accountId

		// If no accountId provided, fallback to the first active account (e.g. Cash 101)
		if (!accountId) {
			const options = await this.accountService.findOptions()
			if (options.length > 0) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				accountId = options[0]!.id
			} else {
				accountId = 1n
			}
		}

		let fromDate: Date
		let toDate: Date

		if (request.query.fromDate) {
			fromDate = new Date(request.query.fromDate)
		} else {
			const now = new Date()
			fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
		}

		if (request.query.toDate) {
			toDate = new Date(request.query.toDate)
		} else {
			toDate = new Date()
		}

		const report = await this.reportService.getGeneralLedger(accountId, fromDate, toDate)

		response.status(200).json({
			errors: {},
			data: {
				account: {
					id: report.account.id,
					code: report.account.code,
					name: report.account.name,
					type: report.account.type,
					isDebitNormal: report.account.isDebitNormal,
				},
				fromDate: report.fromDate,
				toDate: report.toDate,
				openingBalance: report.openingBalance,
				totalDebit: report.totalDebit,
				totalCredit: report.totalCredit,
				endingBalance: report.endingBalance,
				transactions: report.transactions.map(tx => ({
					journalEntryId: tx.journalEntryId,
					entryNumber: tx.entryNumber,
					date: tx.date,
					description: tx.description,
					debit: tx.debit,
					credit: tx.credit,
					runningBalance: tx.runningBalance,
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			accountId: z.coerce.bigint().min(1n).optional(),
			fromDate: z.coerce.number().positive().optional(),
			toDate: z.coerce.number().positive().optional(),
		})
	}
}

export default GetGeneralLedger
