import {
	FC,
	RefObject,
	useCallback,
	useEffect,
	useImperativeHandle,
	useState,
	useTransition,
} from 'react'

import CloseIcon from '@mui/icons-material/Close'

import {
	Box,
	Button,
	ButtonProps,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Typography,
	styled,
} from '@mui/material'
import { GridColDef, GridDataSource, GridValidRowModel, useGridApiRef } from '@mui/x-data-grid'

import { useTranslation } from 'react-i18next'

import SelectDataGrid, { RowSelectedCallback } from '../DataGrid/SelectDataGrid'
import { SelectResourceHandle } from './Types'

export interface SelectTemplateProps {
	disabled?: boolean
	getButtonLabel: (selectedLabel: string | null) => string
	title: string
	sortFieldEnum: Record<string, string>
	dataSource: GridDataSource
	columns: GridColDef[]
	onRefresh?: () => void
	filterSlot?: React.ReactNode
	onFilterReset?: () => void
	selectedRowId?: string | null
	onRowSelected?: ((id: string | null) => void) | undefined
	getRowLabel: (row: GridValidRowModel) => string
	slotProps?: {
		button?: ButtonProps
	}
	getRowById: (id: string) => Promise<GridValidRowModel | undefined>
	ref?: RefObject<SelectResourceHandle | null> | undefined
	shrinkedText: string | null
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const SelectButton = styled(Button)(({ theme }) => ({
	textTransform: 'none',
	position: 'relative',
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
	color: theme.palette.text.primary,
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	minHeight: theme.spacing(7),
}))

const SelectTemplate: FC<SelectTemplateProps> = props => {
	const [IsOpen, SetIsOpen] = useState(false)
	const [IsFilterMenuOpen, SetIsFilterMenuOpen] = useState(false)
	const [SelectedId, SetSelectedId] = useState<string | null>(null)
	const [SelectedRow, SetSelectedRow] = useState<GridValidRowModel | null>(null)
	const [SelectedLabel, SetSelectedLabel] = useState<string | null>(null)

	const { t } = useTranslation()

	const GridApiRef = useGridApiRef()

	const [isPending, startTransition] = useTransition()

	const [LastCheckedId, SetLastCheckedId] = useState<string | null>(null)

	const ToggleFilterMenu = useCallback(() => {
		SetIsFilterMenuOpen(prev => !prev)
	}, [])

	const OnRefreshData = useCallback(() => {
		if (props.onRefresh) props.onRefresh()

		GridApiRef.current?.dataSource.fetchRows().catch((error: unknown) => {
			console.error('Error refreshing data:', error)
		})
	}, [GridApiRef, props])

	const OnResetFilter = useCallback(() => {
		if (props.onFilterReset) props.onFilterReset()
	}, [props])

	const OnRowSelected = useCallback<RowSelectedCallback>((id, row) => {
		SetSelectedId(id)
		SetSelectedRow(row)
	}, [])

	const OnSave = useCallback(() => {
		SetIsOpen(false)

		if (SelectedId === null || SelectedRow === null) {
			SetSelectedLabel(null)
		} else {
			SetSelectedLabel(props.getRowLabel(SelectedRow))
		}

		SetLastCheckedId(SelectedId)

		if (props.onRowSelected) props.onRowSelected(SelectedId)
	}, [props, SelectedId, SelectedRow])

	const OnCancel = useCallback(() => {
		SetIsOpen(false)

		SetSelectedLabel(null)
		SetSelectedId(null)
		SetSelectedRow(null)
	}, [])

	useEffect(() => {
		if (isPending) return
		if (IsOpen) return
		if (LastCheckedId === props.selectedRowId) return
		if (SelectedId === props.selectedRowId) return

		startTransition(async () => {
			if (props.selectedRowId === null || props.selectedRowId === undefined) {
				SetSelectedLabel(null)
				SetSelectedId(null)
				SetSelectedRow(null)
				SetLastCheckedId(null) // Ensure LastCheckedId updates to prevent infinite loops
				return
			}

			const row = await props.getRowById(props.selectedRowId)

			SetLastCheckedId(props.selectedRowId)

			if (row === undefined) {
				SetSelectedLabel(null)
				SetSelectedId(null)
				SetSelectedRow(null)
				return
			}

			SetSelectedId(props.selectedRowId)
			SetSelectedRow(row)
			SetSelectedLabel(props.getRowLabel(row))
		})
	}, [SelectedId, SelectedRow, isPending, IsOpen, LastCheckedId, props])

	useImperativeHandle(
		props.ref,
		() => ({
			selectedLabel: SelectedLabel,
		}),
		[SelectedLabel],
	)

	return (
		<>
			<SelectButton
				variant='outlined'
				onClick={() => {
					if (!props.disabled) SetIsOpen(true)
				}}
				loading={isPending}
				{...props.slotProps?.button}
			>
				{props.shrinkedText !== null ? (
					<Typography
						sx={theme => ({
							position: 'absolute',
							top: 0,
							left: 6,
							transform: 'translateY(-40%) scale(0.75)',
							transformOrigin: 'top left',
							color: theme.palette.text.primary,
							backgroundColor: theme.palette.background.paper,
							padding: 1,
						})}
					>
						{props.shrinkedText}
					</Typography>
				) : null}
				<Typography sx={{ width: '100%', textAlign: 'left' }}>
					{props.getButtonLabel(SelectedLabel)}
				</Typography>
			</SelectButton>
			<Dialog
				onClose={() => SetIsOpen(false)}
				aria-labelledby='select-dialog-title'
				open={IsOpen}
				fullWidth
				maxWidth='md'
				slotProps={{
					paper: {
						sx: {
							height: '100%',
						},
					},
				}}
			>
				<DialogTitle sx={{ m: 0, p: 2 }} id='select-dialog-title'>
					{props.title}
				</DialogTitle>
				<IconButton
					onClick={() => SetIsOpen(false)}
					sx={theme => ({
						position: 'absolute',
						right: 8,
						top: 8,
						color: theme.palette.grey[500],
					})}
				>
					<CloseIcon />
				</IconButton>
				<DialogContent dividers>
					<Box
						sx={{
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
						}}
					>
						<Box
							sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
						>
							<Button onClick={OnRefreshData}>{t('common.refreshData')}</Button>
							<Box sx={{ display: 'flex', gap: 1, flexDirection: 'row' }}>
								<Button
									onClick={ToggleFilterMenu}
									sx={{
										display: props.filterSlot === undefined ? 'none' : 'block',
									}}
								>
									{IsFilterMenuOpen
										? t('common.hideFilter')
										: t('common.showFilter')}
								</Button>
								<Button onClick={OnResetFilter}>{t('common.resetFilter')}</Button>
							</Box>
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
						<SelectDataGrid
							apiRef={GridApiRef}
							dataSource={props.dataSource}
							columns={props.columns}
							sortFieldEnum={props.sortFieldEnum}
							selectedRowId={SelectedId}
							onRowSelected={OnRowSelected}
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={OnCancel}>{t('common.cancel')}</Button>
					<Button onClick={OnSave}>{t('common.save')}</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default SelectTemplate
