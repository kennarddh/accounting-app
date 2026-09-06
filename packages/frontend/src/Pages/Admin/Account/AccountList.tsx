import { FC, useCallback, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import EditIcon from '@mui/icons-material/Edit'
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

import { AccountSortField, ApiErrorKind } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/Admin/ListPageTemplate'

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

	const ListPageTemplateRef = useRef<ListPageTemplateHandle>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
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

	const OnRefreshData = useCallback(
		() => {
			SetSearchParams(prev => {
				if (debouncedFilterSearch !== '') prev.set('search', debouncedFilterSearch)
				else prev.delete('search')

				return prev
			})
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[debouncedFilterSearch],
	)

	const AccountDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await AccountFindManyApi({
					...TransformGridGetRowsParams<AccountSortField>(params),
					search: debouncedFilterSearch,
				})

				OnRefreshData()

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[OnRefreshData, debouncedFilterSearch],
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

export default AccountList

export { AccountList as Component }
