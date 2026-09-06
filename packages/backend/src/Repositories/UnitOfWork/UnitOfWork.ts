import { DI, DependencyScope, Injectable } from '@celosiajs/core'

import { AsyncLocalStorage } from 'async_hooks'

import DatabaseRepository from '../DatabaseRepository'
import UnitOfWorkTransaction from './UnitOfWorkTransaction'

@Injectable(DependencyScope.Singleton)
class UnitOfWork {
	private asyncLocalStorage = new AsyncLocalStorage<UnitOfWorkTransaction>()

	constructor(private databaseRepository = DI.get(DatabaseRepository)) {}

	/**
	 * Executes a function inside a transaction.
	 * If the transaction is already started, it will use the existing transaction.
	 * If not, it will create a new transaction.
	 * To rollback the transaction, throw an error inside the function.
	 * @param fn The function to execute inside the transaction
	 * @returns The result of the function
	 */
	async execute<T>(fn: (transaction: UnitOfWorkTransaction) => Promise<T>): Promise<T> {
		const existingTransaction = this.asyncLocalStorage.getStore()

		// While it might seem that the transaction is running outside of prisma's transaction callback.
		// It is actually running inside indirectly because this must run inside a UnitOfWorkTransaction.
		// Else it won't return true since the async local storage object is not set or is not a UnitOfWorkTransaction.
		// As long as this function is used accordingly, e.g. not manipulating the internal state or storing the transaction reference elsewhere and calling it later.
		if (existingTransaction instanceof UnitOfWorkTransaction)
			return await fn(existingTransaction)

		return await this.databaseRepository.prisma.$transaction(async prismaTx => {
			const transaction = new UnitOfWorkTransaction(prismaTx)

			return this.asyncLocalStorage.run(transaction, async () => {
				// Prisma will automatically rollback the transaction if an error is thrown
				return await fn(transaction)
			})
		})
	}
}

export default UnitOfWork
