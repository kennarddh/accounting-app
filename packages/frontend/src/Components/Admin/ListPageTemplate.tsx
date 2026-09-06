import { FC, RefObject, useCallback, useImperativeHandle, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import { Alert, Box, Button, Collapse } from '@mui/material'
import { GridColDef, GridDataSource, useGridApiRef } from '@mui/x-data-grid'

import { useTranslation } from 'react-i18next'

import ListPageDataGrid from 'Components/DataGrid/ListPageDataGrid'

import PageContainer from './PageContainer'

export interface ListPageTemplateHandle {
	setError: (error: string) => void
	setLoading: (loading: boolean) => void
	refresh: () => void
}

export interface ListPageTemplateProps {
	title: string
	sortFieldEnum: Record<string, string>
	dataSource: GridDataSource
	columns: GridColDef[]
	filterSlot?: React.ReactNode
	onFilterReset?: () => void
	cannotBeCreated?: boolean
	ref?: RefObject<ListPageTemplateHandle | null>
}

const ListPageTemplate: FC<ListPageTemplateProps> = props => {
	const [, SetSearchParams] = useSearchParams()

	const [IsFilterMenuOpen, SetIsFilterMenuOpen] = useState(false)
	const [ErrorText, SetErrorText] = useState<string | null>(null)
	const [IsLoading, SetIsLoading] = useState(false)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const GridApiRef = useGridApiRef()

	const ToggleFilterMenu = useCallback(() => {
		SetIsFilterMenuOpen(prev => !prev)
	}, [])

	const OnRefreshData = useCallback(async () => {
		await GridApiRef.current?.dataSource.fetchRows()
	}, [GridApiRef])

	const OnCreate = useCallback(async () => {
		await Navigate('new')
	}, [Navigate])

	const OnResetFilter = useCallback(() => {
		if (props.onFilterReset) props.onFilterReset()
		else SetSearchParams({})
	}, [props, SetSearchParams])

	useImperativeHandle(props.ref, () => ({
		setError: (error: string) => {
			SetErrorText(error)
		},
		setLoading: (loading: boolean) => {
			SetIsLoading(loading)
		},
		refresh: async () => {
			await GridApiRef.current?.dataSource.fetchRows()
		},
	}))

	return (
		<PageContainer title={props.title}>
			<Box
				sx={{
					height: '90%',
					display: 'flex',
					flexDirection: 'column',
					gap: 1,
				}}
			>
				{ErrorText !== null ? (
					<Alert severity='error' sx={{ width: '100%', whiteSpace: 'pre-line' }}>
						{ErrorText}
					</Alert>
				) : null}
				<Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
					<Button onClick={OnRefreshData}>{t('common.refreshData')}</Button>
					<Box sx={{ display: 'flex', gap: 1, flexDirection: 'row' }}>
						<Button
							onClick={ToggleFilterMenu}
							sx={{ display: props.filterSlot === undefined ? 'none' : 'block' }}
						>
							{IsFilterMenuOpen ? t('common.hideFilter') : t('common.showFilter')}
						</Button>
						<Button onClick={OnResetFilter}>{t('common.resetFilter')}</Button>
					</Box>
					<Button
						onClick={OnCreate}
						sx={{
							display: props.cannotBeCreated ? 'none' : 'block',
						}}
					>
						{t('common.create')}
					</Button>
				</Box>
				{props.filterSlot !== undefined ? (
					<Collapse in={IsFilterMenuOpen}>
						<Box
							sx={{
								width: '100%',
								display: 'flex',
								gap: 2,
								flexDirection: 'row',
								flexWrap: 'wrap',
							}}
						>
							{props.filterSlot}
						</Box>
					</Collapse>
				) : null}
				<ListPageDataGrid
					apiRef={GridApiRef}
					dataSource={props.dataSource}
					columns={props.columns}
					sortFieldEnum={props.sortFieldEnum}
					loading={IsLoading}
				/>
			</Box>
		</PageContainer>
	)
}

export default ListPageTemplate
