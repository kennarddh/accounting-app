import { FC, useCallback, useMemo, useState } from 'react'

import SearchIcon from '@mui/icons-material/Search'

import { InputAdornment, TextField } from '@mui/material'
import {
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import { CategorySortField } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import HandleApiError from 'Utils/HandleApiError'
import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import CategoryFindByIdApi from 'Api/Category/CategoryFindByIdApi'
import CategoryFindManyApi, { CategoryFindManySingleOutput } from 'Api/Category/CategoryFindManyApi'

import SelectTemplate from './SelectTemplate'
import { SelectResourceProps } from './Types'

const SelectCategory: FC<SelectResourceProps> = props => {
	const [FilterSearch, SetFilterSearch] = useState('')

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
	}, [])

	const GetRowById = useCallback(
		async (id: string) => {
			try {
				return await CategoryFindByIdApi({ id })
			} catch (error) {
				props.onError(HandleApiError(error))
			}
		},
		[props],
	)

	const Columns = useMemo<GridColDef<CategoryFindManySingleOutput>[]>(
		() => [
			{ field: 'name', headerName: t('categories.name'), minWidth: 300, filterable: false },
		],
		[t],
	)

	const debouncedFilterSearch = useDebounce(FilterSearch, 500)

	const CategoryDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await CategoryFindManyApi({
					...TransformGridGetRowsParams<CategorySortField>(params),
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
			getButtonLabel={selectedLabel => selectedLabel ?? t('categories.select.button')}
			title={t('categories.select.title')}
			dataSource={CategoryDataSource}
			columns={Columns}
			sortFieldEnum={CategorySortField}
			selectedRowId={props.value}
			onRowSelected={props.onChange}
			getRowLabel={row => row.name as string}
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

export default SelectCategory
