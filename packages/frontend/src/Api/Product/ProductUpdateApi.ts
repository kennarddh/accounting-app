import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface ProductUpdateData {
	id: string
	code?: string
	name?: string
}

const ProductUpdateApi: ApiFunction<null, ProductUpdateData> = async data => {
	await CallApi(`/product/${data.id}`, 'PATCH', true, {
		data,
	})
}

export default ProductUpdateApi
