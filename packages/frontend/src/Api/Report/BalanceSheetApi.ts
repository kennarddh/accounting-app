import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface BalanceSheetItemOutput {
	id: string
	code: string
	name: string
	amount: string
}

export interface BalanceSheetOutput {
	asOfDate: number
	assets: {
		items: BalanceSheetItemOutput[]
		total: string
	}
	liabilities: {
		items: BalanceSheetItemOutput[]
		total: string
	}
	equity: {
		items: BalanceSheetItemOutput[]
		retainedEarnings: string
		total: string
	}
	totalLiabilitiesAndEquity: string
	isBalanced: boolean
	difference: string
}

export interface BalanceSheetData {
	asOfDate?: number
}

const BalanceSheetApi: ApiFunction<BalanceSheetOutput, BalanceSheetData> = async data => {
	const result = await CallApi<BalanceSheetOutput>('/report/balance-sheet', 'GET', true, {
		params: {
			asOfDate: data.asOfDate,
		},
	})

	return result.data.data
}

export default BalanceSheetApi
