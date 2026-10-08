import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'

import { Chip, InputAdornment, TextField } from '@mui/material'
import {
	GridActionsCellItem,
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import { StockAdjustmentSortField, StockAdjustmentType } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/ListPageTemplate'

import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import StockAdjustmentFindManyApi, {
	StockAdjustmentFindManySingleOutput,
} from 'Api/StockAdjustment/StockAdjustmentFindManyApi'

const StockAdjustmentList: FC = () => {
	const [SearchParams, SetSearchParams] = useSearchParams()

	const [FilterSearch, SetFilterSearch] = useState(() => SearchParams.get('search') ?? '')

	const ListPageTemplateRef = useRef<ListPageTemplateHandle>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
	}, [])

	const getTypeChipColor = (type: StockAdjustmentType) => {
		switch (type) {
			case StockAdjustmentType.Restock:
				return 'success'
			case StockAdjustmentType.Waste:
				return 'error'
			case StockAdjustmentType.Correction:
				return 'warning'
			default:
				return 'default'
		}
	}

	const Columns = useMemo<GridColDef<StockAdjustmentFindManySingleOutput>[]>(
		() => [
			{
				field: 'adjustmentNumber',
				headerName: t('stockAdjustments.adjustmentNumber'),
				width: 200,
			},
			{
				field: 'date',
				headerName: t('stockAdjustments.date'),
				width: 220,
				valueGetter: (_, row) => t('common.dateTime', { date: row.date }),
			},
			{
				field: 'type',
				headerName: t('stockAdjustments.type'),
				width: 140,
				renderCell: params => (
					<Chip
						label={t(`stockAdjustments.enum.type.${params.row.type}`)}
						color={getTypeChipColor(params.row.type)}
						size='small'
					/>
				),
			},
			{
				field: 'reason',
				headerName: t('stockAdjustments.reason'),
				minWidth: 200,
				flex: 1,
			},
			{
				field: 'totalCost',
				headerName: t('stockAdjustments.totalCost'),
				width: 160,
				align: 'right',
				headerAlign: 'right',
				renderCell: params => (
					<span style={{ fontFamily: 'monospace' }}>{params.row.totalCost}</span>
				),
			},
			{
				field: 'createdBy',
				headerName: t('stockAdjustments.createdBy'),
				width: 160,
				valueGetter: (_, row) => row.createdBy.name,
			},
			{
				field: 'actions',
				type: 'actions',
				width: 80,
				getActions: params => [
					<GridActionsCellItem
						key='seeDetail'
						icon={<VisibilityIcon />}
						label={t('common.seeDetail')}
						onClick={() => Navigate(params.row.id)}
					/>,
				],
			},
		],
		[Navigate, t],
	)

	const debouncedFilterSearch = useDebounce(FilterSearch, 500)

	useEffect(() => {
		SetSearchParams(prev => {
			if (debouncedFilterSearch !== '') prev.set('search', debouncedFilterSearch)
			else prev.delete('search')

			return prev
		})
	}, [SetSearchParams, debouncedFilterSearch])

	const StockAdjustmentDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await StockAdjustmentFindManyApi({
					...TransformGridGetRowsParams<StockAdjustmentSortField>(params),
					search: debouncedFilterSearch,
				})

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[debouncedFilterSearch],
	)

	return (
		<ListPageTemplate
			ref={ListPageTemplateRef}
			title={t('stockAdjustments.list.title')}
			dataSource={StockAdjustmentDataSource}
			columns={Columns}
			sortFieldEnum={StockAdjustmentSortField}
			onFilterReset={OnFilterReset}
			filterSlot={
				<TextField
					id='search'
					label={t('common.search')}
					variant='outlined'
					size='small'
					value={FilterSearch}
					onChange={event => SetFilterSearch(event.target.value)}
					sx={{ minWidth: 200 }}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position='start'>
									<SearchIcon />
								</InputAdornment>
							),
						},
					}}
				/>
			}
		/>
	)
}

export default StockAdjustmentList

export { StockAdjustmentList as Component }
