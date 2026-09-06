import { CelosiaRequest, CelosiaResponse, Controller, DI, EmptyObject } from '@celosiajs/core'

import HealthService from './HealthService'

class HealthController extends Controller {
	constructor(private healthService = DI.get(HealthService)) {
		super('HealthController')
	}

	public override async index(_: EmptyObject, __: CelosiaRequest, response: CelosiaResponse) {
		if (await this.healthService.isHealthy()) return response.sendStatus(204)

		response.sendStatus(503)
	}
}

export default HealthController
