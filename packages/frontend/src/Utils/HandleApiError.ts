import { ApiErrorKind } from '@accounting-app/common'
import { t } from 'i18next'

import { FormatParsingError, IsApiResponseError } from 'Api/index'

const HandleApiError = (error: unknown): string => {
	if (IsApiResponseError(error)) {
		const { parsing, others } = error.apiErrorResponse.errors
		const serverMessage = (error.apiErrorResponse as { message?: string }).message

		// 1. Zod Body/Query Validation Errors
		if (parsing) {
			const formattedParsingErrors = FormatParsingError(parsing)
			return formattedParsingErrors.join('\n')
		}

		// 2. Domain & Business Errors
		if (others && others.length > 0) {
			const firstError = others[0]
			if (!firstError) return serverMessage ?? t('errors.unknown.text')

			// Unauthorized / Access Denied
			if (firstError.kind === ApiErrorKind.Unauthorized) {
				return t('errors.accessDenied.text')
			}

			// Specific check: Closed accounting period lock
			if (firstError.meta?.date) {
				return t('errors.periodClosed', { date: firstError.meta.date })
			}

			// Build key cascade
			const candidateKeys: string[] = []

			if (firstError.resource && firstError.field) {
				candidateKeys.push(
					`errors.${firstError.resource}.${firstError.field}.${firstError.kind}`,
				)
			}

			if (firstError.resource) {
				candidateKeys.push(`errors.${firstError.resource}.${firstError.kind}`)
			}

			candidateKeys.push(`errors.kinds.${firstError.kind}`)

			const interpolationParams = {
				...firstError.meta,
				field: firstError.field ?? '',
				resource: firstError.resource ?? '',
			}

			// If i18n resolves one of the keys, use it
			for (const key of candidateKeys) {
				const translated = t(key, interpolationParams)
				// If translation exists and did not leave un-interpolated {{variables}}
				if (translated && translated !== key && !translated.includes('{{')) {
					return translated
				}
			}

			// If translation not found or template was broken, display the backend's explicit message
			if (serverMessage) {
				return serverMessage
			}

			return t('errors.unknown.text')
		}
	}

	return t('errors.network.text')
}

export default HandleApiError
