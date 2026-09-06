import { CelosiaResponse, Controller, ControllerRequest, DI } from '@celosiajs/core'

import { JWTVerifiedData } from 'Middlewares/VerifyJWT'

import UserService from '../../User/UserService'

class Me extends Controller {
	constructor(private userService = DI.get(UserService)) {
		super('UserMe')
	}

	public async index(
		data: JWTVerifiedData,
		request: ControllerRequest<Me>,
		response: CelosiaResponse,
	) {
		const id = data.user.session.user.id

		try {
			const user = await this.userService.findById(id)

			if (!user) {
				this.logger.error("Can't find user.", { id, requestId: request.id })

				return response.sendInternalServerError()
			}

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
			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}
}

export default Me
