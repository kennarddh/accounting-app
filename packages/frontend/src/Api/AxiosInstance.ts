import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import useAuthStore from 'Stores/AuthStore'
import axios from 'axios'

import AuthRefreshApi from './Auth/AuthRefreshApi'
import { ApiError } from './Errors'
import { IsAxiosResponseError } from './index'

export const AxiosInstance = axios.create({
	baseURL: import.meta.env.APP_API_SERVER_URL,
	timeout: 10000,
})

export const AuthenticatedAxiosInstance = axios.create({
	baseURL: import.meta.env.APP_API_SERVER_URL,
	timeout: 10000,
})

AuthenticatedAxiosInstance.interceptors.request.use(config => {
	config.headers['Access-Token'] = useAuthStore.getState().accessToken

	return config
})

let refreshTokenPromise: Promise<string> | null = null

AuthenticatedAxiosInstance.interceptors.response.use(undefined, async error => {
	if (IsAxiosResponseError(error)) {
		const response = error.response

		if (response?.status === 401) {
			const data = response.data

			if (
				data.errors.others?.[0]?.resource === ApiErrorResource.AccessToken &&
				data.errors.others[0].kind === ApiErrorKind.Expired
			) {
				refreshTokenPromise ??= AuthRefreshApi()
					.then(data => {
						const newAccessToken = data.token

						useAuthStore.getState().completeRefresh(newAccessToken)

						return newAccessToken
					})
					.finally(() => {
						refreshTokenPromise = null
					})

				try {
					await refreshTokenPromise

					return await AuthenticatedAxiosInstance.request(response.config)
				} catch (refreshError) {
					console.error('Unknown error during auth refresh api request.', refreshError)

					if (refreshError instanceof ApiError) throw refreshError.axiosError

					throw error
				}
			}
		}
	}

	throw error
})
