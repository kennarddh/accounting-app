import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import ReportService from '../ReportService'

class GetDashboardMetrics extends Controller {
	constructor(private reportService = DI.get(ReportService)) {
		super('GetDashboardMetrics')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<GetDashboardMetrics>,
		response: CelosiaResponse,
	) {
		const { startOfToday, startOfMonth } = request.query

		const metrics = await this.reportService.getDashboardMetrics(
			new Date(startOfToday),
			new Date(startOfMonth),
		)

		response.status(200).json({
			errors: {},
			data: metrics,
		})
	}

	public override get query() {
		return z.object({
			startOfToday: z.coerce.number().positive(),
			startOfMonth: z.coerce.number().positive(),
		})
	}
}

export default GetDashboardMetrics
