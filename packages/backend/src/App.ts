import helmet from 'helmet'

import {
	CelosiaInstance,
	ExpressMiddlewareCompat,
	NoInputMiddleware,
	QueryParserMode,
} from '@celosiajs/core'

import { ApiErrorKind } from '@accounting-app/common'

import CORS from 'Middlewares/CORS'
import LogHTTPRequest from 'Middlewares/LogHTTPRequest'

import Router from './Routes'

const Instance = new CelosiaInstance({
	strict: true,
	trustProxy: process.env.NODE_ENV === 'production',
	queryParser: { mode: QueryParserMode.Extended },
	response: {
		internalServerErrorResponse: {
			errors: {
				others: [
					{
						resource: null,
						kind: ApiErrorKind.InternalServerError,
					},
				],
			},
			data: {},
		},
	},
})

// Middleware
Instance.useMiddlewares(new (ExpressMiddlewareCompat<NoInputMiddleware>('Helmet', helmet()))())
Instance.useMiddlewares(new CORS())
Instance.useMiddlewares(new LogHTTPRequest())

Instance.useRouters(Router)

Instance.addErrorHandler()

export default Instance
