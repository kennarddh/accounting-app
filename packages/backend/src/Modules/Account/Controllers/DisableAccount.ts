import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import z from 'zod/v4'

import { ResourceNotFoundError } from 'Errors'

import AccountService from '../AccountService'

class DisableAccount extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('DisableAccount')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<DisableAccount>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			await this.accountService.disable(id)

			return response.sendStatus(204)
		} catch (error) {
			if (error instanceof ResourceNotFoundError) {
				if (error.resource === 'account') {
					return response.status(404).json({
						errors: {
							others: [
								{
									resource: ApiErrorResource.Account,
									kind: ApiErrorKind.NotFound,
								},
							],
						},
						data: {},
					})
				}
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

export default DisableAccount
