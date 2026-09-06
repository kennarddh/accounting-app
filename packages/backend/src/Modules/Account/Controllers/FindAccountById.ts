import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import z from 'zod/v4'

import AccountService from '../AccountService'

class FindAccountById extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('FindAccountById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindAccountById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			const account = await this.accountService.findById(id)

			if (!account)
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

			return response.status(200).json({
				errors: {},
				data: {
					id: account.id.toString(),
					code: account.code,
					name: account.name,
					type: account.type,
					createdAt: account.createdAt.getTime(),
					updatedAt: account.updatedAt.getTime(),
					disabledAt: account.disabledAt?.getTime() ?? null,
				},
			})
		} catch (error) {
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

export default FindAccountById
