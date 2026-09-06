import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'

import {
	Box,
	Checkbox,
	Chip,
	FormControl,
	InputAdornment,
	InputLabel,
	ListItemText,
	MenuItem,
	OutlinedInput,
	Select,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material'
import {
	GridActionsCellItem,
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import {
	AccountSortField,
	AccountType,
	ApiErrorKind,
	FilterEnableDisable,
} from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/ListPageTemplate'

import CreateArrayConditional from 'Utils/CreateArrayConditional'
import HandleApiError from 'Utils/HandleApiError'
import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import AccountDisableApi from 'Api/Account/AccountDisableApi'
import AccountEnableApi from 'Api/Account/AccountEnableApi'
import AccountFindManyApi, { AccountFindManySingleOutput } from 'Api/Account/AccountFindManyApi'

const AccountList: FC = () => {
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

	const [selectedTypes, setSelectedTypes] = useState<AccountType[]>(() => {
		const types = SearchParams.getAll('types')

		return types.filter(type =>
			Object.values(AccountType).includes(type as AccountType),
		) as AccountType[]
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

	const EnableDisable = useCallback(
		async (id: string, enable: boolean) => {
			ListPageTemplateRef.current?.setLoading(true)

			try {
				if (enable) await AccountEnableApi({ id })
				else await AccountDisableApi({ id })
			} catch (error) {
				const errorText = await HandleApiError(error, async error => {
					if (error.kind === ApiErrorKind.NotFound) {
						return t('products:errors.notFound')
					}
				})

				ListPageTemplateRef.current?.setError(errorText)
			} finally {
				ListPageTemplateRef.current?.setLoading(false)
				ListPageTemplateRef.current?.refresh()
			}
		},
		[t],
	)

	const Columns = useMemo<GridColDef<AccountFindManySingleOutput>[]>(
		() => [
			{
				field: 'code',
				headerName: t('accounts.code'),
				width: 75,
				filterable: false,
			},
			{
				field: 'name',
				headerName: t('accounts.name'),
				minWidth: 300,
				flex: 1,
				filterable: false,
			},
			{
				field: 'type',
				headerName: t('accounts.type'),
				width: 100,
				filterable: false,
				valueGetter: (_, row) => t(`accounts.enum.type.${row.type}`),
			},
			{
				field: 'status',
				headerName: t('accounts.status'),
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
	const debouncedEnableDisableFilter = useDebounce(enableDisableFilter, 500)
	const debouncedSelectedTypes = useDebounce(selectedTypes, 500)

	useEffect(() => {
		SetSearchParams(prev => {
			if (debouncedFilterSearch !== '') prev.set('search', debouncedFilterSearch)
			else prev.delete('search')

			prev.set('enableDisableFilter', debouncedEnableDisableFilter)

			prev.delete('types')

			for (const type of debouncedSelectedTypes) {
				prev.append('types', type)
			}

			return prev
		})
	}, [
		SetSearchParams,
		debouncedFilterSearch,
		debouncedEnableDisableFilter,
		debouncedSelectedTypes,
	])

	const AccountDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await AccountFindManyApi({
					...TransformGridGetRowsParams<AccountSortField>(params),
					search: debouncedFilterSearch,
					active: debouncedEnableDisableFilter,
					types: debouncedSelectedTypes,
				})

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[debouncedEnableDisableFilter, debouncedFilterSearch, debouncedSelectedTypes],
	)

	return (
		<ListPageTemplate
			ref={ListPageTemplateRef}
			title={t('accounts.list.title')}
			dataSource={AccountDataSource}
			columns={Columns}
			sortFieldEnum={AccountSortField}
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
					<FormControl sx={{ minWidth: 200 }} size='small' variant='outlined'>
						<InputLabel id='type-filter-label'>{t('accounts.type')}</InputLabel>
						<Select
							labelId='type-filter-label'
							multiple
							value={selectedTypes}
							onChange={event =>
								setSelectedTypes(event.target.value as AccountType[])
							}
							input={<OutlinedInput label={t('accounts.type')} />}
							renderValue={selected => (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
									{selected.map(value => (
										<Chip
											key={value}
											label={t(`accounts.enum.type.${value}`)}
											size='small'
										/>
									))}
								</Box>
							)}
						>
							{Object.values(AccountType).map(type => (
								<MenuItem key={type} value={type}>
									<Checkbox checked={selectedTypes.includes(type)} size='small' />
									<ListItemText primary={t(`accounts.enum.type.${type}`)} />
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</>
			}
		/>
	)
}

export default AccountList

export { AccountList as Component }
