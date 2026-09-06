import { ApiErrorKind, ApiOtherError } from '@accounting-app/common'
import { t } from 'i18next'

import { FormatParsingError, IsApiResponseError } from 'Api/index'

const HandleApiError = async (
	error: unknown,
	handleOtherOtherError?: (error: ApiOtherError) => Promise<string | undefined>,
): Promise<string> => {
	if (IsApiResponseError(error)) {
		if (error.apiErrorResponse.errors.parsing) {
			const formattedParsingErrors = FormatParsingError(error.apiErrorResponse.errors.parsing)

			const formattedParsingError = formattedParsingErrors.join('\n')

			return formattedParsingError
		} else if (error.apiErrorResponse.errors.others) {
			const firstOtherError = error.apiErrorResponse.errors.others[0]

			if (!firstOtherError) {
				console.error('Empty error during api request.', error)

				return t('errors.unknown.text')
			}

			if (
				firstOtherError.resource === null &&
				firstOtherError.kind === ApiErrorKind.Unauthorized
			)
				return t('errors.accessDenied.text')

			if (
				firstOtherError.resource === null &&
				firstOtherError.kind === ApiErrorKind.InternalServerError
			) {
				return t('errors.unknown.text')
			}

			if (handleOtherOtherError) {
				const errorText = await handleOtherOtherError(firstOtherError)

				if (errorText !== undefined) return errorText
			}

			console.error('Not handled error during api request.', error)

			return t('errors.unknown.text')
		} else {
			console.error('Unknown api request error occured.', error)

			return t('errors.unknown.text')
		}
	} else {
		return t('errors.network.text')
	}
}

export default HandleApiError
