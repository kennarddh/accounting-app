import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface AccountDisableData {
	id: string
}

const AccountDisableApi: ApiFunction<null, AccountDisableData> = async data => {
	await CallApi(`/account/${data.id}/disable`, 'POST', true)
}

export default AccountDisableApi
