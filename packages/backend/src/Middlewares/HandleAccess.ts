import { CelosiaRequest, CelosiaResponse, DI, Middleware, NextFunction } from '@celosiajs/core'

import { ApiErrorKind } from '@accounting-app/common'

import AccessControlService from 'Modules/Auth/AccessControl/AccessControlService'
import ResourceAccessPolicy from 'Modules/Auth/AccessControl/ResourceAccessPolicy'
import { OptionalResourceContextGetter } from 'Modules/Auth/AccessControl/ResourceContextGetter'

import { JWTVerifiedData } from './VerifyJWT'

class HandleAccess<
	Context = undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Request extends CelosiaRequest<any, any, any, any> = CelosiaRequest,
> extends Middleware<Request, CelosiaResponse, JWTVerifiedData> {
	constructor(
		public resourceAccessPolicies: ResourceAccessPolicy<Context>[],
		public getResourceContext: Context extends undefined
			? undefined
			: OptionalResourceContextGetter<Context> = undefined as Context extends undefined
			? undefined
			: OptionalResourceContextGetter<Context>,
		private accessControlService = DI.get(AccessControlService),
	) {
		super('HandleAccess')
	}

	public override async index(
		data: JWTVerifiedData,
		request: Request,
		response: CelosiaResponse,
		next: NextFunction,
	) {
		const userId = data.user.session.user.id

		try {
			const hasAccess = await this.accessControlService.hasAccess(
				this.resourceAccessPolicies,
				this.getResourceContext,
				request,
				userId,
			)

			if (!hasAccess)
				return response.status(403).json({
					errors: {
						others: [
							{
								resource: null,
								kind: ApiErrorKind.Unauthorized,
							},
						],
					},
					data: {},
				})

			next()
		} catch (error) {
			this.logger.error('Other.', error)

			return response.sendInternalServerError()
		}
	}
}

export default HandleAccess
