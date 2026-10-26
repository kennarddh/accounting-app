import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface ProductFindLookupResponse {
	list: {
		id: string
		sku: string
		name: string
		price: string
		costPrice: string
		currentStock: string
	}[]
}

export interface ProductLookupOutput {
	id: string
	sku: string
	name: string
	price: string
	costPrice: string
	currentStock: string
}

export type ProductFindLookupOutput = ProductLookupOutput[]

const ProductFindLookupApi: ApiFunction<ProductFindLookupOutput> = async () => {
	const result = await CallApi<ProductFindLookupResponse>('/product/lookup', 'GET', true)

	return result.data.data.list
}

export default ProductFindLookupApi
