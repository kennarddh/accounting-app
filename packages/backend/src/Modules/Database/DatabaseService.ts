import { DI, DependencyScope, Injectable, Service } from '@celosiajs/core'

import { PrismaPg } from '@prisma/adapter-pg'
import { AsyncLocalStorage } from 'async_hooks'

import ConfigurationService from 'Modules/Configuration/ConfigurationService'

import { Prisma, PrismaClient } from 'PrismaGenerated/client'

type ConfiguredPrismaClient = PrismaClient<'info' | 'query' | 'warn'>

@Injectable(DependencyScope.Singleton)
class DatabaseService extends Service {
	private _prisma: ConfiguredPrismaClient

	private asyncLocalStorage = new AsyncLocalStorage<Prisma.TransactionClient>()

	constructor(configurationService = DI.get(ConfigurationService)) {
		super('DatabaseService')

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

		this._prisma.$on('query', event => {
			this.logger.debug('Query.', event)
		})

		this._prisma.$on('info', event => {
			this.logger.info('Information.', event)
		})

		this._prisma.$on('warn', event => {
			this.logger.warn('Warn event.', event)
		})
	}

	async connect() {
		this.logger.info('Init.')

		try {
			await this._prisma.$connect()

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

		await this._prisma.$disconnect()

		this.logger.info('Disconnected.')
	}

	public async isReady() {
		try {
			await this._prisma.$queryRaw`SELECT 1`

			return true
		} catch (error) {
			this.logger.error('Ready check failed.', error)

			return false
		}
	}

	/**
	 * Always returns the current active transaction client if inside a transaction,
	 * or the root prisma client if outside.
	 */
	get client(): Prisma.TransactionClient | PrismaClient {
		return this.asyncLocalStorage.getStore() ?? this._prisma
	}

	/**
	 * Reusable Unit of Work transaction runner.
	 * Automatically handles nested calls: If a transaction is already active,
	 * it joins the existing one rather than spawning a new one.
	 */
	async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
		const currentTx = this.asyncLocalStorage.getStore()

		if (currentTx) return await fn(currentTx)

		// Otherwise, start a new transaction and bind it to the async context
		return await this._prisma.$transaction(async tx => {
			return await this.asyncLocalStorage.run(tx, async () => {
				return await fn(tx)
			})
		})
	}
}

export default DatabaseService
