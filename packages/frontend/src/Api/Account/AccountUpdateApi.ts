import { AccountType } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface AccountUpdateData {
	id: string
	code?: string
	name?: string
	type?: AccountType
}

const AccountUpdateApi: ApiFunction<null, AccountUpdateData> = async data => {
	await CallApi(`/account/${data.id}`, 'PATCH', true, {
		data,
	})
}

export default AccountUpdateApi
