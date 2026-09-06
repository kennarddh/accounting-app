import fs from 'fs/promises'

import { ProcessEnvVariables } from 'Types/Env'
import {
	DeepPartialAndUndefined,
	FilteredStringUnionNotSuffix,
	FilteredStringUnionSuffix,
} from 'Types/Types'

import { ApplicationConfiguration } from '../ConfigurationService'
import ConfigurationProvider from './ConfigurationProvider'

class EnvironmentConfigurationProvider extends ConfigurationProvider<
	DeepPartialAndUndefined<ApplicationConfiguration>
> {
	constructor() {
		super('EnvironmentConfigurationProvider')
	}

	async loadValueOrFile(
		valueEnvName: FilteredStringUnionNotSuffix<keyof ProcessEnvVariables, '_FILE'>,
		fileEnvName: FilteredStringUnionSuffix<keyof ProcessEnvVariables, '_FILE'>,
	) {
		// eslint-disable-next-line security/detect-object-injection
		const fileEnvValue = process.env[fileEnvName]

		if (fileEnvValue !== undefined) {
			try {
				await fs.access(fileEnvValue, fs.constants.F_OK)

				// eslint-disable-next-line security/detect-non-literal-fs-filename
				return await fs.readFile(fileEnvValue, { encoding: 'utf-8' })
			} catch (error) {
				this.logger.warn(`Loading env failed.`, { fileEnvName }, error)
			}
		}

		// eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
		return process.env[valueEnvName]!
	}

	async load(): Promise<DeepPartialAndUndefined<ApplicationConfiguration>> {
		return {
			nodeEnv: process.env.NODE_ENV,
			host: process.env.HOST,
			port: parseInt(process.env.PORT, 10),
			databaseUrl: await this.loadValueOrFile('DATABASE_URL', 'DATABASE_URL_FILE'),
			tokens: {
				access: {
					secret: await this.loadValueOrFile(
						'ACCESS_TOKEN_SECRET',
						'ACCESS_TOKEN_SECRET_FILE',
					),
					expire: parseInt(process.env.ACCESS_TOKEN_EXPIRE, 10),
					clockTolerance: parseInt(process.env.ACCESS_TOKEN_CLOCK_TOLERANCE, 10),
				},
				refresh: {
					secret: await this.loadValueOrFile(
						'REFRESH_TOKEN_SECRET',
						'REFRESH_TOKEN_SECRET_FILE',
					),
					expire: parseInt(process.env.REFRESH_TOKEN_EXPIRE, 10),
					clockTolerance: parseInt(process.env.REFRESH_TOKEN_CLOCK_TOLERANCE, 10),
				},
			},
			rateLimiter: {
				max: parseInt(process.env.RATE_LIMITER_MAX, 10),
				window: parseInt(process.env.RATE_LIMITER_WINDOW, 10),
			},
			passwordHash: {
				secret: await this.loadValueOrFile(
					'PASSWORD_HASH_SECRET',
					'PASSWORD_HASH_SECRET_FILE',
				),
			},
			corsOrigin: process.env.CORS_ORIGIN.split(','),
			logging: {
				level: process.env.LOG_LEVEL,
				path: process.env.LOG_PATH,
			},
			baseUrl: process.env.BASE_URL,
			pagination: {
				defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT, 10),
				defaultMaxLimit: parseInt(process.env.PAGINATION_DEFAULT_MAX_LIMIT, 10),
			},
		}
	}
}

export default EnvironmentConfigurationProvider
