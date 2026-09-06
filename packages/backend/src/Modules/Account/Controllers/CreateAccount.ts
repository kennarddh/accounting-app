import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { AccountType } from '@accounting-app/common'
import z from 'zod/v4'

import AccountService from '../AccountService'

class CreateAccount extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('CreateAccount')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<CreateAccount>,
		response: CelosiaResponse,
	) {
		const { code, name, type } = request.body

		try {
			const account = await this.accountService.create({
				code,
				name,
				type,
			})

			return response.status(200).json({
				errors: {},
				data: {
					id: account.id.toString(),
				},
			})
		} catch (error) {
			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}

	public override get body() {
		return z.object({
			code: z.string().trim().min(1).max(20),
			name: z.string().trim().min(1).max(100),
			type: z.enum(AccountType),
		})
	}
}

export default CreateAccount
