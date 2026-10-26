import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class GetProfitAndLoss extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('GetProfitAndLoss')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetProfitAndLoss>,
		response: CelosiaResponse,
	) {
		const now = new Date()
		const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1)
		const defaultTo = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			23,
			59,
			59,
			999,
		)

		const fromDate = request.query.fromDate ? new Date(request.query.fromDate) : defaultFrom
		const toDate = request.query.toDate ? new Date(request.query.toDate) : defaultTo

		const report = await this.reportService.getProfitAndLoss(fromDate, toDate)

		response.status(200).json({
			errors: {},
			data: {
				fromDate: report.fromDate,
				toDate: report.toDate,
				revenues: {
					items: report.revenues.items.map(item => ({
						id: item.id,
						code: item.code,
						name: item.name,
						amount: item.amount,
					})),
					total: report.revenues.total,
				},
				cogs: {
					items: report.cogs.items.map(item => ({
						id: item.id,
						code: item.code,
						name: item.name,
						amount: item.amount,
					})),
					total: report.cogs.total,
				},
				grossProfit: report.grossProfit,
				expenses: {
					items: report.expenses.items.map(item => ({
						id: item.id,
						code: item.code,
						name: item.name,
						amount: item.amount,
					})),
					total: report.expenses.total,
				},
				netProfit: report.netProfit,
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

export default GetProfitAndLoss
