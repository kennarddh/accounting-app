import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface CategoryUpdateData {
	id: string
	name?: string
}

const CategoryUpdateApi: ApiFunction<null, CategoryUpdateData> = async data => {
	await CallApi(`/category/${data.id}`, 'PATCH', true, {
		data,
	})
}

export default CategoryUpdateApi
