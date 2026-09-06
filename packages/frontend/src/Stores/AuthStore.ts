import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import AuthGetCurrentSessionApi from 'Api/Auth/AuthGetCurrentSessionApi'

export interface AuthState {
	accessToken: string | null
	user: {
		id: string
		name: string
		username: string
	} | null
	isLoading: boolean
	hasChecked: boolean
	isLoggedIn: boolean
	error: Error | null
}

export interface AuthAction {
	completeLogin: (accessToken: AuthState['accessToken'], user: AuthState['user']) => void
	completeRefresh: (accessToken: AuthState['accessToken']) => void
	completeLogout: () => void
	checkAuthStatus: () => Promise<void>
}

const useAuthStore = create<AuthState & AuthAction>()(
	persist(
		(set, get) => ({
			accessToken: null,
			user: null,
			isLoading: false,
			hasChecked: false,
			isLoggedIn: false,
			error: null,
			completeLogin: (accessToken, user) =>
				set(() => ({
					accessToken,
					user,
					isLoading: false,
					isLoggedIn: true,
					hasChecked: true,
				})),
			completeRefresh: accessToken => set(() => ({ accessToken })),
			completeLogout: () =>
				set(() => ({
					accessToken: null,
					user: null,
					isLoading: false,
					isLoggedIn: false,
					hasChecked: true,
					error: null,
				})),
			checkAuthStatus: async () => {
				if (get().isLoading) return

				if (get().accessToken === null) {
					set({
						hasChecked: true,
						isLoading: false,
						isLoggedIn: false,
					})

					return
				}

				set({
					isLoading: true,
					error: null,
				})

				try {
					const session = await AuthGetCurrentSessionApi()

					set({
						hasChecked: true,
						isLoading: false,
						isLoggedIn: true,
						user: session.user,
					})
				} catch (error) {
					set({
						hasChecked: true,
						isLoading: false,
						isLoggedIn: false,
						error: error as Error,
					})
				}
			},
		}),
		{
			name: 'auth',
			storage: createJSONStorage(() => localStorage),
			partialize: state => ({ accessToken: state.accessToken }),
		},
	),
)

export default useAuthStore
