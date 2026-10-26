import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class ExportBalanceSheet extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('ExportBalanceSheet')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<ExportBalanceSheet>,
		response: CelosiaResponse,
	) {
		let asOfDate: Date

		if (request.query.asOfDate) {
			asOfDate = new Date(request.query.asOfDate)
		} else {
			asOfDate = new Date()
		}

		const report = await this.reportService.getBalanceSheet(asOfDate)
		const dateStr = new Date().toISOString().slice(0, 10)
		const format = request.query.format

		if (format === 'csv') {
			const csvBuffer = await this.reportService.exportBalanceSheetCsv(report)
			response.header({
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="balance_sheet_${dateStr}.csv"`,
			})
			response.expressResponse.end(csvBuffer)
		} else if (format === 'pdf') {
			const pdfBuffer = await this.reportService.exportBalanceSheetPdf(report)
			response.header({
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="balance_sheet_${dateStr}.pdf"`,
			})
			response.expressResponse.end(pdfBuffer)
		} else {
			const excelBuffer = await this.reportService.exportBalanceSheetExcel(report)
			response.header({
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="balance_sheet_${dateStr}.xlsx"`,
			})
			response.expressResponse.end(excelBuffer)
		}
	}

	public override get query() {
		return z.object({
			asOfDate: z.coerce.number().positive().optional(),
			format: z.enum(['xlsx', 'csv', 'pdf']).default('xlsx'),
		})
	}
}

export default ExportBalanceSheet
