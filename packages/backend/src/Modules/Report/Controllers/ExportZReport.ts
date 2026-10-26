import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class ExportZReport extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('ExportZReport')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<ExportZReport>,
		response: CelosiaResponse,
	) {
		let date: Date

		if (request.query.date) {
			date = new Date(request.query.date)
		} else {
			date = new Date()
		}

		const cashierId = request.query.cashierId ?? undefined
		const report = await this.reportService.getZReport(date, cashierId)
		const dateStr = new Date(report.date).toISOString().slice(0, 10)
		const format = request.query.format

		if (format === 'csv') {
			const csvBuffer = await this.reportService.exportZReportCsv(report)
			response.header({
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="z_report_${dateStr}.csv"`,
			})
			response.expressResponse.end(csvBuffer)
		} else if (format === 'pdf') {
			const pdfBuffer = await this.reportService.exportZReportPdf(report)
			response.header({
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="z_report_${dateStr}.pdf"`,
			})
			response.expressResponse.end(pdfBuffer)
		} else {
			const excelBuffer = await this.reportService.exportZReportExcel(report)
			response.header({
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="z_report_${dateStr}.xlsx"`,
			})
			response.expressResponse.end(excelBuffer)
		}
	}

	public override get query() {
		return z.object({
			date: z.coerce.number().positive().optional(),
			cashierId: z.coerce.bigint().min(1n).optional(),
			format: z.enum(['xlsx', 'csv', 'pdf']).default('xlsx'),
		})
	}
}

export default ExportZReport
