import { FC } from 'react'

import { Navigate, Outlet } from 'react-router'

import useAuthStore from 'Stores/AuthStore'

export interface AuthorizationOutletProps {
	forNonLoggedIn?: boolean
}

const AuthorizationOutlet: FC<AuthorizationOutletProps> = props => {
	const isLoggedIn = useAuthStore(state => state.isLoggedIn)
	const isLoading = useAuthStore(state => state.isLoading)
	const hasChecked = useAuthStore(state => state.hasChecked)
	const user = useAuthStore(state => state.user)

	// Only wait while auth status is being actively checked
	if (isLoading || !hasChecked) {
		return null
	}

	if (props.forNonLoggedIn) {
		if (isLoggedIn) {
			return <Navigate to='/' replace />
		}

		return <Outlet />
	}

	if (!isLoggedIn || !user) {
		return <Navigate to='/login' replace />
	}

	return <Outlet />
}

export default AuthorizationOutlet
