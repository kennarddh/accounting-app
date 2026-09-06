import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface UserCreateResponse {
	id: string
}

export interface UserCreateData {
	name: string
	username: string
	password: string
}

export interface UserCreateOutput {
	id: string
}

const UserCreateApi: ApiFunction<UserCreateOutput, UserCreateData> = async data => {
	const result = await CallApi<UserCreateResponse>('/user', 'POST', true, {
		data,
	})

	const outputData = result.data.data

	return {
		id: outputData.id,
	}
}

export default UserCreateApi
