import { AxiosError, AxiosRequestConfig, AxiosResponse, Method, isAxiosError } from 'axios'

import { AuthenticatedAxiosInstance, AxiosInstance } from 'Api/AxiosInstance'

import { ApiError, ApiErrorType } from './Errors'
import { ApiSuccessResponse } from './Types'
import { IsAxiosResponseError } from './index'

const CallApi = async <Response>(
	url: string,
	method: Method,
	needAuthentication: boolean,
	options: AxiosRequestConfig = {},
): Promise<AxiosResponse<ApiSuccessResponse<Response>>> => {
	const axiosInstance = needAuthentication ? AuthenticatedAxiosInstance : AxiosInstance

	try {
		const result = await axiosInstance.request<ApiSuccessResponse<Response>>({
			url,
			method,
			...options,
		})

		return result
	} catch (error) {
		if (isAxiosError(error) && error.code === AxiosError.ERR_NETWORK) {
			console.error('Unexpected network error during api request.', error)

			throw new ApiError(ApiErrorType.NoConnection, error, undefined)
		}

		if (!IsAxiosResponseError(error)) {
			console.error('Unexpected error during api request.', error)

			throw new ApiError(ApiErrorType.Internal, error, undefined)
		}

		if (error.response) {
			throw new ApiError(ApiErrorType.Response, error, error.response.data)
		} else if (error.request) {
			console.error('Error api request was made but no response was received.', error)
		} else {
			// Something happened in setting up the request that triggered an error.
			console.error('Error api request failed.', error)
		}

		throw new ApiError(ApiErrorType.Internal, error, undefined)
	}
}

export default CallApi
