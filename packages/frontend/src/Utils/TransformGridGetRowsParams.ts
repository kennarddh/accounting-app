import { GridGetRowsParams } from '@mui/x-data-grid'

import { SortOrder } from '@accounting-app/common'

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
const TransformGridGetRowsParams = <T>(params: GridGetRowsParams) => ({
	pagination: {
		page: params.paginationModel?.page ?? 0,
		limit: params.paginationModel?.pageSize ?? 100,
	},
	sort: {
		...(params.sortModel[0]?.field ? { field: params.sortModel[0].field as T } : {}),
		...(params.sortModel[0]?.sort ? { order: params.sortModel[0].sort as SortOrder } : {}),
	},
})

export default TransformGridGetRowsParams
