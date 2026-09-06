import { FC, useCallback, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'

import { InputAdornment, TextField } from '@mui/material'
import {
	GridActionsCellItem,
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import { UserSortField } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/Admin/ListPageTemplate'

import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import UserFindManyApi, { UserFindManySingleOutput } from 'Api/User/UserFindManyApi'

const UserList: FC = () => {
	const [SearchParams, SetSearchParams] = useSearchParams()

	const [FilterSearch, SetFilterSearch] = useState(() => SearchParams.get('search') ?? '')

	const ListPageTemplateRef = useRef<ListPageTemplateHandle>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
	}, [])

	const Columns = useMemo<GridColDef<UserFindManySingleOutput>[]>(
		() => [
			{ field: 'name', headerName: t('users.name'), width: 300, filterable: false },
			{
				field: 'username',
				headerName: t('users.username'),
				width: 200,
				filterable: false,
				sortable: false,
				flex: 1,
			},
			{
				field: 'createdBy',
				headerName: t('users.createdBy'),
				width: 200,
				filterable: false,
				sortable: false,
				valueGetter: (_, row) => row.createdBy?.name ?? t('users.noCreatedBy'),
			},
			{
				field: 'actions',
				type: 'actions',
				getActions: params => [
					<GridActionsCellItem
						key='seeDetail'
						icon={<VisibilityIcon />}
						label={t('common.seeDetail')}
						onClick={() => Navigate(params.row.id)}
					/>,
					<GridActionsCellItem
						key='edit'
						icon={<EditIcon />}
						label={t('common.edit')}
						onClick={() => Navigate(`${params.row.id}/edit`)}
					/>,
				],
			},
		],
		[Navigate, t],
	)

	const debouncedFilterSearch = useDebounce(FilterSearch, 500)

	const OnRefreshData = useCallback(() => {
		SetSearchParams(prev => {
			if (debouncedFilterSearch !== '') prev.set('search', debouncedFilterSearch)
			else prev.delete('search')

			return prev
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedFilterSearch])

	const UserDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await UserFindManyApi({
					...TransformGridGetRowsParams<UserSortField>(params),
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
			title={t('users.list.title')}
			dataSource={UserDataSource}
			columns={Columns}
			sortFieldEnum={UserSortField}
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

export default UserList

export { UserList as Component }
