import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface AuthLoginResponse {
	token: string
	user: {
		id: string
		name: string
		username: string
		role: string
	}
}

export interface AuthLoginData {
	username: string
	password: string
}

export interface AuthLoginOutput {
	token: string
	user: {
		id: string
		name: string
		username: string
	}
}

const AuthLoginApi: ApiFunction<AuthLoginOutput, AuthLoginData> = async data => {
	const result = await CallApi<AuthLoginResponse>('/auth/login', 'POST', false, {
		data,
		withCredentials: true,
	})

	const outputData = result.data.data

	return {
		token: outputData.token,
		user: {
			id: outputData.user.id,
			name: outputData.user.name,
			username: outputData.user.username,
		},
	}
}

export default AuthLoginApi
