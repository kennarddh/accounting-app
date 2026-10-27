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

import { FilterEnableDisable, SupplierSortField } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/ListPageTemplate'

import CreateArrayConditional from 'Utils/CreateArrayConditional'
import HandleApiError from 'Utils/HandleApiError'
import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useConfirm from 'Hooks/useConfirm'
import useDebounce from 'Hooks/useDebounce'

import SupplierDisableApi from 'Api/Supplier/SupplierDisableApi'
import SupplierEnableApi from 'Api/Supplier/SupplierEnableApi'
import SupplierFindManyApi, { SupplierFindManySingleOutput } from 'Api/Supplier/SupplierFindManyApi'

const SupplierList: FC = () => {
	const [SearchParams, SetSearchParams] = useSearchParams()

	const [FilterSearch, SetFilterSearch] = useState(() => SearchParams.get('search') ?? '')
	const [enableDisableFilter, setEnableDisableFilter] = useState<FilterEnableDisable>(() => {
		const filter = SearchParams.get('enableDisableFilter') as FilterEnableDisable | null
		return filter && Object.values(FilterEnableDisable).includes(filter)
			? filter
			: FilterEnableDisable.All
	})

	const ListPageTemplateRef = useRef<ListPageTemplateHandle>(null)
	const navigate = useNavigate()
	const { t } = useTranslation()
	const confirm = useConfirm()

	const handleEnableDisableFilterChange = (
		_: React.MouseEvent<HTMLElement>,
		newValue: FilterEnableDisable | null,
	) => {
		if (newValue !== null) setEnableDisableFilter(newValue)
	}

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
		setEnableDisableFilter(FilterEnableDisable.All)
	}, [])

	const EnableDisable = useCallback(
		async (id: string, name: string, enable: boolean) => {
			const isConfirmed = await confirm({
				title: enable
					? t('modals.confirmEnable.title', { item: t('suppliers.code') })
					: t('modals.confirmDisable.title', { item: t('suppliers.code') }),
				content: enable
					? t('modals.confirmEnable.message', { name })
					: t('modals.confirmDisable.message', { name }),
				confirmColor: enable ? 'primary' : 'error',
				confirmText: enable ? t('common.enable') : t('common.disable'),
			})

			if (!isConfirmed) return

			ListPageTemplateRef.current?.setLoading(true)

			try {
				if (enable) await SupplierEnableApi({ id })
				else await SupplierDisableApi({ id })
			} catch (error) {
				ListPageTemplateRef.current?.setError(HandleApiError(error))
			} finally {
				ListPageTemplateRef.current?.setLoading(false)
				ListPageTemplateRef.current?.refresh()
			}
		},
		[confirm, t],
	)

	const Columns = useMemo<GridColDef<SupplierFindManySingleOutput>[]>(
		() => [
			{ field: 'code', headerName: t('suppliers.code'), width: 130 },
			{ field: 'name', headerName: t('suppliers.name'), minWidth: 220, flex: 1 },
			{ field: 'contact', headerName: t('suppliers.contact'), width: 160 },
			{ field: 'phone', headerName: t('suppliers.phone'), width: 140 },
			{ field: 'terms', headerName: t('suppliers.terms'), width: 120 },
			{
				field: 'status',
				headerName: t('suppliers.status'),
				width: 110,
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
								onClick={() => navigate(params.row.id)}
							/>,
						],
						[
							true,
							<GridActionsCellItem
								key='edit'
								icon={<EditIcon />}
								disabled={params.row.disabledAt !== null}
								label={t('common.edit')}
								onClick={() => navigate(`${params.row.id}/edit`)}
							/>,
						],
						[
							params.row.disabledAt !== null,
							<GridActionsCellItem
								key='enable'
								label={t('common.enable')}
								showInMenu
								onClick={() => EnableDisable(params.row.id, params.row.name, true)}
							/>,
						],
						[
							params.row.disabledAt === null,
							<GridActionsCellItem
								key='disable'
								label={t('common.disable')}
								showInMenu
								onClick={() => EnableDisable(params.row.id, params.row.name, false)}
							/>,
						],
					),
			},
		],
		[EnableDisable, navigate, t],
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

	const SupplierDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await SupplierFindManyApi({
					...TransformGridGetRowsParams<SupplierSortField>(params),
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
			title={t('suppliers.list.title')}
			dataSource={SupplierDataSource}
			columns={Columns}
			sortFieldEnum={SupplierSortField}
			onFilterReset={OnFilterReset}
			filterSlot={
				<>
					<TextField
						id='search'
						label={t('common.search')}
						variant='outlined'
						size='small'
						value={FilterSearch}
						onChange={e => SetFilterSearch(e.target.value)}
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

export default SupplierList

export { SupplierList as Component }
