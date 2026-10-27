import { AuthenticatedAxiosInstance } from 'Api/AxiosInstance'

export interface TrialBalanceExportParams {
	toDate: number
	format: 'xlsx' | 'csv' | 'pdf'
}

const TrialBalanceExportApi = async (params: TrialBalanceExportParams): Promise<Blob> => {
	const response = await AuthenticatedAxiosInstance.get('/report/trial-balance/export', {
		params,
		responseType: 'blob',
	})

	return response.data as Blob
}

export default TrialBalanceExportApi
