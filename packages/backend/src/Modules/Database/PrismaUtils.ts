/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiErrorResource } from '@accounting-app/common'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import { BusinessRuleError, ConflictError, NotFoundError } from 'Errors'

import { Prisma } from 'PrismaGenerated/client'

export class ForeignKeyError extends Error {
	constructor(public relation: string) {
		super(`Invalid reference: ${relation} does not exist.`)

		this.name = 'ForeignKeyError'
	}
}

export function handlePrismaError(
	error: unknown,
	resource: ApiErrorResource,
	contextData?: Record<string, string | number | bigint | undefined>,
): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		const meta = error.meta as any

		const pgCause = meta?.driverAdapterError?.cause

		// Unique constraint violation (P2002 or Postgres 23505)
		if (error.code === 'P2002' || pgCause?.code === '23505') {
			const constraintName: string =
				pgCause?.constraint?.index ??
				pgCause?.constraint ??
				(Array.isArray(meta?.target) ? meta.target.join(', ') : 'field')

			const field = constraintName.replace(`${pgCause.table}_`, '').replace('_key', '')

			throw new ConflictError(resource, {
				field,
				meta: contextData !== undefined ? RemoveUndefinedValueFromObject(contextData) : {},
			})
		}

		// Record not found (P2025)
		if (error.code === 'P2025') {
			throw new NotFoundError(resource)
		}

		// Foreign key constraint failure (P2003 or Postgres 23503)
		if (error.code === 'P2003' || pgCause?.code === '23503') {
			const rawConstraint: string = pgCause?.constraint ?? meta?.field_name ?? ''
			const fieldMatch = /_([a-zA-Z0-9]+)_fkey/.exec(rawConstraint)
			const field = fieldMatch ? fieldMatch[1] : (meta?.field_name ?? undefined)

			// Case A: Deleting a record that is still in use by other tables
			if (pgCause?.detail?.includes('is still referenced from table')) {
				throw new BusinessRuleError(
					resource,
					`Cannot delete ${resource} because other records depend on it.`,
					{ field },
				)
			}

			// Case B: Inserting/updating with a foreign ID that doesn't exist
			// We throw NotFoundError on the CURRENT resource pointing to the bad field!
			throw new NotFoundError(resource, { field })
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
