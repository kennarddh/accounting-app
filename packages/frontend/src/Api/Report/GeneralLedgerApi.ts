import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface GeneralLedgerTransactionOutput {
	journalEntryId: string
	entryNumber: string
	date: number
	description: string
	debit: string
	credit: string
	runningBalance: string
}

export interface GeneralLedgerOutput {
	account: {
		id: string
		code: string
		name: string
		type: string
		isDebitNormal: boolean
	}
	fromDate: number
	toDate: number
	openingBalance: string
	totalDebit: string
	totalCredit: string
	endingBalance: string
	transactions: GeneralLedgerTransactionOutput[]
}

export interface GeneralLedgerData {
	accountId?: string
	fromDate?: number
	toDate?: number
}

const GeneralLedgerApi: ApiFunction<GeneralLedgerOutput, GeneralLedgerData> = async data => {
	const result = await CallApi<GeneralLedgerOutput>('/report/general-ledger', 'GET', true, {
		params: {
			accountId: data.accountId,
			fromDate: data.fromDate,
			toDate: data.toDate,
		},
	})

	return result.data.data
}

export default GeneralLedgerApi
