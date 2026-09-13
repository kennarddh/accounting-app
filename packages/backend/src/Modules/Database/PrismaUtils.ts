/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prisma } from 'PrismaGenerated/client'

export class ConflictError extends Error {
	constructor(
		public field: string,
		public resource: string,
	) {
		super(`${resource} with this ${field} already exists.`)

		this.name = 'ConflictError'
	}
}

export class NotFoundError extends Error {
	constructor(public resource: string) {
		super(`${resource} not found.`)

		this.name = 'NotFoundError'
	}
}

export class ForeignKeyError extends Error {
	constructor(public relation: string) {
		super(`Invalid reference: ${relation} does not exist.`)

		this.name = 'ForeignKeyError'
	}
}

export class DatabaseError extends Error {
	constructor(message: string) {
		super(message)

		this.name = 'DatabaseError'
	}
}

export function handlePrismaError(error: unknown, resourceName: string): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		const meta = error.meta as any

		const pgCause = meta?.driverAdapterError?.cause

		// Unique constraint violation (P2002 or Postgres 23505)
		if (error.code === 'P2002' || pgCause?.code === '23505') {
			const constraintName: string =
				pgCause?.constraint?.index ??
				pgCause?.constraint ??
				(Array.isArray(meta?.target) ? meta.target.join(', ') : 'field')

			const field = constraintName
				.replace(`${resourceName.toLowerCase()}s_`, '')
				.replace('_key', '')

			throw new ConflictError(field, resourceName)
		}

		// Record not found (P2025)
		if (error.code === 'P2025') {
			throw new NotFoundError(resourceName)
		}

		// Foreign key constraint failure (P2003 or Postgres 23503)
		if (error.code === 'P2003' || pgCause?.code === '23503') {
			const constraintName: string = pgCause?.constraint ?? meta?.field_name ?? 'relation'

			throw new ForeignKeyError(constraintName)
		}
	}

	throw error
}

export interface PaginationInput {
	page?: number
	limit?: number
	offset?: number
}

export interface PrismaPaginationOutput {
	skip: number
	take: number
}

export function buildPrismaPagination(
	pagination?: PaginationInput,
	defaultLimit = 20,
	maxLimit = 100,
): PrismaPaginationOutput {
	if (!pagination) return { skip: 0, take: defaultLimit }

	const take = Math.min(pagination.limit ?? defaultLimit, maxLimit)
	const skip = pagination.offset ?? Math.max(0, (pagination.page ?? 0) * take)

	return { skip, take }
}
