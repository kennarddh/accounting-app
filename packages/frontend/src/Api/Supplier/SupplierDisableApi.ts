import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface SupplierDisableData {
	id: string
}

const SupplierDisableApi: ApiFunction<null, SupplierDisableData> = async data => {
	await CallApi(`/supplier/${data.id}/disable`, 'POST', true)
}

export default SupplierDisableApi
