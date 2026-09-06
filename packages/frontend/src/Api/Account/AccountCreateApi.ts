import { AccountType } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface AccountCreateResponse {
	id: string
}

export interface AccountCreateData {
	code: string
	name: string
	type: AccountType
}

export interface AccountCreateOutput {
	id: string
}

const AccountCreateApi: ApiFunction<AccountCreateOutput, AccountCreateData> = async data => {
	const result = await CallApi<AccountCreateResponse>('/account', 'POST', true, {
		data,
	})

	const outputData = result.data.data

	return {
		id: outputData.id,
	}
}

export default AccountCreateApi
