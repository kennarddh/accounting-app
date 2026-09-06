import { FC, use, useEffect, useState } from 'react'

import { Outlet, useNavigate } from 'react-router'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import useAuthStore from 'Stores/AuthStore'
import { useTranslation } from 'react-i18next'

import ErrorPageTemplate from 'Components/ErrorPageTemplate'

import { IsApiNoConnectionError, IsApiResponseError } from 'Api/index'

enum ErrorType {
	Unknown = 'Unknown',
	Network = 'Network',
}

const MainLayout: FC = () => {
	const [Error, SetError] = useState<ErrorType | null>(null)

	const checkAuthStatus = useAuthStore(state => state.checkAuthStatus)
	const isLoading = useAuthStore(state => state.isLoading)
	const completeLogout = useAuthStore(state => state.completeLogout)
	const hasChecked = useAuthStore(state => state.hasChecked)
	const error = useAuthStore(state => state.error)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!hasChecked) return
			if (!error) return

			if (IsApiResponseError(error)) {
				const firstOtherError = error.apiErrorResponse.errors.others?.[0]

				if (!firstOtherError) {
					console.error('Empty error during session check api request.', error)

					return SetError(ErrorType.Unknown)
				}

				if (
					(firstOtherError.resource === ApiErrorResource.RefreshToken &&
						(firstOtherError.kind === ApiErrorKind.Expired ||
							firstOtherError.kind === ApiErrorKind.Invalid)) ||
					(firstOtherError.resource === null &&
						firstOtherError.kind === ApiErrorKind.Unauthorized)
				) {
					completeLogout()

					await Navigate('/login')
				} else if (
					firstOtherError.resource === null &&
					firstOtherError.kind === ApiErrorKind.InternalServerError
				) {
					SetError(ErrorType.Unknown)
				}
			} else if (IsApiNoConnectionError(error)) {
				SetError(ErrorType.Network)
			} else {
				SetError(ErrorType.Unknown)
			}
		}

		main().catch((error: unknown) => console.error('MainLayout session check error', error))
	}, [Navigate, completeLogout, error, hasChecked])

	if (!hasChecked && !isLoading) {
		use(
			checkAuthStatus().catch((error: unknown) =>
				console.error('Check auth status error.', error),
			),
		)
	}

	if (!hasChecked) return null

	if (Error) {
		if (Error === ErrorType.Network)
			return (
				<ErrorPageTemplate
					title={t('errors.network.title')}
					text={t('errors.network.text')}
				/>
			)

		return (
			<ErrorPageTemplate title={t('errors.unknown.title')} text={t('errors.unknown.text')} />
		)
	}

	return <Outlet />
}

export default MainLayout
