import { AuthenticatedAxiosInstance } from 'Api/AxiosInstance'

export interface InventoryValuationExportParams {
	fromDate: number
	toDate: number
	view?: 'valuation' | 'shrinkage'
	format: 'xlsx' | 'csv' | 'pdf'
}

const InventoryValuationExportApi = async (
	params: InventoryValuationExportParams,
): Promise<Blob> => {
	const response = await AuthenticatedAxiosInstance.get('/report/inventory-valuation/export', {
		params,
		responseType: 'blob',
	})

	return response.data as Blob
}

export default InventoryValuationExportApi
