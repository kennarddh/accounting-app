import { ApiErrorKind } from '@accounting-app/common'

export const ErrorKindToHttpStatus: Record<ApiErrorKind, number> = {
	[ApiErrorKind.NotFound]: 404,
	[ApiErrorKind.Unauthorized]: 401,
	[ApiErrorKind.Taken]: 400,
	[ApiErrorKind.Disabled]: 400,
	[ApiErrorKind.Invalid]: 400,
	[ApiErrorKind.Inactive]: 409,
	[ApiErrorKind.Exceeded]: 429,
	[ApiErrorKind.Expired]: 401,
	[ApiErrorKind.CannotBeArray]: 400,
	[ApiErrorKind.InternalServerError]: 500,
	[ApiErrorKind.Processed]: 422,
	[ApiErrorKind.Unavailable]: 503,
}
