import { StockAdjustmentType } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface StockAdjustmentCreateResponse {
	id: string
}

export interface StockAdjustmentCreateData {
	adjustmentNumber: string
	date: string
	type: StockAdjustmentType
	reason: string
	totalCost: string
	createdById: string
	items: {
		productId: string
		quantity: string
		unitCost: string
		subtotalCost: string
	}[]
}

export interface StockAdjustmentCreateOutput {
	id: string
}

const StockAdjustmentCreateApi: ApiFunction<
	StockAdjustmentCreateOutput,
	StockAdjustmentCreateData
> = async data => {
	const result = await CallApi<StockAdjustmentCreateResponse>('/stock-adjustment', 'POST', true, {
		data,
	})

	const outputData = result.data.data

	return {
		id: outputData.id,
	}
}

export default StockAdjustmentCreateApi
