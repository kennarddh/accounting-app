import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface JournalEntryCreateResponse {
	id: string
}

export interface JournalEntryCreateData {
	entryNumber: string
	date: number
	description: string
	lines: {
		accountId: string
		debit: string
		credit: string
		description: string
	}[]
}

export interface JournalEntryCreateOutput {
	id: string
}

const JournalEntryCreateApi: ApiFunction<
	JournalEntryCreateOutput,
	JournalEntryCreateData
> = async data => {
	const result = await CallApi<JournalEntryCreateResponse>('/journal', 'POST', true, {
		data,
	})

	const outputData = result.data.data

	return {
		id: outputData.id,
	}
}

export default JournalEntryCreateApi
