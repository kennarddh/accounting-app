import { DI, DependencyScope, Injectable, Repository } from '@celosiajs/core'

import { PrismaPg } from '@prisma/adapter-pg'

import ConfigurationService from 'Modules/Configuration/ConfigurationService'

import { PrismaClient } from 'PrismaGenerated/client'

type ConfiguredPrismaClient = PrismaClient<'info' | 'query' | 'warn'>

@Injectable(DependencyScope.Singleton)
class DatabaseRepository extends Repository {
	private _prisma: ConfiguredPrismaClient

	constructor(configurationService = DI.get(ConfigurationService)) {
		super('DatabaseRepository')

		const adapter = new PrismaPg({
			connectionString: configurationService.configurations.databaseUrl,
		})

		this._prisma = new PrismaClient({
			adapter,
			log: [
				{
					emit: 'event',
					level: 'query',
				},
				{
					emit: 'event',
					level: 'info',
				},
				{
					emit: 'event',
					level: 'warn',
				},
			],
		})

		this.prisma.$on('query', event => {
			this.logger.debug('Query.', event)
		})

		this.prisma.$on('info', event => {
			this.logger.info('Information.', event)
		})

		this.prisma.$on('warn', event => {
			this.logger.warn('Warn event.', event)
		})
	}

	async connect() {
		this.logger.info('Init.')

		try {
			await this.prisma.$connect()

			const isReady = await this.isReady()

			if (!isReady) {
				throw new Error('Database is not ready')
			}

			this.logger.info('Connected.')
		} catch (error) {
			this.logger.error('Prisma failed to connect to the database.', error)

			const { default: OnShutdown } = await import('Utils/OnShutdown/OnShutdown')

			await OnShutdown(undefined, 1)
		}
	}

	async disconnect() {
		this.logger.info('Disconnecting.')

		await this.prisma.$disconnect()

		this.logger.info('Disconnected.')
	}

	get prisma() {
		return this._prisma
	}

	public async isReady() {
		try {
			await this.prisma.$queryRaw`SELECT 1`

			return true
		} catch (error) {
			this.logger.error('Ready check failed.', error)

			return false
		}
	}
}

export default DatabaseRepository
