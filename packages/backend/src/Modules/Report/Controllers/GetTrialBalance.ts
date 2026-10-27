import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class GetTrialBalance extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('GetTrialBalance')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetTrialBalance>,
		response: CelosiaResponse,
	) {
		const now = new Date()
		const defaultTo = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			23,
			59,
			59,
			999,
		)

		const toDate = request.query.toDate ? new Date(request.query.toDate) : defaultTo

		const report = await this.reportService.getTrialBalance(toDate)

		response.status(200).json({
			errors: {},
			data: {
				toDate: report.toDate,
				items: report.items.map(item => ({
					id: item.id,
					code: item.code,
					name: item.name,
					type: item.type,
					debit: item.debit,
					credit: item.credit,
				})),
				totalDebit: report.totalDebit,
				totalCredit: report.totalCredit,
				isBalanced: report.isBalanced,
				difference: report.difference,
			},
		})
	}

	public override get query() {
		return z.object({
			toDate: z.coerce.number().positive().optional(),
		})
	}
}

export default GetTrialBalance
