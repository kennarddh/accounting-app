import { AuthenticatedAxiosInstance } from 'Api/AxiosInstance'

export interface ProfitAndLossExportParams {
	fromDate: number
	toDate: number
	format: 'xlsx' | 'csv' | 'pdf'
}

const ProfitAndLossExportApi = async (params: ProfitAndLossExportParams): Promise<Blob> => {
	const response = await AuthenticatedAxiosInstance.get('/report/profit-and-loss/export', {
		params,
		responseType: 'blob', // Crucial: tells Axios not to parse binary as JSON
	})

	return response.data as Blob
}

export default ProfitAndLossExportApi
