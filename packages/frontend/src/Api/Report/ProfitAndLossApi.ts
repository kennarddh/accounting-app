import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface ProfitAndLossReportLine {
	id: string
	code: string
	name: string
	amount: string
}

export interface ProfitAndLossOutput {
	fromDate: number
	toDate: number
	revenues: {
		items: ProfitAndLossReportLine[]
		total: string
	}
	cogs: {
		items: ProfitAndLossReportLine[]
		total: string
	}
	grossProfit: string
	expenses: {
		items: ProfitAndLossReportLine[]
		total: string
	}
	netProfit: string
}

export interface ProfitAndLossData {
	fromDate?: number
	toDate?: number
}

const ProfitAndLossApi: ApiFunction<ProfitAndLossOutput, ProfitAndLossData> = async data => {
	const result = await CallApi<ProfitAndLossOutput>('/report/profit-and-loss', 'GET', true, {
		params: {
			fromDate: data.fromDate,
			toDate: data.toDate,
		},
	})

	return result.data.data
}

export default ProfitAndLossApi
