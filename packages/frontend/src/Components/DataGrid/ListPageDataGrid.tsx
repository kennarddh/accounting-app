import { FC, RefObject, memo, useCallback, useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router'

import {
	DataGrid,
	GridColDef,
	GridDataSource,
	GridGetRowsError,
	GridPaginationModel,
	GridSortModel,
	GridUpdateRowError,
} from '@mui/x-data-grid'
import { GridApiCommunity } from '@mui/x-data-grid/internals'

import { SortOrder } from '@accounting-app/common'

import HandleDataGridError from 'Utils/HandleDataGridError'

import CustomNoRowsOverlay, { DataSourceErrorKind } from './CustomNoRowsOverlay'

interface ListPageDataGridProps {
	pageSizeOptions?: number[]
	sortFieldEnum: Record<string, string>
	dataSource: GridDataSource
	columns: GridColDef[]
	apiRef: RefObject<GridApiCommunity | null>
	loading?: boolean
}

const ListPageDataGrid: FC<ListPageDataGridProps> = props => {
	const [SearchParams, SetSearchParams] = useSearchParams()

	const [DataSourceError, SetDataSourceError] = useState<DataSourceErrorKind | null>(null)

	const PageSizeOptions = useMemo(
		() => props.pageSizeOptions ?? [10, 30, 50, 100],
		[props.pageSizeOptions],
	)

	const [PaginationModel, SetPaginationModel] = useState<GridPaginationModel>(() => {
		const pageSize = parseInt(SearchParams.get('pageSize') ?? '50')
		const page = parseInt(SearchParams.get('page') ?? '0')

		return {
			pageSize: Number.isNaN(pageSize) || !PageSizeOptions.includes(pageSize) ? 50 : pageSize,
			page: Number.isNaN(page) ? 0 : page,
		}
	})

	const [SortModel, SetSortModel] = useState<GridSortModel>(() => {
		const sortField = SearchParams.get('sortField')
		const order = SearchParams.get('order')

		if (sortField === null) return []
		if (order === null) return []

		if (!Object.values(props.sortFieldEnum).includes(sortField)) return []
		if (!Object.values(SortOrder).includes(order as SortOrder)) return []

		return [{ field: sortField, sort: order as SortOrder }]
	})

	const OnError = useCallback((error: GridGetRowsError | GridUpdateRowError) => {
		SetDataSourceError(HandleDataGridError(error))
	}, [])

	useEffect(() => {
		SetSearchParams(prev => {
			prev.set('page', PaginationModel.page.toString())
			prev.set('pageSize', PaginationModel.pageSize.toString())

			return prev
		})
	}, [PaginationModel, SetSearchParams])

	useEffect(() => {
		SetSearchParams(prev => {
			const sortField = SortModel[0]?.field
			const order = SortModel[0]?.sort

			if (sortField) {
				prev.set('sortField', sortField)
			} else {
				prev.delete('sortField')
			}

			if (order) {
				prev.set('order', order)
			} else {
				prev.delete('order')
			}

			return prev
		})
	}, [SortModel, SetSearchParams])

	const noRowsOverlay = useCallback(
		() => <CustomNoRowsOverlay errorKind={DataSourceError} />,
		[DataSourceError],
	)

	return (
		<DataGrid
			apiRef={props.apiRef}
			columns={props.columns}
			hideFooterSelectedRowCount
			dataSourceCache={null}
			pageSizeOptions={PageSizeOptions}
			paginationModel={PaginationModel}
			onPaginationModelChange={SetPaginationModel}
			sortModel={SortModel}
			onSortModelChange={SetSortModel}
			dataSource={props.dataSource}
			onDataSourceError={OnError}
			slots={{
				noRowsOverlay,
			}}

			loading={props.loading ?? false}
		/>
	)
}

export default memo(ListPageDataGrid, (a, b) => {
	if (Object.keys(a).length !== Object.keys(b).length) return false

	for (const key of Object.keys(a)) {
		if (a[key as keyof ListPageDataGridProps] !== b[key as keyof ListPageDataGridProps]) {
			return false
		}
	}

	return true
})
