import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface CategoryFindByIdResponse {
	id: string
	name: string
	createdAt: number
	disabledAt: number | null
}

export interface CategoryFindByIdOutput {
	id: string
	name: string
	createdAt: Date
	disabledAt: Date | null
}

export interface CategoryFindByIdData {
	id: string
}

const CategoryFindByIdApi: ApiFunction<
	CategoryFindByIdOutput,
	CategoryFindByIdData
> = async data => {
	const result = await CallApi<CategoryFindByIdResponse>(`/category/${data.id}`, 'GET', true)

	const outputData = result.data.data

	return {
		id: outputData.id,
		name: outputData.name,
		createdAt: new Date(outputData.createdAt),
		disabledAt: outputData.disabledAt ? new Date(outputData.disabledAt) : null,
	}
}

export default CategoryFindByIdApi
