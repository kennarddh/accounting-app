import { CelosiaRequest, DI, Injectable, Service, ServiceError } from '@celosiajs/core'

import { ResourceNotFoundError } from 'Errors'

import UserService from '../../User/UserService'
import ResourceAccessPolicy from './ResourceAccessPolicy'
import { OptionalResourceContextGetter } from './ResourceContextGetter'

@Injectable()
class AccessControlService extends Service {
	constructor(private userService = DI.get(UserService)) {
		super('AccessControlService')
	}

	async hasAccess<Context = undefined>(
		resourceAccessPolicies: ResourceAccessPolicy<Context>[],
		resourceContextGetter: Context extends undefined
			? undefined
			: OptionalResourceContextGetter<Context>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		request: CelosiaRequest<any, any, any, any>,
		userId: bigint,
	) {
		const user = await this.userService.findById(userId)

		if (user === null) {
			this.logger.error("User doesn't exist.", { userId })

			throw new ServiceError()
		}

		try {
			const context = (
				resourceContextGetter === undefined
					? undefined
					: await resourceContextGetter.getContext(request)
			) as Context

			for (const resourceAccessPolicy of resourceAccessPolicies) {
				const isAllowed = await resourceAccessPolicy.hasAccess(user, context)

				if (!isAllowed) return false
			}
		} catch (error) {
			if (error instanceof ResourceNotFoundError) return false

			this.logger.error('Error in resource access policy.', error)

			throw new ServiceError()
		}

		return true
	}
}

export default AccessControlService
