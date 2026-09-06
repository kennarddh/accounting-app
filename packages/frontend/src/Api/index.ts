import { AxiosError } from 'axios'

import { ApiError, ApiErrorType } from './Errors'
import { ApiErrorResponse, ParsingError, ParsingErrorTree } from './Types'

export const FormatParsingErrorTree = (
	parsingErrorTree: ParsingErrorTree,
	path: string[] = [],
): string[] => {
	const formattedErrors: string[] = []

	formattedErrors.push(
		...parsingErrorTree.errors.map(error => {
			if (path.length === 0) {
				return error
			} else {
				return `${path.join('.')}: ${error}`
			}
		}),
	)

	if (parsingErrorTree.items) {
		let i = 1

		for (const item of parsingErrorTree.items) {
			if (item) {
				formattedErrors.push(...FormatParsingErrorTree(item, [...path, `${i}`]))
			}

			i += 1
		}
	}

	if (parsingErrorTree.properties) {
		for (const key of Object.keys(parsingErrorTree.properties)) {
			formattedErrors.push(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				...FormatParsingErrorTree(parsingErrorTree.properties[key]!, [...path, key]),
			)
		}
	}

	return formattedErrors
}

export const FormatParsingError = (parsingError: ParsingError): string[] => {
	const formattedErrors = []

	if (parsingError.body) formattedErrors.push(...FormatParsingErrorTree(parsingError.body))
	if (parsingError.cookies) formattedErrors.push(...FormatParsingErrorTree(parsingError.cookies))
	if (parsingError.params) formattedErrors.push(...FormatParsingErrorTree(parsingError.params))
	if (parsingError.query) formattedErrors.push(...FormatParsingErrorTree(parsingError.query))

	return formattedErrors
}

export const IsApiResponseError = (error: unknown): error is ApiError<ApiErrorType.Response> =>
	error instanceof ApiError && error.type === ApiErrorType.Response

export const IsApiInternalError = (error: unknown): error is ApiError<ApiErrorType.Internal> =>
	error instanceof ApiError && error.type === ApiErrorType.Internal

export const IsApiNoConnectionError = (
	error: unknown,
): error is ApiError<ApiErrorType.NoConnection> =>
	error instanceof ApiError && error.type === ApiErrorType.NoConnection

export const IsAxiosResponseError = (error: unknown): error is AxiosError<ApiErrorResponse> =>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	error instanceof AxiosError && error.response?.data
