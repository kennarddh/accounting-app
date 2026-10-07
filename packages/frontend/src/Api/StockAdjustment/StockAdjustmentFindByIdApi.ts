import { StockAdjustmentType } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface StockAdjustmentFindByIdResponse {
	id: string
	adjustmentNumber: string
	date: string
	type: string
	reason: string
	totalCost: string
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
	createdAt: string
}

export interface StockAdjustmentFindByIdOutput {
	id: string
	adjustmentNumber: string
	date: Date
	type: StockAdjustmentType
	reason: string
	totalCost: string
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

	const outputData = result.data.data

	return {
		id: outputData.id,
		adjustmentNumber: outputData.adjustmentNumber,
		date: new Date(outputData.date),
		type: outputData.type as StockAdjustmentType,
		reason: outputData.reason,
		totalCost: outputData.totalCost,
		createdBy: {
			id: outputData.createdBy.id,
			name: outputData.createdBy.name,
		},
		items: outputData.items.map(item => ({
			product: {
				id: item.product.id,
				sku: item.product.sku,
				name: item.product.name,
			},
			quantity: item.quantity,
			unitCost: item.unitCost,
			subtotalCost: item.subtotalCost,
		})),
		createdAt: new Date(outputData.createdAt),
	}
}

export default StockAdjustmentFindByIdApi
