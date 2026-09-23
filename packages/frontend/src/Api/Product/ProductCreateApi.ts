import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface ProductCreateResponse {
	id: string
}

export interface ProductCreateData {
	sku: string
	name: string
	price: string
	costPrice: string
	categoryId: string
}

export interface ProductCreateOutput {
	id: string
}

const ProductCreateApi: ApiFunction<ProductCreateOutput, ProductCreateData> = async data => {
	const result = await CallApi<ProductCreateResponse>('/product', 'POST', true, {
		data,
	})

	const outputData = result.data.data

	return {
		id: outputData.id,
	}
}

export default ProductCreateApi
