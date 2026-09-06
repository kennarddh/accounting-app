import { AccountType } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface AccountFindByIdResponse {
	id: string
	code: string
	name: string
	type: string
	createdAt: number
	updatedAt: number
	disabledAt: number | null
}

export interface AccountFindByIdOutput {
	id: string
	code: string
	name: string
	type: AccountType
	createdAt: Date
	updatedAt: Date
	disabledAt: Date | null
}

export interface AccountFindByIdData {
	id: string
}

const AccountFindByIdApi: ApiFunction<AccountFindByIdOutput, AccountFindByIdData> = async data => {
	const result = await CallApi<AccountFindByIdResponse>(`/account/${data.id}`, 'GET', true)

	const outputData = result.data.data

	return {
		id: outputData.id,
		code: outputData.code,
		name: outputData.name,
		type: outputData.type as AccountType,
		createdAt: new Date(outputData.createdAt),
		updatedAt: new Date(outputData.updatedAt),
		disabledAt: outputData.disabledAt ? new Date(outputData.disabledAt) : null,
	}
}

export default AccountFindByIdApi
