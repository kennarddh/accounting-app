import { CelosiaRequest, CelosiaResponse, Controller, EmptyObject } from '@celosiajs/core'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'

class NoMatchController extends Controller {
	constructor() {
		super('NoMatchController')
	}

	public override index(_: EmptyObject, __: CelosiaRequest, response: CelosiaResponse): void {
		response.status(404).json({
			errors: {
				others: [
					{
						resource: ApiErrorResource.Endpoint,
						kind: ApiErrorKind.NotFound,
					},
				],
			},
			data: {},
		})
	}
}

export default NoMatchController
