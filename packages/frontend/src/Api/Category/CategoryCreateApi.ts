import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface CategoryCreateResponse {
	id: string
}

export interface CategoryCreateData {
	name: string
}

export interface CategoryCreateOutput {
	id: string
}

const CategoryCreateApi: ApiFunction<CategoryCreateOutput, CategoryCreateData> = async data => {
	const result = await CallApi<CategoryCreateResponse>('/category', 'POST', true, {
		data,
	})

	const outputData = result.data.data

	return {
		id: outputData.id,
	}
}

export default CategoryCreateApi
