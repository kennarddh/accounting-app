import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class GetBalanceSheet extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('GetBalanceSheet')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetBalanceSheet>,
		response: CelosiaResponse,
	) {
		let asOfDate: Date

		if (request.query.asOfDate) {
			asOfDate = new Date(request.query.asOfDate)
		} else {
			asOfDate = new Date()
		}

		const report = await this.reportService.getBalanceSheet(asOfDate)

		response.status(200).json({
			errors: {},
			data: {
				asOfDate: report.asOfDate,
				assets: {
					items: report.assets.items.map(item => ({
						id: item.id,
						code: item.code,
						name: item.name,
						amount: item.amount,
					})),
					total: report.assets.total,
				},
				liabilities: {
					items: report.liabilities.items.map(item => ({
						id: item.id,
						code: item.code,
						name: item.name,
						amount: item.amount,
					})),
					total: report.liabilities.total,
				},
				equity: {
					items: report.equity.items.map(item => ({
						id: item.id,
						code: item.code,
						name: item.name,
						amount: item.amount,
					})),
					retainedEarnings: report.equity.retainedEarnings,
					total: report.equity.total,
				},
				totalLiabilitiesAndEquity: report.totalLiabilitiesAndEquity,
				isBalanced: report.isBalanced,
				difference: report.difference,
			},
		})
	}

	public override get query() {
		return z.object({
			asOfDate: z.coerce.number().positive().optional(),
		})
	}
}

export default GetBalanceSheet
