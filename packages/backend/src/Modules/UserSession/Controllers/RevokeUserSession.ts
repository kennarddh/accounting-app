import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import z from 'zod/v4'

import { InvalidStateError, ResourceNotFoundError } from 'Errors'

import UserSessionService from '../UserSessionService'

class RevokeUserSession extends Controller {
	constructor(private userSessionService = DI.get(UserSessionService)) {
		super('RevokeUserSession')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<RevokeUserSession>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			await this.userSessionService.revoke(id)

			return response.sendStatus(204)
		} catch (error) {
			if (error instanceof ResourceNotFoundError) {
				return response.status(404).json({
					errors: {
						others: [
							{
								resource: ApiErrorResource.UserSession,
								kind: ApiErrorKind.NotFound,
							},
						],
					},
					data: {},
				})
			} else if (
				error instanceof InvalidStateError &&
				error.operation === 'revoke' &&
				error.state === 'sessionInactive'
			) {
				return response.status(409).json({
					errors: {
						others: [
							{
								resource: ApiErrorResource.UserSession,
								kind: ApiErrorKind.Inactive,
							},
						],
					},
					data: {},
				})
			}

			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default RevokeUserSession
