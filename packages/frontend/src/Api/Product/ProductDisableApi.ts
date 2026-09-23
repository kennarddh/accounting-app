import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface ProductDisableData {
	id: string
}

const ProductDisableApi: ApiFunction<null, ProductDisableData> = async data => {
	await CallApi(`/product/${data.id}/disable`, 'POST', true)
}

export default ProductDisableApi
