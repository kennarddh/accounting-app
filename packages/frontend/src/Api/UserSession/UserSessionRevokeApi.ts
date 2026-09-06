import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface UserSessionRevokeData {
	id: string
}

const UserSessionRevokeApi: ApiFunction<null, UserSessionRevokeData> = async data => {
	await CallApi(`/user/session/${data.id}`, 'DELETE', true)
}

export default UserSessionRevokeApi
