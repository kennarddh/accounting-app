import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import AccountService from '../AccountService'

class FindAccountOptions extends Controller {
	constructor(private accountService = DI.get(AccountService)) {
		super('FindAccountOptions')
	}

	public async index(
		_: EmptyObject,
		__: ControllerRequest<FindAccountOptions>,
		response: CelosiaResponse,
	) {
		const accounts = await this.accountService.findOptions()

		response.status(200).json({
			errors: {},
			data: {
				list: accounts.map(account => ({
					id: account.id.toString(),
					code: account.code,
					name: account.name,
					type: account.type,
				})),
			},
		})
	}
}

export default FindAccountOptions
