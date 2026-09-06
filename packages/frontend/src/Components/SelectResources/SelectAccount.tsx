import { FC, useCallback, useMemo, useState } from 'react'

import SearchIcon from '@mui/icons-material/Search'

import { InputAdornment, TextField } from '@mui/material'
import {
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import { AccountSortField, ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import HandleApiError from 'Utils/HandleApiError'
import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import AccountFindByIdApi from 'Api/Account/AccountFindByIdApi'
import AccountFindManyApi, { AccountFindManySingleOutput } from 'Api/Account/AccountFindManyApi'

import SelectTemplate from './SelectTemplate'
import { SelectResourceProps } from './Types'

const SelectAccount: FC<SelectResourceProps> = props => {
	const [FilterSearch, SetFilterSearch] = useState('')
	const [FilterAccountType, SetFilterAccountType] = useState('')

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
		SetFilterAccountType('')
	}, [])

	const GetRowById = useCallback(
		async (id: string) => {
			try {
				return await AccountFindByIdApi({ id })
			} catch (error) {
				const errorText = await HandleApiError(error, async error => {
					if (
						error.resource === ApiErrorResource.Account &&
						error.kind === ApiErrorKind.NotFound
					) {
						return t('accounts.errors.notFound')
					}
				})

				props.onError(errorText)
			}
		},
		[props, t],
	)

	const Columns = useMemo<GridColDef<AccountFindManySingleOutput>[]>(
		() => [{ field: 'name', headerName: t('accounts.name'), minWidth: 300, filterable: false }],
		[t],
	)

	const debouncedFilterSearch = useDebounce(FilterSearch, 500)
	const debouncedFilterAccountType = useDebounce(FilterAccountType, 500)

	const AccountDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await AccountFindManyApi({
					...TransformGridGetRowsParams<AccountSortField>(params),
					search: debouncedFilterSearch,
					...(debouncedFilterAccountType === ''
						? {}
						: { 'types[]': debouncedFilterAccountType }),
				})

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[debouncedFilterAccountType, debouncedFilterSearch],
	)

	return (
		<SelectTemplate
			disabled={!!props.disabled}
			getButtonLabel={selectedLabel => selectedLabel ?? t('accounts.select.button')}
			title={t('accounts.select.title')}
			dataSource={AccountDataSource}
			columns={Columns}
			sortFieldEnum={AccountSortField}
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

export default SelectAccount
