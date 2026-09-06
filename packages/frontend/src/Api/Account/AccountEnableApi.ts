import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface AccountEnableData {
	id: string
}

const AccountEnableApi: ApiFunction<null, AccountEnableData> = async data => {
	await CallApi(`/account/${data.id}/enable`, 'POST', true)
}

export default AccountEnableApi
