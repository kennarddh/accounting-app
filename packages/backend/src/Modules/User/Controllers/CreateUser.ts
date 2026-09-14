import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import z from 'zod/v4'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import UserService from '../UserService'

class CreateUser extends Controller {
	constructor(private userService = DI.get(UserService)) {
		super('CreateUser')
	}

	public async index(
		data: JWTVerifiedData,
		request: ControllerRequest<CreateUser>,
		response: CelosiaResponse,
	) {
		const { name, username, password } = request.body

		// TODO: Add disabled/enabled user.
		const user = await this.userService.create({
			name,
			username,
			password,
			createdById: data.user.id,
		})

		response.status(200).json({
			errors: {},
			data: {
				id: user.id,
			},
		})
	}

	public override get body() {
		return z.object({
			name: z.string().trim().min(1).max(100),
			username: z
				.string()
				.trim()
				.min(1)
				.max(50)
				.regex(/^(?!.*\s)/g, 'Must not contains white space.'),
			password: z
				.string()
				.min(8)
				.max(100)
				.regex(/^(?!.*\s)/g, 'Must not contains white space.'),
		})
	}
}

export default CreateUser
