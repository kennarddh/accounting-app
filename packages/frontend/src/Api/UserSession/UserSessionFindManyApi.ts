import { UserSessionSortField } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type UserSessionFindManyResponse = FindManyResponse<{
	id: string
	user: { id: string; name: string }
	ipAddress: string
	createdAt: number
	expireAt: number
	lastRefreshAt: number
	loggedOutAt: number | null
	revokedAt: number | null
}>

export interface UserSessionFindManySingleOutput {
	id: string
	user: { id: string; name: string }
	ipAddress: string
	createdAt: Date
	expireAt: Date
	lastRefreshAt: Date
	loggedOutAt: Date | null
	revokedAt: Date | null
}

export type UserSessionFindManyOutput = FindManyOutput<UserSessionFindManySingleOutput>

export interface UserSessionFindManyData extends FindManyData<UserSessionSortField> {
	includeInactive?: boolean
	userId?: boolean
}

const UserSessionFindManyApi: ApiFunction<
	UserSessionFindManyOutput,
	UserSessionFindManyData
> = async data => {
	const result = await CallApi<UserSessionFindManyResponse>('/user/session', 'GET', true, {
		params: {
			pagination: data.pagination,
			sort: data.sort,
			includeInactive: data.includeInactive,
			userId: data.userId,
		},
	})

	const outputData = result.data.data

	return {
		pagination: outputData.pagination,
		list: outputData.list.map(userSession => ({
			id: userSession.id,
			user: {
				id: userSession.user.id,
				name: userSession.user.name,
			},
			ipAddress: userSession.ipAddress,
			createdAt: new Date(userSession.createdAt),
			expireAt: new Date(userSession.expireAt),
			lastRefreshAt: new Date(userSession.lastRefreshAt),
			loggedOutAt: userSession.loggedOutAt ? new Date(userSession.loggedOutAt) : null,
			revokedAt: userSession.revokedAt ? new Date(userSession.revokedAt) : null,
		})),
	}
}

export default UserSessionFindManyApi
