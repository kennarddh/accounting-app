export class TokenExpiredError extends Error {
	constructor(public expiredAt: Date) {
		super('Token is expired')
	}
}

export class TokenSignError extends Error {
	constructor() {
		super('Failed to sign token')
	}
}

export class TokenVerifyError extends Error {
	constructor() {
		super('Token is invalid')
	}
}
