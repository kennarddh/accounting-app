import { DI, Injectable } from '@celosiajs/core'

import ConfigurationService from '../../Configuration/ConfigurationService'
import TokenService from './TokenService'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AccessTokenJWTPayload = {
	jti: string
	iat: number
}

@Injectable()
class AccessTokenService extends TokenService<AccessTokenJWTPayload> {
	constructor(configurationService = DI.get(ConfigurationService)) {
		super(
			'AccessTokenService',
			configurationService.configurations.tokens.access.secret,
			{
				expiresIn: configurationService.configurations.tokens.access.expire,
			},
			{
				clockTolerance: configurationService.configurations.tokens.access.clockTolerance,
			},
		)
	}
}

export default AccessTokenService
