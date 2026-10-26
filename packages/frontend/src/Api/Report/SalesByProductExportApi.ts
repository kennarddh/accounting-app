import { AuthenticatedAxiosInstance } from 'Api/AxiosInstance'

export interface SalesByProductExportParams {
	fromDate: number
	toDate: number
	categoryId?: string | undefined
	format: 'xlsx' | 'csv' | 'pdf'
}

const SalesByProductExportApi = async (params: SalesByProductExportParams): Promise<Blob> => {
	const response = await AuthenticatedAxiosInstance.get('/report/sales-by-product/export', {
		params,
		responseType: 'blob',
	})

	return response.data as Blob
}

export default SalesByProductExportApi
