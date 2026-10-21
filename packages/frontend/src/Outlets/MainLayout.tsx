import { FC, useEffect, useState } from 'react'

import { Await, Outlet, useLoaderData, useNavigate } from 'react-router'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import useAuthStore from 'Stores/AuthStore'
import { useTranslation } from 'react-i18next'

import ErrorPageTemplate from 'Components/ErrorPageTemplate'

import { IsApiNoConnectionError, IsApiResponseError } from 'Api/index'

enum ErrorType {
	Unknown = 'Unknown',
	Network = 'Network',
}

export const loader = async () => {
	return {
		sessionPromise: useAuthStore.getState().checkAuthStatus(),
	}
}

const MainLayout: FC = () => {
	const [Error, SetError] = useState<ErrorType | null>(null)

	const completeLogout = useAuthStore(state => state.completeLogout)
	const hasChecked = useAuthStore(state => state.hasChecked)
	const error = useAuthStore(state => state.error)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const { sessionPromise } = useLoaderData<{ sessionPromise: Promise<void> }>()

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

	return (
		<Await resolve={sessionPromise}>
			<Outlet />
		</Await>
	)
}

export default MainLayout
