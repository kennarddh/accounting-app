import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import AccountService from 'Modules/Account/AccountService'

import ReportService from '../ReportService'

class ExportGeneralLedger extends Controller {
	constructor(
		private reportService = DI.get(ReportService),
		private accountService = DI.get(AccountService),
	) {
		super('ExportGeneralLedger')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<ExportGeneralLedger>,
		response: CelosiaResponse,
	) {
		let accountId = request.query.accountId

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
		const dateStr = new Date().toISOString().slice(0, 10)
		const format = request.query.format

		if (format === 'csv') {
			const csvBuffer = await this.reportService.exportGeneralLedgerCsv(report)
			response.header({
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="general_ledger_${report.account.code}_${dateStr}.csv"`,
			})
			response.expressResponse.end(csvBuffer)
		} else if (format === 'pdf') {
			const pdfBuffer = await this.reportService.exportGeneralLedgerPdf(report)
			response.header({
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="general_ledger_${report.account.code}_${dateStr}.pdf"`,
			})
			response.expressResponse.end(pdfBuffer)
		} else {
			const excelBuffer = await this.reportService.exportGeneralLedgerExcel(report)
			response.header({
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="general_ledger_${report.account.code}_${dateStr}.xlsx"`,
			})
			response.expressResponse.end(excelBuffer)
		}
	}

	public override get query() {
		return z.object({
			accountId: z.coerce.bigint().min(1n).optional(),
			fromDate: z.coerce.number().positive().optional(),
			toDate: z.coerce.number().positive().optional(),
			format: z.enum(['xlsx', 'csv', 'pdf']).default('xlsx'),
		})
	}
}

export default ExportGeneralLedger
