import { AuthenticatedAxiosInstance } from 'Api/AxiosInstance'

export interface ZReportExportParams {
	date: number
	cashierId?: string | undefined
	format: 'xlsx' | 'csv' | 'pdf'
}

const ZReportExportApi = async (params: ZReportExportParams): Promise<Blob> => {
	const response = await AuthenticatedAxiosInstance.get('/report/z-report/export', {
		params,
		responseType: 'blob',
	})

	return response.data as Blob
}

export default ZReportExportApi
