import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'

export interface ErrorOptions {
	field?: string
	meta?: Record<string, string | number | bigint> | undefined
}

export abstract class DomainError extends Error {
	abstract readonly resource: ApiErrorResource | null
	abstract readonly kind: ApiErrorKind
	readonly field: string | undefined
	readonly meta: Record<string, string | number | bigint> | undefined

	constructor(message: string, options?: ErrorOptions) {
		super(message)
		this.name = this.constructor.name
		this.field = options?.field
		this.meta = options?.meta
	}
}

// When an entity is not found
export class NotFoundError extends DomainError {
	readonly kind = ApiErrorKind.NotFound

	constructor(
		public readonly resource: ApiErrorResource,
		options?: ErrorOptions,
	) {
		super(`${resource} was not found.`, options)
	}
}

// When a unique constraint fails (e.g., duplicate code, entry number, username)
export class ConflictError extends DomainError {
	readonly kind = ApiErrorKind.Taken

	constructor(
		public readonly resource: ApiErrorResource,
		options?: ErrorOptions,
	) {
		super(`${resource} already exists.`, options)
	}
}

// When an entity exists, but is disabled or inactive
export class ResourceDisabledError extends DomainError {
	readonly kind = ApiErrorKind.Disabled

	constructor(
		public readonly resource: ApiErrorResource,
		options?: ErrorOptions,
	) {
		super(`${resource} is disabled.`, options)
	}
}

export class SessionInactiveError extends DomainError {
	readonly resource = ApiErrorResource.UserSession
	readonly kind = ApiErrorKind.Inactive

	constructor(options?: ErrorOptions) {
		super('Session is inactive.', options)
	}
}

// When accounting math or domain invariants fail (unbalanced, negative amount, etc.)
export class BusinessRuleError extends DomainError {
	readonly kind = ApiErrorKind.Invalid

	constructor(
		public readonly resource: ApiErrorResource,
		message: string,
		options?: ErrorOptions,
	) {
		super(message, options)
	}
}

export class UnauthorizedError extends DomainError {
	readonly kind = ApiErrorKind.Unauthorized
	readonly resource: ApiErrorResource | null

	constructor(
		message = 'Unauthorized',
		options?: ErrorOptions & { resource?: ApiErrorResource | null },
	) {
		super(message, options)
		// Usually null, but allows specifying ApiErrorResource.AccessToken or RefreshToken if desired
		this.resource = options?.resource ?? null
	}
}
