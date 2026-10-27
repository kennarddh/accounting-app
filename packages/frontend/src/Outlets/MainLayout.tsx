import { FC, useEffect, useState } from 'react'

import { Await, Outlet, useLoaderData, useNavigate } from 'react-router'

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
				// Any 401/403 or invalid session -> logout & go to login
				completeLogout()
				await Navigate('/login', { replace: true })
			} else if (IsApiNoConnectionError(error)) {
				SetError(ErrorType.Network)
			} else {
				SetError(ErrorType.Unknown)
			}
		}

		main().catch((err: unknown) => console.error('MainLayout session check error', err))
	}, [Navigate, completeLogout, error, hasChecked])

	if (Error) {
		if (Error === ErrorType.Network) {
			return (
				<ErrorPageTemplate
					title={t('errors.network.title')}
					text={t('errors.network.text')}
				/>
			)
		}

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
