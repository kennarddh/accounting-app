import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import handleControllerError from 'Utils/HandleControllerError'

import UserService from '../UserService'

class FindUserById extends Controller {
	constructor(private userService = DI.get(UserService)) {
		super('FindUserById')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<FindUserById>,
		response: CelosiaResponse,
	) {
		const { id } = request.params

		try {
			const user = await this.userService.findById(id)

			return response.status(200).json({
				errors: {},
				data: {
					id: user.id,
					username: user.username,
					name: user.name,
					createdBy:
						user.createdBy === null
							? null
							: {
									id: user.createdBy.id,
									name: user.createdBy.name,
								},
					createdAt: user.createdAt.getTime(),
					updatedAt: user.updatedAt.getTime(),
				},
			})
		} catch (error) {
			return handleControllerError(error, response, this.logger)
		}
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default FindUserById
