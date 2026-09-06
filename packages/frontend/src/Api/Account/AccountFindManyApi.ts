import { AccountSortField, AccountType, FilterEnableDisable } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type AccountFindManyResponse = FindManyResponse<{
	id: string
	code: string
	name: string
	type: string
	createdAt: number
	updatedAt: number
	disabledAt: number | null
}>

export interface AccountFindManySingleOutput {
	id: string
	code: string
	name: string
	type: AccountType
	createdAt: Date
	updatedAt: Date
	disabledAt: Date | null
}

export type AccountFindManyOutput = FindManyOutput<AccountFindManySingleOutput>

export interface AccountFindManyData extends FindManyData<AccountSortField> {
	search?: string
	types?: AccountType[]
	active?: FilterEnableDisable
}

const AccountFindManyApi: ApiFunction<AccountFindManyOutput, AccountFindManyData> = async data => {
	const result = await CallApi<AccountFindManyResponse>('/account', 'GET', true, {
		params: {
			pagination: data.pagination,
			sort: data.sort,
			search: data.search,
			types: data.types,
			active: data.active,
		},
	})

	const outputData = result.data.data

	return {
		pagination: outputData.pagination,
		list: outputData.list.map(account => ({
			id: account.id,
			code: account.code,
			name: account.name,
			type: account.type as AccountType,
			createdAt: new Date(account.createdAt),
			updatedAt: new Date(account.updatedAt),
			disabledAt: account.disabledAt ? new Date(account.disabledAt) : null,
		})),
	}
}

export default AccountFindManyApi
