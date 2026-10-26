import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class GetInventoryValuation extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('GetInventoryValuation')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetInventoryValuation>,
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

		const report = await this.reportService.getInventoryValuation(fromDate, toDate)

		response.status(200).json({
			errors: {},
			data: {
				asOfDate: report.asOfDate,
				fromDate: report.fromDate,
				toDate: report.toDate,
				summary: {
					totalValuation: report.summary.totalValuation,
					totalUnitsOnHand: report.summary.totalUnitsOnHand,
					totalWasteCost: report.summary.totalWasteCost,
					totalShrinkageCost: report.summary.totalShrinkageCost,
					totalSurplusCost: report.summary.totalSurplusCost,
					netLossCost: report.summary.netLossCost,
				},
				valuationItems: report.valuationItems.map(v => ({
					productId: v.productId,
					sku: v.sku,
					name: v.name,
					categoryName: v.categoryName,
					currentStock: v.currentStock,
					costPrice: v.costPrice,
					totalValue: v.totalValue,
				})),
				discrepancies: report.discrepancies.map(d => ({
					adjustmentNumber: d.adjustmentNumber,
					date: d.date,
					type: d.type,
					sku: d.sku,
					productName: d.productName,
					quantityAdjusted: d.quantityAdjusted,
					unitCost: d.unitCost,
					subtotalCost: d.subtotalCost,
					reason: d.reason,
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			fromDate: z.coerce.number().positive().optional(),
			toDate: z.coerce.number().positive().optional(),
		})
	}
}

export default GetInventoryValuation
