import { AuthenticatedAxiosInstance } from 'Api/AxiosInstance'

export interface GeneralLedgerExportParams {
	accountId?: string
	fromDate: number
	toDate: number
	format: 'xlsx' | 'csv' | 'pdf'
}

const GeneralLedgerExportApi = async (params: GeneralLedgerExportParams): Promise<Blob> => {
	const response = await AuthenticatedAxiosInstance.get('/report/general-ledger/export', {
		params,
		responseType: 'blob',
	})

	return response.data as Blob
}

export default GeneralLedgerExportApi
