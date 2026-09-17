import { CategorySortField, FilterEnableDisable } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type CategoryFindManyResponse = FindManyResponse<{
	id: string
	name: string
	createdAt: number
	disabledAt: number | null
}>

export interface CategoryFindManySingleOutput {
	id: string
	name: string
	createdAt: Date
	disabledAt: Date | null
}

export type CategoryFindManyOutput = FindManyOutput<CategoryFindManySingleOutput>

export interface CategoryFindManyData extends FindManyData<CategorySortField> {
	search?: string
	active?: FilterEnableDisable
}

const CategoryFindManyApi: ApiFunction<
	CategoryFindManyOutput,
	CategoryFindManyData
> = async data => {
	const result = await CallApi<CategoryFindManyResponse>('/category', 'GET', true, {
		params: {
			pagination: data.pagination,
			sort: data.sort,
			search: data.search,
			active: data.active,
		},
	})

	const outputData = result.data.data

	return {
		pagination: outputData.pagination,
		list: outputData.list.map(account => ({
			id: account.id,
			name: account.name,
			createdAt: new Date(account.createdAt),
			disabledAt: account.disabledAt ? new Date(account.disabledAt) : null,
		})),
	}
}

export default CategoryFindManyApi
