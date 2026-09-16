import { useCallback, useState } from 'react'

import { useNavigate } from 'react-router'

import useAuthStore from 'Stores/AuthStore'

import HandleApiError from 'Utils/HandleApiError'

import AuthLogoutApi from 'Api/Auth/AuthLogoutApi'

export const useLogout = () => {
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const completeLogout = useAuthStore(state => state.completeLogout)
	const navigate = useNavigate()

	const logout = useCallback(async () => {
		setIsLoading(true)
		try {
			await AuthLogoutApi()
		} catch (error) {
			setErrorText(HandleApiError(error))
		} finally {
			completeLogout()

			setIsLoading(false)

			await navigate('/login')
		}
	}, [completeLogout, navigate])

	return { logout, errorText, clearError: () => setErrorText(null), isLoading }
}
