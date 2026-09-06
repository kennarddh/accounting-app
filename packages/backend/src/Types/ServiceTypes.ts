import { SortOrder } from '@accounting-app/common'

export interface ServicePaginationOptions {
	limit?: number
	page?: number
}

export interface FindManyOptions<SortField extends string> {
	pagination?: ServicePaginationOptions
	sort?: {
		field: SortField
		order?: SortOrder
	}
}
