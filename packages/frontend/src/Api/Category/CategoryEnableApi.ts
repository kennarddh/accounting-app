import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface CategoryEnableData {
	id: string
}

const CategoryEnableApi: ApiFunction<null, CategoryEnableData> = async data => {
	await CallApi(`/category/${data.id}/enable`, 'POST', true)
}

export default CategoryEnableApi
