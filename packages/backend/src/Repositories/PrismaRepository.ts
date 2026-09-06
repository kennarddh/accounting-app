import { Repository } from '@celosiajs/core'

import { Prisma } from 'PrismaGenerated/client'

import { PaginationOptions } from './Types'

export interface PostgresDriverMeta {
	driverAdapterError?: {
		cause?: {
			kind?: string
			originalCode?: string
			constraint?: {
				index?: string
			}
		}
	}
}

class PrismaRepository extends Repository {
	constructor(
		loggingSource: string,
		protected prisma: Prisma.TransactionClient,
	) {
		super(loggingSource)
	}

	protected buildPrismaPagination(pagination?: PaginationOptions):
		| {
				skip: number
				take: number
		  }
		| undefined {
		if (!pagination) return undefined

		const { limit, offset, page } = pagination

		const take = limit

		let skip: number | undefined = undefined

		if (offset !== undefined) {
			skip = offset
		} else if (page !== undefined) {
			skip = Math.max(0, page * limit)
		}

		return {
			skip: skip ?? 0,
			take,
		}
	}
}

export default PrismaRepository
