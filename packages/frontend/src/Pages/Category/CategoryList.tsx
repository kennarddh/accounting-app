import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'

import { Chip, InputAdornment, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import {
	GridActionsCellItem,
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import { CategorySortField, FilterEnableDisable } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/ListPageTemplate'

import CreateArrayConditional from 'Utils/CreateArrayConditional'
import HandleApiError from 'Utils/HandleApiError'
import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import CategoryDisableApi from 'Api/Category/CategoryDisableApi'
import CategoryEnableApi from 'Api/Category/CategoryEnableApi'
import CategoryFindManyApi, { CategoryFindManySingleOutput } from 'Api/Category/CategoryFindManyApi'

const CategoryList: FC = () => {
	const [SearchParams, SetSearchParams] = useSearchParams()

	const [FilterSearch, SetFilterSearch] = useState(() => SearchParams.get('search') ?? '')
	const [enableDisableFilter, setEnableDisableFilter] = useState<FilterEnableDisable>(() => {
		const enableDisableFilter = SearchParams.get(
			'enableDisableFilter',
		) as FilterEnableDisable | null

		if (enableDisableFilter === null) return FilterEnableDisable.All

		if (Object.values(FilterEnableDisable).includes(enableDisableFilter))
			return enableDisableFilter

		return FilterEnableDisable.All
	})

	const ListPageTemplateRef = useRef<ListPageTemplateHandle>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const handleEnableDisableFilterChange = (
		_: React.MouseEvent<HTMLElement>,
		newValue: FilterEnableDisable | null,
	) => {
		if (newValue === null) return

		setEnableDisableFilter(newValue)
	}

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
		setEnableDisableFilter(FilterEnableDisable.All)
	}, [])

	const EnableDisable = useCallback(async (id: string, enable: boolean) => {
		ListPageTemplateRef.current?.setLoading(true)

		try {
			if (enable) await CategoryEnableApi({ id })
			else await CategoryDisableApi({ id })
		} catch (error) {
			ListPageTemplateRef.current?.setError(HandleApiError(error))
		} finally {
			ListPageTemplateRef.current?.setLoading(false)
			ListPageTemplateRef.current?.refresh()
		}
	}, [])

	const Columns = useMemo<GridColDef<CategoryFindManySingleOutput>[]>(
		() => [
			{
				field: 'name',
				headerName: t('categories.name'),
				minWidth: 300,
				flex: 1,
				filterable: false,
			},
			{
				field: 'status',
				headerName: t('categories.status'),
				width: 100,
				filterable: false,
				renderCell: params => {
					const isDisabled = params.row.disabledAt !== null

					return (
						<Chip
							label={isDisabled ? t('common.disabled') : t('common.active')}
							color={isDisabled ? 'default' : 'success'}
							variant={isDisabled ? 'outlined' : 'filled'}
							size='small'
						/>
					)
				},
			},
			{
				field: 'actions',
				type: 'actions',
				width: 120,
				getActions: params =>
					CreateArrayConditional(
						[
							true,
							<GridActionsCellItem
								key='seeDetail'
								icon={<VisibilityIcon />}
								label={t('common.seeDetail')}
								onClick={() => Navigate(params.row.id)}
							/>,
						],
						[
							true,
							<GridActionsCellItem
								key='edit'
								icon={<EditIcon />}
								disabled={params.row.disabledAt !== null}
								label={t('common.edit')}
								onClick={() => Navigate(`${params.row.id}/edit`)}
							/>,
						],
						[
							params.row.disabledAt !== null,
							<GridActionsCellItem
								key='enable'
								label={t('common.enable')}
								showInMenu
								onClick={() => EnableDisable(params.row.id, true)}
							/>,
						],
						[
							params.row.disabledAt === null,
							<GridActionsCellItem
								key='disable'
								label={t('common.disable')}
								showInMenu
								onClick={() => EnableDisable(params.row.id, false)}
							/>,
						],
					),
			},
		],
		[EnableDisable, Navigate, t],
	)

	const debouncedFilterSearch = useDebounce(FilterSearch, 500)

	useEffect(() => {
		SetSearchParams(prev => {
			if (debouncedFilterSearch !== '') prev.set('search', debouncedFilterSearch)
			else prev.delete('search')

			prev.set('enableDisableFilter', enableDisableFilter)

			return prev
		})
	}, [SetSearchParams, debouncedFilterSearch, enableDisableFilter])

	const CategoryDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await CategoryFindManyApi({
					...TransformGridGetRowsParams<CategorySortField>(params),
					search: debouncedFilterSearch,
					active: enableDisableFilter,
				})

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[enableDisableFilter, debouncedFilterSearch],
	)

	return (
		<ListPageTemplate
			ref={ListPageTemplateRef}
			title={t('categories.list.title')}
			dataSource={CategoryDataSource}
			columns={Columns}
			sortFieldEnum={CategorySortField}
			onFilterReset={OnFilterReset}
			filterSlot={
				<>
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
					<ToggleButtonGroup
						value={enableDisableFilter}
						exclusive
						onChange={handleEnableDisableFilterChange}
						size='small'
					>
						<ToggleButton value={FilterEnableDisable.Active}>
							{t('common.active')}
						</ToggleButton>
						<ToggleButton value={FilterEnableDisable.All}>
							{t('common.all')}
						</ToggleButton>
						<ToggleButton value={FilterEnableDisable.Disabled}>
							{t('common.disabled')}
						</ToggleButton>
					</ToggleButtonGroup>
				</>
			}
		/>
	)
}

export default CategoryList

export { CategoryList as Component }
