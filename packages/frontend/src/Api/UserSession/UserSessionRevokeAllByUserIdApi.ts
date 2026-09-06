import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface UserSessionRevokeAllByUserIdData {
	id: string
}

const UserSessionRevokeAllByUserIdApi: ApiFunction<
	null,
	UserSessionRevokeAllByUserIdData
> = async data => {
	await CallApi(`/user/${data.id}/session`, 'DELETE', true)
}

export default UserSessionRevokeAllByUserIdApi
