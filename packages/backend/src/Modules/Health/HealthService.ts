import { DI, Injectable, Service } from '@celosiajs/core'

import DatabaseRepository from 'Repositories/DatabaseRepository'

import ConfigurationService from '../Configuration/ConfigurationService'

@Injectable()
class HealthService extends Service {
	constructor(
		private configurationService = DI.get(ConfigurationService),
		private databaseRepository = DI.get(DatabaseRepository),
	) {
		super('HealthService')
	}

	async isHealthy() {
		if (!this.configurationService.loaded) return false

		const isDatabaseReady = await this.databaseRepository.isReady()

		if (!isDatabaseReady) return false

		return true
	}
}

export default HealthService
