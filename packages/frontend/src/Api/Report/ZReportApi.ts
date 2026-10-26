import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface ZReportPaymentItem {
	paymentMethod: string
	orderCount: number
	totalAmount: string
}

export interface ZReportStatusItem {
	status: string
	count: number
	totalAmount: string
}

export interface ZReportCategoryItem {
	categoryName: string
	quantity: string
	totalAmount: string
}

export interface ZReportProductItem {
	productId: string
	sku: string
	name: string
	categoryName: string
	quantity: string
	totalAmount: string
}

export interface ZReportOutput {
	date: number
	cashierName: string
	grossSales: string
	totalCost: string
	grossProfit: string
	grossMarginPercent: string
	totalOrders: number
	totalItemsSold: string
	averageTicket: string
	cashCollected: string
	payments: ZReportPaymentItem[]
	statuses: ZReportStatusItem[]
	categories: ZReportCategoryItem[]
	topProducts: ZReportProductItem[]
}

export interface ZReportData {
	date?: number
	cashierId?: string | undefined
}

const ZReportApi: ApiFunction<ZReportOutput, ZReportData> = async data => {
	const result = await CallApi<ZReportOutput>('/report/z-report', 'GET', true, {
		params: {
			date: data.date,
			cashierId: data.cashierId,
		},
	})

	return result.data.data
}

export default ZReportApi
