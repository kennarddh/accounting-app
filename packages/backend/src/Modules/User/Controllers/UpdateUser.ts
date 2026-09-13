import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import handleControllerError from 'Utils/HandleControllerError'

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
			await this.userService.update(id, { name })

			return response.sendStatus(204)
		} catch (error) {
			return handleControllerError(error, response, this.logger)
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
