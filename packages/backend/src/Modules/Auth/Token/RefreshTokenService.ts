import { DI, Injectable } from '@celosiajs/core'

import ConfigurationService from '../../Configuration/ConfigurationService'
import TokenService from './TokenService'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RefreshTokenJWTPayload = {
	jti: string
	iat: number
	exp: number
}

@Injectable()
class RefreshTokenService extends TokenService<RefreshTokenJWTPayload> {
	constructor(configurationService = DI.get(ConfigurationService)) {
		super(
			'RefreshTokenService',
			configurationService.configurations.tokens.refresh.secret,
			{},
			{
				clockTolerance: configurationService.configurations.tokens.refresh.clockTolerance,
			},
		)
	}
}

export default RefreshTokenService
