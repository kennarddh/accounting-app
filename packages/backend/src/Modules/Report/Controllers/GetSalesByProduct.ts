import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class GetSalesByProduct extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('GetSalesByProduct')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetSalesByProduct>,
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

		const categoryId = request.query.categoryId ?? undefined

		const report = await this.reportService.getSalesByProduct(fromDate, toDate, categoryId)

		response.status(200).json({
			errors: {},
			data: {
				fromDate: report.fromDate,
				toDate: report.toDate,
				categoryFilterName: report.categoryFilterName,
				summary: {
					totalQuantity: report.summary.totalQuantity,
					totalRevenue: report.summary.totalRevenue,
					totalCost: report.summary.totalCost,
					totalProfit: report.summary.totalProfit,
					overallMarginPercent: report.summary.overallMarginPercent,
				},
				categories: report.categories.map(c => ({
					categoryId: c.categoryId,
					categoryName: c.categoryName,
					productCount: c.productCount,
					quantitySold: c.quantitySold,
					totalRevenue: c.totalRevenue,
					totalCost: c.totalCost,
					grossProfit: c.grossProfit,
					marginPercent: c.marginPercent,
				})),
				products: report.products.map(p => ({
					productId: p.productId,
					sku: p.sku,
					name: p.name,
					categoryId: p.categoryId,
					categoryName: p.categoryName,
					quantitySold: p.quantitySold,
					totalRevenue: p.totalRevenue,
					totalCost: p.totalCost,
					grossProfit: p.grossProfit,
					marginPercent: p.marginPercent,
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			fromDate: z.coerce.number().positive().optional(),
			toDate: z.coerce.number().positive().optional(),
			categoryId: z.coerce.bigint().min(1n).optional(),
		})
	}
}

export default GetSalesByProduct
