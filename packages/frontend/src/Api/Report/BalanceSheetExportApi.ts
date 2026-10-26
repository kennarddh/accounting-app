import { AuthenticatedAxiosInstance } from 'Api/AxiosInstance'

export interface BalanceSheetExportParams {
	asOfDate: number
	format: 'xlsx' | 'csv' | 'pdf'
}

const BalanceSheetExportApi = async (params: BalanceSheetExportParams): Promise<Blob> => {
	const response = await AuthenticatedAxiosInstance.get('/report/balance-sheet/export', {
		params,
		responseType: 'blob',
	})

	return response.data as Blob
}

export default BalanceSheetExportApi
