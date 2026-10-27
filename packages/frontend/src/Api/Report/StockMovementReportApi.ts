import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface StockMovementItemOutput {
	movementId: string
	date: number
	type: string
	productId: string
	sku: string
	productName: string
	quantity: string
	costPerUnit: string
	totalCost: string
	referenceNumber: string
	createdByName: string
	supplierName?: string
	runningStock?: string
}

export interface StockMovementReportOutput {
	fromDate: number
	toDate: number
	filteredProduct: {
		id: string
		sku: string
		name: string
	} | null
	openingStock: string | null
	closingStock: string | null
	totalIn: string
	totalOut: string
	netDelta: string
	movements: StockMovementItemOutput[]
}

export interface StockMovementReportData {
	fromDate?: number
	toDate?: number
	productId?: string | undefined
	type?: string | undefined
}

const StockMovementReportApi: ApiFunction<
	StockMovementReportOutput,
	StockMovementReportData
> = async data => {
	const result = await CallApi<StockMovementReportOutput>('/report/stock-movement', 'GET', true, {
		params: {
			fromDate: data.fromDate,
			toDate: data.toDate,
			productId: data.productId,
			type: data.type,
		},
	})

	return result.data.data
}

export default StockMovementReportApi
