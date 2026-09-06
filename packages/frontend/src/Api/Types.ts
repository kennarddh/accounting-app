import { ApiOtherError, SortOrder } from '@accounting-app/common'

export type ApiFunction<Output = null, Data = null> = Data extends null
	? Output extends null
		? () => Promise<void>
		: () => Promise<Output>
	: Output extends null
		? (params: Data) => Promise<void>
		: (params: Data) => Promise<Output>

export interface ParsingErrorTree {
	errors: string[]
	items?: (ParsingErrorTree | undefined)[]
	properties?: Record<string, ParsingErrorTree>
}

export interface ParsingError {
	body?: ParsingErrorTree
	query?: ParsingErrorTree
	params?: ParsingErrorTree
	cookies?: ParsingErrorTree
}

export interface ApiErrorResponse {
	errors: {
		parsing?: ParsingError
		others?: ApiOtherError[]
	}
}

export interface ApiSuccessResponse<ResponseData> {
	data: ResponseData
}

export interface ApiPagination {
	page: number
	limit: number
	total: number
}

export interface FindManyResponse<T> {
	pagination: ApiPagination
	list: T[]
}

export interface FindManyOutput<T> {
	pagination: ApiPagination
	list: T[]
}

export interface FindManyDataPaginationOnly {
	pagination?: {
		page?: number
		limit?: number
	}
}

export interface FindManyData<SortField> extends FindManyDataPaginationOnly {
	sort?: {
		field?: SortField
		order?: SortOrder
	}
}
