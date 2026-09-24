import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface ProductUpdateData {
	id: string
	name: string
	price: string
	costPrice: string
	categoryId: string
}

const ProductUpdateApi: ApiFunction<null, ProductUpdateData> = async data => {
	await CallApi(`/product/${data.id}`, 'PATCH', true, {
		data,
	})
}

export default ProductUpdateApi
