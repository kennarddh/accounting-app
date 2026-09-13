import winston from 'winston'

import { Globals } from '@celosiajs/core'
import { CelosiaFormat } from '@celosiajs/logging'

import { SPLAT } from 'triple-beam'

// This file use process.env because the ConfigurationService itself require Logger.
// Preventing cyclical import.

const developmentLoggerFormat = [
	winston.format.ms(),
	winston.format(info => {
		if (info.level === 'http') {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
			info.message = `${info.method} ${info.url} ${(info.response as any).statusCode} - ${Math.round(info.processingTime as number)}ms`

			delete info.requestId
			delete info.processingTime
			delete info.headers
			delete info.httpVersion
			delete info.method
			delete info.remoteFamily
			delete info.url
			delete info.response

			// eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-dynamic-delete
			delete info[SPLAT]
		}

		return info
	})(),
	CelosiaFormat({ inspectOptions: { depth: Infinity } }),
]
const productionLoggerFormat = [
	winston.format.timestamp(),
	winston.format.errors({ stack: true }),
	winston.format.json(),
]

const loggerFormat =
	process.env.NODE_ENV === 'development' ? developmentLoggerFormat : productionLoggerFormat

const transports = []

if (process.env.NODE_ENV !== 'test') {
	transports.push(
		new winston.transports.Console({
			handleExceptions: true,
			handleRejections: true,
		}),
	)
}

const Logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'http',
	silent: process.env.NODE_ENV === 'test',
	format: winston.format.combine(...loggerFormat),
	transports,
})

Globals.logger = Logger

export default Logger
