import { DI, Injectable, Service } from '@celosiajs/core'

import DatabaseService from 'Modules/Database/DatabaseService'

import ConfigurationService from '../Configuration/ConfigurationService'

@Injectable()
class HealthService extends Service {
	constructor(
		private configurationService = DI.get(ConfigurationService),
		private db = DI.get(DatabaseService),
	) {
		super('HealthService')
	}

	async isHealthy() {
		if (!this.configurationService.loaded) return false

		const isDatabaseReady = await this.db.isReady()

		if (!isDatabaseReady) return false

		return true
	}
}

export default HealthService
