import { FC, useCallback, useMemo, useState } from 'react'

import SearchIcon from '@mui/icons-material/Search'

import { InputAdornment, TextField } from '@mui/material'
import {
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import { ProductSortField } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import HandleApiError from 'Utils/HandleApiError'
import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import ProductFindByIdApi from 'Api/Product/ProductFindByIdApi'
import ProductFindManyApi, { ProductFindManySingleOutput } from 'Api/Product/ProductFindManyApi'

import SelectTemplate from './SelectTemplate'
import { SelectResourceProps } from './Types'

const SelectProduct: FC<SelectResourceProps> = props => {
	const [FilterSearch, SetFilterSearch] = useState('')

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
	}, [])

	const GetRowById = useCallback(
		async (id: string) => {
			try {
				return await ProductFindByIdApi({ id })
			} catch (error) {
				props.onError(HandleApiError(error))
			}
		},
		[props],
	)

	const Columns = useMemo<GridColDef<ProductFindManySingleOutput>[]>(
		() => [
			{ field: 'sku', headerName: t('products.sku'), width: 120, filterable: false },
			{
				field: 'name',
				headerName: t('products.name'),
				minWidth: 200,
				flex: 1,
				filterable: false,
			},
			{
				field: 'costPrice',
				headerName: t('products.costPrice'),
				width: 130,
				filterable: false,
			},
			{
				field: 'currentStock',
				headerName: t('products.currentStock'),
				width: 100,
				filterable: false,
			},
		],
		[t],
	)

	const debouncedFilterSearch = useDebounce(FilterSearch, 500)

	const ProductDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await ProductFindManyApi({
					...TransformGridGetRowsParams<ProductSortField>(params),
					search: debouncedFilterSearch,
				})

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[debouncedFilterSearch],
	)

	return (
		<SelectTemplate
			disabled={!!props.disabled}
			getButtonLabel={selectedLabel => selectedLabel ?? t('products.select.button')}
			title={t('products.select.title')}
			dataSource={ProductDataSource}
			columns={Columns}
			sortFieldEnum={ProductSortField}
			selectedRowId={props.value}
			onRowSelected={props.onChange}
			getRowLabel={row => `${row.sku as string} - ${row.name as string}`}
			slotProps={props.slotProps ?? {}}
			getRowById={GetRowById}
			ref={props.ref}
			shrinkedText={props.shrinkedText ?? null}
			onFilterReset={OnFilterReset}
			filterSlot={
				<TextField
					id='search'
					label={t('common.search')}
					variant='outlined'
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

export default SelectProduct
