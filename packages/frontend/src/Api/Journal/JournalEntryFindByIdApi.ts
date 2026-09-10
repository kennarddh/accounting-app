import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface JournalEntryFindByIdResponse {
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
}

export interface JournalEntryFindByIdOutput {
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

export interface JournalEntryFindByIdData {
	id: string
}

const JournalEntryFindByIdApi: ApiFunction<
	JournalEntryFindByIdOutput,
	JournalEntryFindByIdData
> = async data => {
	const result = await CallApi<JournalEntryFindByIdResponse>(`/journal/${data.id}`, 'GET', true)

	const outputData = result.data.data

	return {
		id: outputData.id,
		entryNumber: outputData.entryNumber,
		date: new Date(outputData.date),
		description: outputData.description,
		createdBy: {
			id: outputData.createdBy.id,
			name: outputData.createdBy.name,
		},
		createdAt: new Date(outputData.createdAt),
		lines: outputData.lines.map(line => ({
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
	}
}

export default JournalEntryFindByIdApi
