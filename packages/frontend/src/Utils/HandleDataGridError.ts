import { GridGetRowsError, GridUpdateRowError } from '@mui/x-data-grid'

import { ApiErrorKind } from '@accounting-app/common'

import { DataSourceErrorKind } from 'Components/DataGrid/CustomNoRowsOverlay'

import { IsApiNoConnectionError, IsApiResponseError } from 'Api/index'

const HandleDataGridError = (error: GridGetRowsError | GridUpdateRowError): DataSourceErrorKind => {
	if (!(error instanceof GridGetRowsError)) {
		console.error('Non GridGetRowsError error.', error)

		return DataSourceErrorKind.Unknown
	}

	if (error.cause === undefined) return DataSourceErrorKind.Unknown

	if (IsApiNoConnectionError(error.cause)) return DataSourceErrorKind.NoConnection

	if (IsApiResponseError(error.cause)) {
		const firstOtherError = error.cause.apiErrorResponse.errors.others?.[0]

		if (!firstOtherError) {
			console.error('Empty error during grid api request.', error)

			return DataSourceErrorKind.Unknown
		}

		if (
			firstOtherError.resource === null &&
			firstOtherError.kind === ApiErrorKind.Unauthorized
		) {
			return DataSourceErrorKind.Forbidden
		}
	}

	return DataSourceErrorKind.Unknown
}

export default HandleDataGridError
