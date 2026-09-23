import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface ProductEnableData {
	id: string
}

const ProductEnableApi: ApiFunction<null, ProductEnableData> = async data => {
	await CallApi(`/product/${data.id}/enable`, 'POST', true)
}

export default ProductEnableApi
