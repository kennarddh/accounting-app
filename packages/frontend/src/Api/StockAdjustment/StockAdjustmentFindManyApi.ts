import { StockAdjustmentSortField, StockAdjustmentType } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type StockAdjustmentFindManyResponse = FindManyResponse<{
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
}>

export interface StockAdjustmentFindManySingleOutput {
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

export type StockAdjustmentFindManyOutput = FindManyOutput<StockAdjustmentFindManySingleOutput>

export interface StockAdjustmentFindManyData extends FindManyData<StockAdjustmentSortField> {
	search?: string
}

const StockAdjustmentFindManyApi: ApiFunction<
	StockAdjustmentFindManyOutput,
	StockAdjustmentFindManyData
> = async data => {
	const result = await CallApi<StockAdjustmentFindManyResponse>(
		'/stock-adjustment',
		'GET',
		true,
		{
			params: {
				pagination: data.pagination,
				sort: data.sort,
				search: data.search,
			},
		},
	)

	const outputData = result.data.data

	return {
		pagination: outputData.pagination,
		list: outputData.list.map(stockAdjustment => ({
			id: stockAdjustment.id,
			adjustmentNumber: stockAdjustment.adjustmentNumber,
			date: new Date(stockAdjustment.date),
			type: stockAdjustment.type as StockAdjustmentType,
			reason: stockAdjustment.reason,
			totalCost: stockAdjustment.totalCost,
			createdBy: {
				id: stockAdjustment.createdBy.id,
				name: stockAdjustment.createdBy.name,
			},
			items: stockAdjustment.items.map(item => ({
				product: {
					id: item.product.id,
					sku: item.product.sku,
					name: item.product.name,
				},
				quantity: item.quantity,
				unitCost: item.unitCost,
				subtotalCost: item.subtotalCost,
			})),
			createdAt: new Date(stockAdjustment.createdAt),
		})),
	}
}

export default StockAdjustmentFindManyApi
