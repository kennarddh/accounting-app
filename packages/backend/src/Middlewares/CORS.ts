import { DI, ExpressMiddlewareCompat, NoInputMiddleware } from '@celosiajs/core'

import cors from 'cors'

import ConfigurationService from 'Modules/Configuration/ConfigurationService'

const configurationService = DI.get(ConfigurationService)

const ExpressCORS = cors({
	origin: (origin, callback) => {
		if (configurationService.configurations.corsOrigin.includes('*'))
			return callback(null, true)

		if (configurationService.configurations.corsOrigin.includes(origin ?? ''))
			return callback(null, origin)

		callback(null, false)
	},
	credentials: true,
})

const CORS = ExpressMiddlewareCompat<NoInputMiddleware>('CORS', ExpressCORS)

export default CORS
