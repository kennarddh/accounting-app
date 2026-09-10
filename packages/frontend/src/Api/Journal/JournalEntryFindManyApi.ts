import { JournalEntrySortField } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type JournalEntryFindManyResponse = FindManyResponse<{
	id: string
	entryNumber: string
	date: number
	description: string
	createdBy: {
		id: string
		name: string
	}
	createdAt: number
	lines: {
		id: string
		account: {
			id: string
			code: string
			name: string
		}
		debit: string
		credit: string
		description: string
	}[]
}>

export interface JournalEntryFindManySingleOutput {
	id: string
	entryNumber: string
	date: Date
	description: string
	createdBy: {
		id: string
		name: string
	}
	createdAt: Date
	lines: {
		id: string
		account: {
			id: string
			code: string
			name: string
		}
		debit: string
		credit: string
		description: string
	}[]
}

export type JournalEntryFindManyOutput = FindManyOutput<JournalEntryFindManySingleOutput>

export interface JournalEntryFindManyData extends FindManyData<JournalEntrySortField> {
	search?: string
	accountId?: string
	createdById?: string
	fromDate?: number
	toDate?: number
}

const JournalEntryFindManyApi: ApiFunction<
	JournalEntryFindManyOutput,
	JournalEntryFindManyData
> = async data => {
	const result = await CallApi<JournalEntryFindManyResponse>('/journal', 'GET', true, {
		params: {
			pagination: data.pagination,
			sort: data.sort,
			search: data.search,
			accountId: data.accountId,
			createdById: data.createdById,
			fromDate: data.fromDate,
			toDate: data.toDate,
		},
	})

	const outputData = result.data.data

	return {
		pagination: outputData.pagination,
		list: outputData.list.map(journalEntry => ({
			id: journalEntry.id,
			entryNumber: journalEntry.entryNumber,
			date: new Date(journalEntry.date),
			description: journalEntry.description,
			createdBy: {
				id: journalEntry.createdBy.id,
				name: journalEntry.createdBy.name,
			},
			createdAt: new Date(journalEntry.createdAt),
			lines: journalEntry.lines.map(line => ({
				id: line.id,
				account: {
					id: line.account.id,
					code: line.account.code,
					name: line.account.name,
				},
				debit: line.debit,
				credit: line.credit,
				description: line.description,
			})),
		})),
	}
}

export default JournalEntryFindManyApi
