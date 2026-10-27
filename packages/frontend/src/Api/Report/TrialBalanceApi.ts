import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface TrialBalanceItemOutput {
	id: string
	code: string
	name: string
	type: string
	debit: string
	credit: string
}

export interface TrialBalanceOutput {
	toDate: number
	items: TrialBalanceItemOutput[]
	totalDebit: string
	totalCredit: string
	isBalanced: boolean
	difference: string
}

export interface TrialBalanceData {
	toDate?: number
}

const TrialBalanceApi: ApiFunction<TrialBalanceOutput, TrialBalanceData> = async data => {
	const result = await CallApi<TrialBalanceOutput>('/report/trial-balance', 'GET', true, {
		params: {
			toDate: data.toDate,
		},
	})

	return result.data.data
}

export default TrialBalanceApi
