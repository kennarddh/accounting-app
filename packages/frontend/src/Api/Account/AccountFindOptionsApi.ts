import { AccountType } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface AccountFindOptionsResponse {
	list: {
		id: string
		code: string
		name: string
		type: string
	}[]
}

export interface AccountOptionOutput {
	id: string
	code: string
	name: string
	type: AccountType
}

export type AccountFindOptionsOutput = AccountOptionOutput[]

const AccountFindOptionsApi: ApiFunction<AccountFindOptionsOutput> = async () => {
	const result = await CallApi<AccountFindOptionsResponse>('/account/options', 'GET', true)

	return result.data.data.list.map(account => ({
		id: account.id,
		code: account.code,
		name: account.name,
		type: account.type as AccountType,
	}))
}

export default AccountFindOptionsApi
