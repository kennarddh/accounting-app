import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import z from 'zod/v4'

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

			if (!user)
				return response.status(404).json({
					errors: {
						others: [
							{
								resource: ApiErrorResource.User,
								kind: ApiErrorKind.NotFound,
							},
						],
					},
					data: {},
				})

			return response.status(200).json({
				errors: {},
				data: {
					id: user.id.toString(),
					username: user.username,
					name: user.name,
					createdBy:
						user.createdBy === null
							? null
							: {
									id: user.createdBy.id.toString(),
									name: user.createdBy.name,
								},
					createdAt: user.createdAt.getTime(),
					updatedAt: user.updatedAt.getTime(),
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

export default FindUserById
