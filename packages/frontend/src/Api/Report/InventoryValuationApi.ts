import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface InventoryValuationItemOutput {
	productId: string
	sku: string
	name: string
	categoryName: string
	currentStock: string
	costPrice: string
	totalValue: string
}

export interface ShrinkageDiscrepancyOutput {
	adjustmentNumber: string
	date: number
	type: string
	sku: string
	productName: string
	quantityAdjusted: string
	unitCost: string
	subtotalCost: string
	reason: string
}

export interface InventoryValuationOutput {
	asOfDate: number
	fromDate: number
	toDate: number
	summary: {
		totalValuation: string
		totalUnitsOnHand: string
		totalWasteCost: string
		totalShrinkageCost: string
		totalSurplusCost: string
		netLossCost: string
	}
	valuationItems: InventoryValuationItemOutput[]
	discrepancies: ShrinkageDiscrepancyOutput[]
}

export interface InventoryValuationData {
	fromDate?: number
	toDate?: number
}

const InventoryValuationApi: ApiFunction<
	InventoryValuationOutput,
	InventoryValuationData
> = async data => {
	const result = await CallApi<InventoryValuationOutput>(
		'/report/inventory-valuation',
		'GET',
		true,
		{
			params: {
				fromDate: data.fromDate,
				toDate: data.toDate,
			},
		},
	)

	return result.data.data
}

export default InventoryValuationApi
