import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import z from 'zod/v4'

import { ResourceNotFoundError } from 'Errors'

import UserService from '../UserService'

class UpdateUser extends Controller {
	constructor(private userService = DI.get(UserService)) {
		super('UpdateUser')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<UpdateUser>,
		response: CelosiaResponse,
	) {
		const { name } = request.body
		const { id } = request.params

		try {
			await this.userService.update(id, {
				name,
			})

			return response.sendStatus(204)
		} catch (error) {
			if (error instanceof ResourceNotFoundError) {
				if (error.resource === 'user') {
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
				}
			}

			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}

	public override get body() {
		return z.object({
			name: z.string().trim().min(1).max(100).optional(),
		})
	}

	public override get params() {
		return z.object({
			id: z.coerce.bigint().min(1n),
		})
	}
}

export default UpdateUser
