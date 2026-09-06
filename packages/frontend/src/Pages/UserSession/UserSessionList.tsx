import { FC, useCallback, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import LinkOffIcon from '@mui/icons-material/LinkOff'
import VisibilityIcon from '@mui/icons-material/Visibility'

import { FormControlLabel, Switch } from '@mui/material'
import {
	GridActionsCellItem,
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import {
	ApiErrorKind,
	ApiErrorResource,
	UserSessionSortField,
	UserSortField,
} from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/ListPageTemplate'

import HandleApiError from 'Utils/HandleApiError'
import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import UserSessionFindManyApi, {
	UserSessionFindManySingleOutput,
} from 'Api/UserSession/UserSessionFindManyApi'
import UserSessionRevokeApi from 'Api/UserSession/UserSessionRevokeApi'

const UserSessionList: FC = () => {
	const [SearchParams, SetSearchParams] = useSearchParams()

	const [FilterIncludeInactive, SetFilterIncludeInactive] = useState(
		SearchParams.get('includeInactive') === 'true',
	)

	const ListPageTemplateRef = useRef<ListPageTemplateHandle>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterIncludeInactive(false)
	}, [])

	const RevokeSession = useCallback(
		async (id: string) => {
			ListPageTemplateRef.current?.setLoading(true)

			try {
				await UserSessionRevokeApi({ id })
			} catch (error) {
				const errorText = await HandleApiError(error, async error => {
					if (
						error.resource === ApiErrorResource.UserSession &&
						error.kind === ApiErrorKind.NotFound
					) {
						return t('userSessions.errors.notFound')
					} else if (
						error.resource === ApiErrorResource.UserSession &&
						error.kind === ApiErrorKind.Inactive
					) {
						return t('userSessions.errors.inactive')
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

	const Columns = useMemo<GridColDef<UserSessionFindManySingleOutput>[]>(
		() => [
			{
				field: 'user',
				headerName: t('userSessions.user'),
				minWidth: 300,
				flex: 1,
				filterable: false,
				sortable: false,
				valueGetter: (_, row) => row.user.name,
			},
			{
				field: 'ipAddress',
				headerName: t('userSessions.ipAddress'),
				width: 200,
				filterable: false,
				sortable: false,
			},
			{
				field: 'createdAt',
				headerName: t('userSessions.createdAt'),
				filterable: false,
				minWidth: 250,
				flex: 1,
				valueFormatter: (value: Date) => t('common.dateTime', { date: value }),
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
					<GridActionsCellItem
						key='revokeSession'
						icon={<LinkOffIcon />}
						label={t('userSessions.revokeSession')}
						onClick={() => RevokeSession(params.row.id)}
						showInMenu
					/>,
				],
			},
		],
		[Navigate, RevokeSession, t],
	)

	const debouncedFilterIncludeDisabled = useDebounce(FilterIncludeInactive, 500)

	const OnRefreshData = useCallback(() => {
		SetSearchParams(prev => {
			if (debouncedFilterIncludeDisabled) prev.set('includeInactive', 'true')
			else prev.delete('includeInactive')

			return prev
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedFilterIncludeDisabled])

	const UserDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await UserSessionFindManyApi({
					...TransformGridGetRowsParams<UserSessionSortField>(params),
					includeInactive: debouncedFilterIncludeDisabled,
				})

				OnRefreshData()

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[OnRefreshData, debouncedFilterIncludeDisabled],
	)

	return (
		<ListPageTemplate
			ref={ListPageTemplateRef}
			title={t('userSessions.list.title')}
			dataSource={UserDataSource}
			columns={Columns}
			sortFieldEnum={UserSortField}
			onFilterReset={OnFilterReset}
			cannotBeCreated
			filterSlot={
				<FormControlLabel
					control={
						<Switch
							checked={FilterIncludeInactive}
							onChange={event => SetFilterIncludeInactive(event.target.checked)}
						/>
					}
					label={t('common.includeInactive')}
				/>
			}
		/>
	)
}

export default UserSessionList

export { UserSessionList as Component }
