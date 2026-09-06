import { UserSortField } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type UserFindManyResponse = FindManyResponse<{
	id: string
	name: string
	username: string
	createdBy: { id: string; name: string } | null
	createdAt: number
	updatedAt: number
}>

export interface UserFindManySingleOutput {
	id: string
	name: string
	username: string
	createdBy: { id: string; name: string } | null
	createdAt: Date
	updatedAt: Date
}

export type UserFindManyOutput = FindManyOutput<UserFindManySingleOutput>

export interface UserFindManyData extends FindManyData<UserSortField> {
	search?: string
}

const UserFindManyApi: ApiFunction<UserFindManyOutput, UserFindManyData> = async data => {
	const result = await CallApi<UserFindManyResponse>('/user', 'GET', true, {
		params: {
			pagination: data.pagination,
			sort: data.sort,
			search: data.search,
		},
	})

	const outputData = result.data.data

	return {
		pagination: outputData.pagination,
		list: outputData.list.map(user => ({
			id: user.id,
			name: user.name,
			username: user.username,
			createdBy:
				user.createdBy === null
					? null
					: {
							id: user.createdBy.id,
							name: user.createdBy.name,
						},
			createdAt: new Date(user.createdAt),
			updatedAt: new Date(user.updatedAt),
		})),
	}
}

export default UserFindManyApi
