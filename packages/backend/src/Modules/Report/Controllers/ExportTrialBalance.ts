import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class ExportTrialBalance extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('ExportTrialBalance')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<ExportTrialBalance>,
		response: CelosiaResponse,
	) {
		const { fromDate, toDate, format } = request.query

		const from = fromDate
			? new Date(fromDate)
			: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
		const to = toDate ? new Date(toDate) : new Date()

		const report = await this.reportService.getTrialBalance(from, to)
		const dateStr = new Date().toISOString().slice(0, 10)

		if (format === 'csv') {
			const csvBuffer = await this.reportService.exportTrialBalanceCsv(report)
			response.header({
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="trial_balance_${dateStr}.csv"`,
			})
			response.expressResponse.end(csvBuffer)
		} else if (format === 'pdf') {
			const pdfBuffer = await this.reportService.exportTrialBalancePdf(report)
			response.header({
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="trial_balance_${dateStr}.pdf"`,
			})
			response.expressResponse.end(pdfBuffer)
		} else {
			// Default: Excel (.xlsx)
			const excelBuffer = await this.reportService.exportTrialBalanceExcel(report)
			response.header({
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="trial_balance_${dateStr}.xlsx"`,
			})
			response.expressResponse.end(excelBuffer)
		}
	}

	public override get query() {
		return z.object({
			fromDate: z.coerce.number().positive().optional(),
			toDate: z.coerce.number().positive().optional(),
			format: z.enum(['xlsx', 'csv', 'pdf']).default('xlsx'),
		})
	}
}

export default ExportTrialBalance
