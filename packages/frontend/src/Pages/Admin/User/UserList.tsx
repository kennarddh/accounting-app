import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
	const [searchParams, setSearchParams] = useSearchParams()

	const [filterSearch, setFilterSearch] = useState(() => searchParams.get('search') ?? '')

	const listPageTemplateRef = useRef<ListPageTemplateHandle>(null)

	const navigate = useNavigate()
	const { t } = useTranslation()

	const debouncedFilterSearch = useDebounce(filterSearch, 500)

	useEffect(() => {
		setSearchParams(
			prev => {
				const next = new URLSearchParams(prev)

				if (debouncedFilterSearch) {
					next.set('search', debouncedFilterSearch)
				} else {
					next.delete('search')
				}

				return next
			},
			{ replace: true },
		)
	}, [debouncedFilterSearch, setSearchParams])

	const onFilterReset = useCallback(() => {
		setFilterSearch('')
	}, [])

	const columns = useMemo<GridColDef<UserFindManySingleOutput>[]>(
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
						onClick={() => navigate(params.row.id)}
					/>,
					<GridActionsCellItem
						key='edit'
						icon={<EditIcon />}
						label={t('common.edit')}
						onClick={() => navigate(`${params.row.id}/edit`)}
					/>,
				],
			},
		],
		[navigate, t],
	)

	const userDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await UserFindManyApi({
					...TransformGridGetRowsParams<UserSortField>(params),
					search: debouncedFilterSearch,
				})

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[debouncedFilterSearch],
	)

	return (
		<ListPageTemplate
			ref={listPageTemplateRef}
			title={t('users.list.title')}
			dataSource={userDataSource}
			columns={columns}
			sortFieldEnum={UserSortField}
			onFilterReset={onFilterReset}
			filterSlot={
				<TextField
					id='search'
					label={t('common.search')}
					variant='outlined'
					value={filterSearch}
					onChange={event => setFilterSearch(event.target.value)}
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
