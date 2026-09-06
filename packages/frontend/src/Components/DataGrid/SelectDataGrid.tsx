import { FC, RefObject, memo, useCallback, useEffect, useMemo, useState } from 'react'

import {
	DataGrid,
	GridColDef,
	GridDataSource,
	GridGetRowsError,
	GridPaginationModel,
	GridRowSelectionModel,
	GridSortModel,
	GridUpdateRowError,
	GridValidRowModel,
} from '@mui/x-data-grid'
import { GridApiCommunity } from '@mui/x-data-grid/internals'

import HandleDataGridError from 'Utils/HandleDataGridError'

import CustomNoRowsOverlay, { DataSourceErrorKind } from './CustomNoRowsOverlay'

export type RowSelectedCallback = (id: string | null, row: GridValidRowModel | null) => void

interface SelectDataGridProps {
	pageSizeOptions?: number[]
	sortFieldEnum: Record<string, string>
	dataSource: GridDataSource
	columns: GridColDef[]
	apiRef: RefObject<GridApiCommunity | null>
	loading?: boolean
	selectedRowId?: string | null | undefined
	onRowSelected?: RowSelectedCallback | undefined
}

const SelectDataGrid: FC<SelectDataGridProps> = props => {
	const [DataSourceError, SetDataSourceError] = useState<DataSourceErrorKind | null>(null)

	const [RowSelectionModel, SetRowSelectionModel] = useState<GridRowSelectionModel>(() => ({
		type: 'include',
		ids: new Set(props.selectedRowId ? [props.selectedRowId] : []),
	}))

	const PageSizeOptions = useMemo(
		() => props.pageSizeOptions ?? [10, 30, 50, 100],
		[props.pageSizeOptions],
	)

	const [PaginationModel, SetPaginationModel] = useState<GridPaginationModel>({
		pageSize: 50,
		page: 0,
	})

	const [SortModel, SetSortModel] = useState<GridSortModel>([])

	const OnError = useCallback((error: GridGetRowsError | GridUpdateRowError) => {
		SetDataSourceError(HandleDataGridError(error))
	}, [])

	const SelectRow = useCallback(
		(rowSelectionModel: GridRowSelectionModel) => {
			SetRowSelectionModel(rowSelectionModel)
			const selectedId = ([...rowSelectionModel.ids][0] ?? null) as string | null

			if (props.onRowSelected && props.apiRef.current)
				props.onRowSelected(
					selectedId,
					selectedId !== null
						? (props.apiRef.current.getRowModels().get(selectedId) ?? null)
						: null,
				)
		},
		[props],
	)

	useEffect(() => {
		if (props.selectedRowId) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			SetRowSelectionModel({
				type: 'include',
				ids: new Set([props.selectedRowId]),
			})
		}
	}, [props.selectedRowId])

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
				noRowsOverlay: () => <CustomNoRowsOverlay errorKind={DataSourceError} />,
			}}
			loading={props.loading ?? false}
			disableMultipleRowSelection
			disableRowSelectionOnClick
			checkboxSelection
			keepNonExistentRowsSelected
			onRowSelectionModelChange={SelectRow}
			rowSelectionModel={RowSelectionModel}
		/>
	)
}

export default memo(SelectDataGrid, (a, b) => {
	if (Object.keys(a).length !== Object.keys(b).length) return false

	for (const key of Object.keys(a)) {
		if (a[key as keyof SelectDataGridProps] !== b[key as keyof SelectDataGridProps]) {
			return false
		}
	}

	return true
})
