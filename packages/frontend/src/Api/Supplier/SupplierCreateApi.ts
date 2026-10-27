import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface SupplierCreateResponse {
	id: string
}

export interface SupplierCreateData {
	code: string
	name: string
	contact?: string | undefined
	email?: string | undefined
	phone?: string | undefined
	address?: string | undefined
	terms?: string | undefined
}

export interface SupplierCreateOutput {
	id: string
}

const SupplierCreateApi: ApiFunction<SupplierCreateOutput, SupplierCreateData> = async data => {
	const result = await CallApi<SupplierCreateResponse>('/supplier', 'POST', true, { data })
	return result.data.data
}

export default SupplierCreateApi
