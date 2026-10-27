import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface SupplierEnableData {
	id: string
}

const SupplierEnableApi: ApiFunction<null, SupplierEnableData> = async data => {
	await CallApi(`/supplier/${data.id}/enable`, 'POST', true)
}

export default SupplierEnableApi
