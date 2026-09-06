import { ApiErrorResponse } from './Types'

export enum ApiErrorType {
	Internal = 'Internal',
	NoConnection = 'NoConnection',
	Response = 'Response',
}

export class ApiError<T extends ApiErrorType> extends Error {
	constructor(
		public type: T,
		public axiosError: unknown,
		public apiErrorResponse: T extends ApiErrorType.Response ? ApiErrorResponse : undefined,
	) {
		super(`Api '${type}' error occured.`)
	}
}
