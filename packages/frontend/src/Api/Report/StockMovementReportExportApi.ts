import { AuthenticatedAxiosInstance } from 'Api/AxiosInstance'

export interface StockMovementReportExportParams {
	fromDate: number
	toDate: number
	productId?: string | undefined
	type?: string | undefined
	format: 'xlsx' | 'csv' | 'pdf'
}

const StockMovementReportExportApi = async (
	params: StockMovementReportExportParams,
): Promise<Blob> => {
	const response = await AuthenticatedAxiosInstance.get('/report/stock-movement/export', {
		params,
		responseType: 'blob',
	})

	return response.data as Blob
}

export default StockMovementReportExportApi
