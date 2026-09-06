import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface UserSessionFindByIdResponse {
	id: string
	user: { id: string; name: string }
	ipAddress: string
	createdAt: number
	expireAt: number
	lastRefreshAt: number
	loggedOutAt: number | null
	revokedAt: number | null
}

export interface UserSessionFindByIdOutput {
	id: string
	user: { id: string; name: string }
	ipAddress: string
	createdAt: Date
	expireAt: Date
	lastRefreshAt: Date
	loggedOutAt: Date | null
	revokedAt: Date | null
}

export interface UserSessionFindByIdData {
	id: string
}

const UserSessionFindByIdApi: ApiFunction<
	UserSessionFindByIdOutput,
	UserSessionFindByIdData
> = async data => {
	const result = await CallApi<UserSessionFindByIdResponse>(
		`/user/session/${data.id}`,
		'GET',
		true,
	)

	const outputData = result.data.data

	return {
		id: outputData.id,
		user: { id: outputData.user.id, name: outputData.user.name },
		ipAddress: outputData.ipAddress,
		createdAt: new Date(outputData.createdAt),
		expireAt: new Date(outputData.expireAt),
		lastRefreshAt: new Date(outputData.lastRefreshAt),
		loggedOutAt: outputData.loggedOutAt ? new Date(outputData.loggedOutAt) : null,
		revokedAt: outputData.revokedAt ? new Date(outputData.revokedAt) : null,
	}
}

export default UserSessionFindByIdApi
