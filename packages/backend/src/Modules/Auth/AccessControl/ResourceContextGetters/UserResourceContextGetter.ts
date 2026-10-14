import { CelosiaRequest, DI, EmptyObject } from '@celosiajs/core'

import UserService, { User } from '../../../User/UserService'
import ResourceContextGetter from '../ResourceContextGetter'

class UserResourceContextGetter extends ResourceContextGetter<User> {
	async getContext(request: CelosiaRequest<EmptyObject, EmptyObject, { id: bigint }>) {
		const userId = request.params.id

		const userService = DI.get(UserService)

		const user = await userService.findById(userId)

		return user
	}
}

export default UserResourceContextGetter
