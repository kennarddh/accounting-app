import { CelosiaRequest, DI, EmptyObject } from '@celosiajs/core'

import { ApiErrorResource } from '@accounting-app/common'

import { NotFoundError } from 'Errors'

import UserSessionService, { UserSession } from '../../../UserSession/UserSessionService'
import ResourceContextGetter from '../ResourceContextGetter'

class UserSessionResourceContextGetter extends ResourceContextGetter<UserSession> {
	async getContext(request: CelosiaRequest<EmptyObject, EmptyObject, { id: bigint }>) {
		const userSessionId = request.params.id

		const userSessionService = DI.get(UserSessionService)

		const userSession = await userSessionService.findById(userSessionId)

		if (userSession === null) throw new NotFoundError(ApiErrorResource.UserSession)

		return userSession
	}
}

export default UserSessionResourceContextGetter
