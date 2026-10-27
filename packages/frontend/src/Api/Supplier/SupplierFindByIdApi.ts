import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface SupplierFindByIdResponse {
	id: string
	code: string
	name: string
	contact: string | null
	email: string | null
	phone: string | null
	address: string | null
	terms: string | null
	createdAt: number
	updatedAt: number
	disabledAt: number | null
}

export interface SupplierFindByIdOutput {
	id: string
	code: string
	name: string
	contact: string | null
	email: string | null
	phone: string | null
	address: string | null
	terms: string | null
	createdAt: Date
	updatedAt: Date
	disabledAt: Date | null
}

export interface SupplierFindByIdData {
	id: string
}

const SupplierFindByIdApi: ApiFunction<
	SupplierFindByIdOutput,
	SupplierFindByIdData
> = async data => {
	const result = await CallApi<SupplierFindByIdResponse>(`/supplier/${data.id}`, 'GET', true)
	const s = result.data.data

	return {
		id: s.id,
		code: s.code,
		name: s.name,
		contact: s.contact,
		email: s.email,
		phone: s.phone,
		address: s.address,
		terms: s.terms,
		createdAt: new Date(s.createdAt),
		updatedAt: new Date(s.updatedAt),
		disabledAt: s.disabledAt ? new Date(s.disabledAt) : null,
	}
}

export default SupplierFindByIdApi
