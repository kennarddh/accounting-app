import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class GetStockMovementReport extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('GetStockMovementReport')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetStockMovementReport>,
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

		response.status(200).json({
			errors: {},
			data: {
				fromDate: report.fromDate,
				toDate: report.toDate,
				filteredProduct: report.filteredProduct,
				openingStock: report.openingStock,
				closingStock: report.closingStock,
				totalIn: report.totalIn,
				totalOut: report.totalOut,
				netDelta: report.netDelta,
				movements: report.movements.map(m => ({
					movementId: m.movementId,
					date: m.date,
					type: m.type,
					productId: m.productId,
					sku: m.sku,
					productName: m.productName,
					quantity: m.quantity,
					costPerUnit: m.costPerUnit,
					totalCost: m.totalCost,
					referenceNumber: m.referenceNumber,
					createdByName: m.createdByName,
					supplierName: m.supplierName ?? null,
					runningStock: m.runningStock ?? null,
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			fromDate: z.coerce.number().positive().optional(),
			toDate: z.coerce.number().positive().optional(),
			productId: z.coerce.bigint().min(1n).optional(),
			type: z.string().trim().optional(),
		})
	}
}

export default GetStockMovementReport
