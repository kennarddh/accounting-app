import { FilterEnableDisable, ProductSortField } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type ProductFindManyResponse = FindManyResponse<{
	id: string
	sku: string
	name: string
	price: string
	costPrice: string
	currentStock: string
	category: {
		id: string
		name: string
	}
	createdAt: number
	updatedAt: number
	disabledAt: number | null
}>

export interface ProductFindManySingleOutput {
	id: string
	sku: string
	name: string
	price: string
	costPrice: string
	currentStock: string
	category: {
		id: string
		name: string
	}
	createdAt: Date
	updatedAt: Date
	disabledAt: Date | null
}

export type ProductFindManyOutput = FindManyOutput<ProductFindManySingleOutput>

export interface ProductFindManyData extends FindManyData<ProductSortField> {
	search?: string
	active?: FilterEnableDisable
}

const ProductFindManyApi: ApiFunction<ProductFindManyOutput, ProductFindManyData> = async data => {
	const result = await CallApi<ProductFindManyResponse>('/product', 'GET', true, {
		params: {
			pagination: data.pagination,
			sort: data.sort,
			search: data.search,
			active: data.active,
		},
	})

	const outputData = result.data.data

	return {
		pagination: outputData.pagination,
		list: outputData.list.map(account => ({
			id: account.id,
			sku: account.sku,
			name: account.name,
			price: account.price,
			costPrice: account.costPrice,
			currentStock: account.currentStock,
			category: {
				id: account.category.id,
				name: account.category.name,
			},
			createdAt: new Date(account.createdAt),
			updatedAt: new Date(account.updatedAt),
			disabledAt: account.disabledAt ? new Date(account.disabledAt) : null,
		})),
	}
}

export default ProductFindManyApi
