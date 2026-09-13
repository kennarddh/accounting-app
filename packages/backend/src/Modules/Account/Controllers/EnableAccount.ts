import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import z from 'zod/v4'

import { NotFoundError } from 'Modules/Database/PrismaUtils'

import AccountService from '../AccountService'

class EnableAccount extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('EnableAccount')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<EnableAccount>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			await this.accountService.enable(id)

			return response.sendStatus(204)
		} catch (error) {
			if (error instanceof NotFoundError && error.resource === 'account') {
				return response.status(404).json({
					errors: {
						others: [
							{ resource: ApiErrorResource.Account, kind: ApiErrorKind.NotFound },
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

export default EnableAccount
