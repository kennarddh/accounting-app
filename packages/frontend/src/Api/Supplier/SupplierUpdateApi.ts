import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface SupplierUpdateData {
	id: string
	code?: string
	name?: string
	contact?: string | undefined
	email?: string | undefined
	phone?: string | undefined
	address?: string | undefined
	terms?: string | undefined
}

const SupplierUpdateApi: ApiFunction<null, SupplierUpdateData> = async data => {
	await CallApi(`/supplier/${data.id}`, 'PATCH', true, { data })
}

export default SupplierUpdateApi
