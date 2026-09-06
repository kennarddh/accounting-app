import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface UserUpdateData {
	id: string
	name?: string
}

const UserUpdateApi: ApiFunction<null, UserUpdateData> = async data => {
	await CallApi(`/user/${data.id}`, 'PATCH', true, {
		data,
	})
}

export default UserUpdateApi
