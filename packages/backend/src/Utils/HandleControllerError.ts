import winston from 'winston'

import { CelosiaResponse } from '@celosiajs/core'

import { ErrorKindToHttpStatus } from 'Utils/HttpErrorMapper'

import { DomainError } from 'Errors'

const handleControllerError = (
	error: unknown,
	response: CelosiaResponse,
	logger: winston.Logger,
) => {
	if (error instanceof DomainError) {
		const statusCode = ErrorKindToHttpStatus[error.kind]

		return response.status(statusCode).json({
			errors: {
				others: [
					{
						resource: error.resource,
						kind: error.kind,
						field: error.field ?? null,
						meta: error.meta ?? null,
					},
				],
			},
			message: error.message,
			data: {},
		})
	}

	logger.error('Other.', error)

	return response.sendInternalServerError()
}

export default handleControllerError
