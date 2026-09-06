import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface AuthGetCurrentSessionResponse {
	id: string
	user: {
		id: string
		name: string
		username: string
	}
	ipAddress: string
	createdAt: number
	expireAt: number
	lastRefreshAt: number
}

export interface AuthGetCurrentSessionOutput {
	id: string
	user: {
		id: string
		name: string
		username: string
	}
	ipAddress: string
	createdAt: Date
	expireAt: Date
	lastRefreshAt: Date
}

const AuthGetCurrentSessionApi: ApiFunction<AuthGetCurrentSessionOutput> = async () => {
	const result = await CallApi<AuthGetCurrentSessionResponse>('/auth/session', 'GET', true)

	const outputData = result.data.data

	return {
		id: outputData.id,
		user: {
			id: outputData.user.id,
			name: outputData.user.name,
			username: outputData.user.username,
		},
		ipAddress: outputData.ipAddress,
		createdAt: new Date(outputData.createdAt),
		expireAt: new Date(outputData.expireAt),
		lastRefreshAt: new Date(outputData.lastRefreshAt),
	}
}

export default AuthGetCurrentSessionApi
