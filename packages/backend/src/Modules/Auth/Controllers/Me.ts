import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import handleControllerError from 'Utils/HandleControllerError'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import UserService from '../../User/UserService'

class Me extends Controller {
	constructor(private userService = DI.get(UserService)) {
		super('UserMe')
	}

	public async index(
		data: JWTVerifiedData,
		_: ControllerRequest<Me>,
		response: CelosiaResponse,
	) {
		const id = data.user.id

		try {
			const user = await this.userService.findById(id)

			return response.status(200).json({
				errors: {},
				data: {
					id: user.id.toString(),
					username: user.username,
					name: user.name,
					createdAt: user.createdAt.getTime(),
					updatedAt: user.updatedAt.getTime(),
				},
			})
		} catch (error) {
			return handleControllerError(error, response, this.logger)
		}
	}
}

export default Me
