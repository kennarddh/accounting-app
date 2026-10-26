import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class GetZReport extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('GetZReport')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetZReport>,
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

		response.status(200).json({
			errors: {},
			data: {
				date: report.date,
				cashierName: report.cashierName,
				grossSales: report.grossSales,
				totalCost: report.totalCost,
				grossProfit: report.grossProfit,
				grossMarginPercent: report.grossMarginPercent,
				totalOrders: report.totalOrders,
				totalItemsSold: report.totalItemsSold,
				averageTicket: report.averageTicket,
				cashCollected: report.cashCollected,
				payments: report.payments.map(p => ({
					paymentMethod: p.paymentMethod,
					orderCount: p.orderCount,
					totalAmount: p.totalAmount,
				})),
				statuses: report.statuses.map(s => ({
					status: s.status,
					count: s.count,
					totalAmount: s.totalAmount,
				})),
				categories: report.categories.map(c => ({
					categoryName: c.categoryName,
					quantity: c.quantity,
					totalAmount: c.totalAmount,
				})),
				topProducts: report.topProducts.map(tp => ({
					productId: tp.productId,
					sku: tp.sku,
					name: tp.name,
					categoryName: tp.categoryName,
					quantity: tp.quantity,
					totalAmount: tp.totalAmount,
				})),
			},
		})
	}

	public override get query() {
		return z.object({
			date: z.coerce.number().positive().optional(),
			cashierId: z.coerce.bigint().min(1n).optional(),
		})
	}
}

export default GetZReport
