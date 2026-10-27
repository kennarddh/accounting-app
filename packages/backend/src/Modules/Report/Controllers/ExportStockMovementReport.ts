import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class ExportStockMovementReport extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('ExportStockMovementReport')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<ExportStockMovementReport>,
		response: CelosiaResponse,
	) {
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

		const productId = request.query.productId ?? undefined
		const type = request.query.type
		const report = await this.reportService.getStockMovementReport(
			fromDate,
			toDate,
			productId,
			type,
		)
		const dateStr = new Date().toISOString().slice(0, 10)
		const format = request.query.format

		if (format === 'csv') {
			const csvBuffer = await this.reportService.exportStockMovementCsv(report)
			response.header({
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="stock_movements_${dateStr}.csv"`,
			})
			response.expressResponse.end(csvBuffer)
		} else if (format === 'pdf') {
			const pdfBuffer = await this.reportService.exportStockMovementPdf(report)
			response.header({
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="stock_movements_${dateStr}.pdf"`,
			})
			response.expressResponse.end(pdfBuffer)
		} else {
			const excelBuffer = await this.reportService.exportStockMovementExcel(report)
			response.header({
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="stock_movements_${dateStr}.xlsx"`,
			})
			response.expressResponse.end(excelBuffer)
		}
	}

	public override get query() {
		return z.object({
			fromDate: z.coerce.number().positive().optional(),
			toDate: z.coerce.number().positive().optional(),
			productId: z.coerce.bigint().min(1n).optional(),
			type: z.string().trim().optional(),
			format: z.enum(['xlsx', 'csv', 'pdf']).default('xlsx'),
		})
	}
}

export default ExportStockMovementReport
