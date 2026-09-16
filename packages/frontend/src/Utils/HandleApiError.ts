import { ApiErrorKind } from '@accounting-app/common'
import { t } from 'i18next'

import { FormatParsingError, IsApiResponseError } from 'Api/index'

const HandleApiError = async (error: unknown): Promise<string> => {
	if (IsApiResponseError(error)) {
		const { parsing, others } = error.apiErrorResponse.errors

		// 2. Request Body/Query Validation Errors (Zod)
		if (parsing) {
			const formattedParsingErrors = FormatParsingError(parsing)

			return formattedParsingErrors.join('\n')
		}

		// 3. Domain & Business Errors (With automatic i18n fallback & interpolation)
		if (others && others.length > 0) {
			const firstError = others[0]

			if (!firstError) return t('errors.unknown.text')

			// Specific check for unauthorized / access denied
			if (firstError.kind === ApiErrorKind.Unauthorized) {
				return t('errors.accessDenied.text')
			}

			// Build fallback key cascade from MOST specific to LEAST specific:
			const candidateKeys: string[] = []

			if (firstError.resource && firstError.field) {
				// e.g. "errors.JournalEntry.entryNumber.Taken"
				candidateKeys.push(
					`errors.${firstError.resource}.${firstError.field}.${firstError.kind}`,
				)
			}

			if (firstError.resource) {
				// e.g. "errors.Account.Disabled"
				candidateKeys.push(`errors.${firstError.resource}.${firstError.kind}`)
			}

			// e.g. "errors.kinds.Disabled" (Generic fallback)
			candidateKeys.push(`errors.kinds.${firstError.kind}`)

			// Universal fallback
			candidateKeys.push('errors.unknown.text')

			// Combine meta, field, and resource for translation interpolation!
			const interpolationParams = {
				...firstError.meta,
				field: firstError.field ?? '',
				resource: firstError.resource ?? '',
			}

			return t(candidateKeys, interpolationParams)
		}
	}

	return t('errors.network.text')
}

export default HandleApiError
