import jwt from 'jsonwebtoken'

import { JSONObject, Service } from '@celosiajs/core'

import { TokenExpiredError, TokenSignError, TokenVerifyError } from './Errors'

abstract class TokenService<T extends JSONObject> extends Service {
	constructor(
		loggingSource: string,
		private secret: jwt.Secret,
		private signOptions: jwt.SignOptions,
		private verifyOptions: jwt.VerifyOptions,
	) {
		super(loggingSource)
	}

	sign(payload: T): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			jwt.sign(
				payload,
				this.secret,
				this.signOptions,
				(error: Error | null, token: string | undefined) => {
					if (error) {
						this.logger.error('Sign.', error)

						return reject(new TokenSignError())
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					resolve(token!)
				},
			)
		})
	}

	verify(token: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			jwt.verify(token, this.secret, this.verifyOptions, (error, decoded) => {
				if (error) {
					if (error instanceof jwt.TokenExpiredError) {
						return reject(new TokenExpiredError(error.expiredAt))
					} else {
						return reject(new TokenVerifyError())
					}
				}

				resolve(decoded as T)
			})
		})
	}
}

export default TokenService
