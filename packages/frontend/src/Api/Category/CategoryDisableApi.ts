import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface CategoryDisableData {
	id: string
}

const CategoryDisableApi: ApiFunction<null, CategoryDisableData> = async data => {
	await CallApi(`/category/${data.id}/disable`, 'POST', true)
}

export default CategoryDisableApi
