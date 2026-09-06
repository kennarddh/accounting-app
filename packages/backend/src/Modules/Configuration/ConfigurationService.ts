import { DependencyScope, Injectable, Service } from '@celosiajs/core'

import { mergician } from 'mergician'
import z from 'zod/v4'

import { DeepPartialAndUndefined } from 'Types/Types'

import ConfigurationProvider from './Providers/ConfigurationProvider'
import EnvironmentConfigurationProvider from './Providers/EnvironmentConfigurationProvider'

export const ApplicationConfigurationSchema = z.object({
	nodeEnv: z.string(),
	host: z.string(),
	port: z.int(),
	databaseUrl: z.string(),
	tokens: z.object({
		access: z.object({
			secret: z.string(),
			expire: z.int(),
			clockTolerance: z.int(),
		}),
		refresh: z.object({
			secret: z.string(),
			clockTolerance: z.int(),
			expire: z.int(),
		}),
	}),
	rateLimiter: z.object({
		max: z.int(),
		window: z.int(),
	}),
	passwordHash: z.object({
		secret: z.string(),
	}),
	corsOrigin: z.string().array(),
	logging: z.object({
		level: z.string(),
		path: z.string(),
	}),
	baseUrl: z.string(),
	pagination: z.object({
		defaultLimit: z.int(),
		defaultMaxLimit: z.int(),
	}),
})

export type ApplicationConfiguration = z.infer<typeof ApplicationConfigurationSchema>

@Injectable(DependencyScope.Singleton)
class ConfigurationService extends Service {
	protected _loaded = false

	public configurations: ApplicationConfiguration = {} as ApplicationConfiguration

	constructor() {
		super('ConfigurationService')
	}

	public get loaded() {
		return this._loaded
	}

	public async load() {
		this.logger.info('Loading.')

		const configurations = await Promise.all([
			this.loadProvider(new EnvironmentConfigurationProvider()),
		])

		this.loadConfigurations(configurations)

		const parseResult = await ApplicationConfigurationSchema.safeParseAsync(this.configurations)

		if (!parseResult.success) {
			this.logger.error(
				'ConfiguratioService load failed due to invalid configurations',
				z.treeifyError(parseResult.error),
			)

			throw parseResult.error
		}

		this.configurations = parseResult.data

		this._loaded = true

		this.logger.info('Loaded.')
	}

	public async loadProvider(
		configurationProvider: ConfigurationProvider<
			DeepPartialAndUndefined<ApplicationConfiguration>
		>,
	) {
		return await configurationProvider.load()
	}

	public loadConfigurations(configurations: DeepPartialAndUndefined<ApplicationConfiguration>[]) {
		this.configurations = mergician(
			this.configurations,
			...configurations,
		) as ApplicationConfiguration
	}
}

export default ConfigurationService
