import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'

import { DomainError } from 'Errors'

export class TokenExpiredError extends DomainError {
	readonly kind = ApiErrorKind.Expired

	constructor(
		public readonly resource: ApiErrorResource.AccessToken | ApiErrorResource.RefreshToken,
		public readonly expiredAt?: Date,
	) {
		super(`${resource} is expired.`, {
			meta: expiredAt ? { expiredAt: expiredAt.getTime() } : undefined,
		})
	}
}

export class TokenVerifyError extends DomainError {
	readonly kind = ApiErrorKind.Invalid

	constructor(
		public readonly resource: ApiErrorResource.AccessToken | ApiErrorResource.RefreshToken,
	) {
		super(`${resource} is invalid.`)
	}
}

export class TokenSignError extends Error {
	constructor() {
		super('Failed to sign token')
		this.name = 'TokenSignError'
	}
}
