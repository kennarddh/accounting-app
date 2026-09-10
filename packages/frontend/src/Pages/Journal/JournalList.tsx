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

import { JournalEntrySortField } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/ListPageTemplate'

import CreateArrayConditional from 'Utils/CreateArrayConditional'
import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import JournalEntryFindManyApi, {
	JournalEntryFindManySingleOutput,
} from 'Api/Journal/JournalEntryFindManyApi'

const JournalList: FC = () => {
	const [SearchParams, SetSearchParams] = useSearchParams()

	const [FilterSearch, SetFilterSearch] = useState(() => SearchParams.get('search') ?? '')

	const ListPageTemplateRef = useRef<ListPageTemplateHandle>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
	}, [])

	const Columns = useMemo<GridColDef<JournalEntryFindManySingleOutput>[]>(
		() => [
			{ field: 'entryNumber', headerName: t('journal.entryNumber'), width: 200 },
			{
				field: 'date',
				headerName: t('journal.date'),
				width: 200,
				valueGetter: (_, row) => t('common.dateTime', { date: row.date }),
			},
			{ field: 'description', headerName: t('journal.description'), minWidth: 200, flex: 1 },
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
								label={t('common.edit')}
								onClick={() => Navigate(`${params.row.id}/edit`)}
							/>,
						],
					),
			},
		],
		[Navigate, t],
	)

	const debouncedFilterSearch = useDebounce(FilterSearch, 500)

	useEffect(() => {
		SetSearchParams(prev => {
			if (debouncedFilterSearch !== '') prev.set('search', debouncedFilterSearch)
			else prev.delete('search')

			return prev
		})
	}, [SetSearchParams, debouncedFilterSearch])

	const AccountDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await JournalEntryFindManyApi({
					...TransformGridGetRowsParams<JournalEntrySortField>(params),
					search: debouncedFilterSearch,
				})

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[debouncedFilterSearch],
	)

	return (
		<ListPageTemplate
			ref={ListPageTemplateRef}
			title={t('journal.list.title')}
			dataSource={AccountDataSource}
			columns={Columns}
			sortFieldEnum={JournalEntrySortField}
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

export default JournalList

export { JournalList as Component }
