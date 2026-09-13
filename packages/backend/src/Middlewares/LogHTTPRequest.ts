import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http'

import {
	CelosiaRequest,
	CelosiaResponse,
	EmptyObject,
	Middleware,
	NextFunction,
} from '@celosiajs/core'

const FilterHeaders = (headers: IncomingHttpHeaders | OutgoingHttpHeaders) => {
	const { 'access-token': _, 'set-cookie': __, cookie: ___, ...newHeaders } = headers

	return newHeaders
}

const FilterResponseHeaders = (headers: OutgoingHttpHeaders) => {
	const {
		'content-security-policy': _,
		'cross-origin-opener-policy': __,
		'cross-origin-resource-policy': ___,
		'origin-agent-cluster': ____,
		'referrer-policy': _____,
		'strict-transport-security': ______,
		'x-content-type-options': _______,
		'x-dns-prefetch-control': ________,
		'x-download-options': _________,
		'x-frame-options': __________,
		'x-permitted-cross-domain-policies': ___________,
		'x-xss-protection': ____________,
		...cleanHeaders
	} = headers

	return cleanHeaders
}

class LogHTTPRequest extends Middleware {
	constructor() {
		super('LogHTTPRequest')
	}

	public override async index(
		_: EmptyObject,
		request: CelosiaRequest,
		response: CelosiaResponse,
		next: NextFunction,
	) {
		const requestStart = process.hrtime.bigint()

		response.expressResponse.on('finish', () => {
			const {
				headers,
				httpVersion,
				method,
				socket: { remoteFamily },
			} = request

			const { statusCode, statusMessage } = response

			const requestEnd = process.hrtime.bigint()

			// Nanoseconds to milliseconds
			const requestProcessingTime = Number(requestEnd - requestStart) / 1_000_000

			const rawUrl = (request.expressRequest.originalUrl || request.url) ?? ''

			let decodedUrl = rawUrl

			try {
				decodedUrl = decodeURIComponent(rawUrl)
			} catch {
				// Fall back to raw URL if decoding fails
				decodedUrl = rawUrl
			}

			this.logger.http('Incoming request', {
				requestId: request.id,
				processingTime: requestProcessingTime,
				headers: FilterHeaders(headers),
				httpVersion,
				method,
				remoteFamily,
				url: decodedUrl,
				response: {
					statusCode,
					statusMessage,
					headers: FilterResponseHeaders(response.headers),
				},
			})
		})

		next()
	}
}

export default LogHTTPRequest
