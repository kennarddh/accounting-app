import { FilterEnableDisable, SupplierSortField } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type SupplierFindManyResponse = FindManyResponse<{
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
}>

export interface SupplierFindManySingleOutput {
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

export type SupplierFindManyOutput = FindManyOutput<SupplierFindManySingleOutput>

export interface SupplierFindManyData extends FindManyData<SupplierSortField> {
	search?: string
	active?: FilterEnableDisable
}

const SupplierFindManyApi: ApiFunction<
	SupplierFindManyOutput,
	SupplierFindManyData
> = async data => {
	const result = await CallApi<SupplierFindManyResponse>('/supplier', 'GET', true, {
		params: {
			pagination: data.pagination,
			sort: data.sort,
			search: data.search,
			active: data.active,
		},
	})

	const output = result.data.data

	return {
		pagination: output.pagination,
		list: output.list.map(s => ({
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
		})),
	}
}

export default SupplierFindManyApi
