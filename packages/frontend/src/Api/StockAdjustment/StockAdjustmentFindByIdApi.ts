import { StockAdjustmentType } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface StockAdjustmentFindByIdResponse {
	id: string
	adjustmentNumber: string
	date: number
	type: string
	reason: string
	totalCost: string
	supplier: {
		id: string
		code: string
		name: string
	} | null
	createdBy: {
		id: string
		name: string
	}
	items: {
		product: {
			id: string
			sku: string
			name: string
		}
		quantity: string
		subtotalCost: string
		unitCost: string
	}[]
	createdAt: number
}

export interface StockAdjustmentFindByIdOutput {
	id: string
	adjustmentNumber: string
	date: Date
	type: StockAdjustmentType
	reason: string
	totalCost: string
	supplier: {
		id: string
		code: string
		name: string
	} | null
	createdBy: {
		id: string
		name: string
	}
	items: {
		product: {
			id: string
			sku: string
			name: string
		}
		quantity: string
		subtotalCost: string
		unitCost: string
	}[]
	createdAt: Date
}

export interface StockAdjustmentFindByIdData {
	id: string
}

const StockAdjustmentFindByIdApi: ApiFunction<
	StockAdjustmentFindByIdOutput,
	StockAdjustmentFindByIdData
> = async data => {
	const result = await CallApi<StockAdjustmentFindByIdResponse>(
		`/stock-adjustment/${data.id}`,
		'GET',
		true,
	)

	const d = result.data.data

	return {
		id: d.id,
		adjustmentNumber: d.adjustmentNumber,
		date: new Date(d.date),
		type: d.type as StockAdjustmentType,
		reason: d.reason,
		totalCost: d.totalCost,
		supplier: d.supplier,
		createdBy: d.createdBy,
		items: d.items,
		createdAt: new Date(d.createdAt),
	}
}

export default StockAdjustmentFindByIdApi
