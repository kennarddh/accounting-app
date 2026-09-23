import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface ProductFindByIdResponse {
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
}

export interface ProductFindByIdOutput {
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

export interface ProductFindByIdData {
	id: string
}

const ProductFindByIdApi: ApiFunction<ProductFindByIdOutput, ProductFindByIdData> = async data => {
	const result = await CallApi<ProductFindByIdResponse>(`/product/${data.id}`, 'GET', true)

	const outputData = result.data.data

	return {
		id: outputData.id,
		sku: outputData.sku,
		name: outputData.name,
		price: outputData.price,
		costPrice: outputData.costPrice,
		currentStock: outputData.currentStock,
		category: {
			id: outputData.category.id,
			name: outputData.category.name,
		},
		createdAt: new Date(outputData.createdAt),
		updatedAt: new Date(outputData.updatedAt),
		disabledAt: outputData.disabledAt ? new Date(outputData.disabledAt) : null,
	}
}

export default ProductFindByIdApi
