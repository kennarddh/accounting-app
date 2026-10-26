import { FC, useCallback, useEffect, useState, useTransition } from 'react'

import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import InventoryIcon from '@mui/icons-material/Inventory'
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarehouseIcon from '@mui/icons-material/Warehouse'

import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Grid,
	Menu,
	MenuItem,
	Paper,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import dayjs, { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import FormatCurrency from 'Utils/FormatCurrency'
import HandleApiError from 'Utils/HandleApiError'

import InventoryValuationApi, { InventoryValuationOutput } from 'Api/Report/InventoryValuationApi'
import InventoryValuationExportApi from 'Api/Report/InventoryValuationExportApi'

const InventoryValuationReport: FC = () => {
	const { t } = useTranslation()

	const [fromDate, setFromDate] = useState<Dayjs>(() => dayjs().startOf('month'))
	const [toDate, setToDate] = useState<Dayjs>(() => dayjs().endOf('day'))
	const [activeTab, setActiveTab] = useState<number>(0)

	const [report, setReport] = useState<InventoryValuationOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
	const [isExporting, setIsExporting] = useState(false)

	const fetchReport = useCallback(() => {
		setErrorText(null)
		startTransition(async () => {
			try {
				const result = await InventoryValuationApi({
					fromDate: fromDate.startOf('day').valueOf(),
					toDate: toDate.endOf('day').valueOf(),
				})
				setReport(result)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		})
	}, [fromDate, toDate])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchReport()
	}, [fetchReport])

	const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
		setExportAnchorEl(null)
		setIsExporting(true)
		setErrorText(null)

		const view = activeTab === 0 ? 'valuation' : 'shrinkage'

		try {
			const blob = await InventoryValuationExportApi({
				fromDate: fromDate.startOf('day').valueOf(),
				toDate: toDate.endOf('day').valueOf(),
				view,
				format,
			})

			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `${view}_report_${dayjs().format('YYYY-MM-DD')}.${format}`

			document.body.appendChild(link)
			link.click()

			document.body.removeChild(link)
			window.URL.revokeObjectURL(url)
		} catch (err) {
			setErrorText(HandleApiError(err))
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<PageContainer title={t('reports.inventoryValuation.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
				{/* Top Controls Toolbar */}
				<Paper
					variant='outlined'
					sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
				>
					<DatePicker
						label='From Date'
						value={fromDate}
						onChange={val => val && setFromDate(val)}
						slotProps={{ textField: { size: 'small' } }}
					/>
					<DatePicker
						label='To Date'
						value={toDate}
						onChange={val => val && setToDate(val)}
						slotProps={{ textField: { size: 'small' } }}
					/>

					<Button
						variant='contained'
						startIcon={<RefreshIcon />}
						onClick={fetchReport}
						loading={isPending}
					>
						{t('common.refresh')}
					</Button>

					<Button
						variant='outlined'
						startIcon={<FileDownloadIcon />}
						sx={{ ml: 'auto' }}
						onClick={e => setExportAnchorEl(e.currentTarget)}
						loading={isExporting}
					>
						{t('reports.exportAs')}
					</Button>

					<Menu
						anchorEl={exportAnchorEl}
						open={Boolean(exportAnchorEl)}
						onClose={() => setExportAnchorEl(null)}
					>
						<MenuItem onClick={() => handleExport('xlsx')}>
							{t('reports.exportExcel')}
						</MenuItem>
						<MenuItem onClick={() => handleExport('pdf')}>
							{t('reports.exportPdf')}
						</MenuItem>
						<MenuItem onClick={() => handleExport('csv')}>
							{t('reports.exportCsv')}
						</MenuItem>
					</Menu>
				</Paper>

				{errorText && <Alert severity='error'>{errorText}</Alert>}

				{isPending && !report ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
						<CircularProgress />
					</Box>
				) : report ? (
					<>
						{/* Top KPI Cards (Using Modern Grid size syntax) */}
						<Grid container spacing={2}>
							{/* Card 1: Total Valuation */}
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card variant='outlined'>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												mb: 1,
											}}
										>
											<Typography variant='body2' color='textSecondary'>
												{t(
													'reports.inventoryValuation.summary.totalValuation',
												)}
											</Typography>
											<WarehouseIcon color='primary' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{FormatCurrency(report.summary.totalValuation)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 2: Units On Hand */}
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card variant='outlined'>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												mb: 1,
											}}
										>
											<Typography variant='body2' color='textSecondary'>
												{t('reports.inventoryValuation.summary.totalUnits')}
											</Typography>
											<InventoryIcon color='info' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{parseFloat(
												report.summary.totalUnitsOnHand,
											).toLocaleString('id-ID')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 3: Waste & Spoilage */}
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card variant='outlined' sx={{ bgcolor: '#fff7ed' }}>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												mb: 1,
											}}
										>
											<Typography variant='body2' color='textSecondary'>
												{t('reports.inventoryValuation.summary.wasteCost')}
											</Typography>
											<DeleteSweepIcon color='warning' />
										</Box>
										<Typography
											variant='h5'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
												color: 'warning.dark',
											}}
										>
											{FormatCurrency(report.summary.totalWasteCost)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 4: Shrinkage Loss */}
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card variant='outlined' sx={{ bgcolor: '#fef2f2' }}>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												mb: 1,
											}}
										>
											<Typography variant='body2' color='textSecondary'>
												{t(
													'reports.inventoryValuation.summary.shrinkageCost',
												)}
											</Typography>
											<ProductionQuantityLimitsIcon color='error' />
										</Box>
										<Typography
											variant='h5'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
												color: 'error.main',
											}}
										>
											{FormatCurrency(report.summary.totalShrinkageCost)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>

						{/* View Switcher Tabs */}
						<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
							<Tabs
								value={activeTab}
								onChange={(_, val) => setActiveTab(val as number)}
							>
								<Tab label={t('reports.inventoryValuation.valuationTable.title')} />
								<Tab
									label={`${t('reports.inventoryValuation.shrinkageTable.title')} (${report.discrepancies.length})`}
								/>
							</Tabs>
						</Box>

						{/* TAB 1: On-Hand Inventory Valuation Table */}
						{activeTab === 0 && (
							<TableContainer component={Paper} variant='outlined'>
								<Table size='small'>
									<TableHead sx={{ backgroundColor: '#f8fafc' }}>
										<TableRow>
											<TableCell width='15%' sx={{ fontWeight: 600 }}>
												{t('reports.inventoryValuation.valuationTable.sku')}
											</TableCell>
											<TableCell width='35%' sx={{ fontWeight: 600 }}>
												{t(
													'reports.inventoryValuation.valuationTable.product',
												)}
											</TableCell>
											<TableCell width='18%' sx={{ fontWeight: 600 }}>
												{t(
													'reports.inventoryValuation.valuationTable.category',
												)}
											</TableCell>
											<TableCell
												width='10%'
												align='right'
												sx={{ fontWeight: 600 }}
											>
												{t(
													'reports.inventoryValuation.valuationTable.stock',
												)}
											</TableCell>
											<TableCell
												width='11%'
												align='right'
												sx={{ fontWeight: 600 }}
											>
												{t(
													'reports.inventoryValuation.valuationTable.unitCost',
												)}
											</TableCell>
											<TableCell
												width='11%'
												align='right'
												sx={{ fontWeight: 600 }}
											>
												{t(
													'reports.inventoryValuation.valuationTable.totalValue',
												)}
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{report.valuationItems.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													align='center'
													sx={{ py: 3, color: 'text.secondary' }}
												>
													{t('reports.inventoryValuation.emptyValuation')}
												</TableCell>
											</TableRow>
										) : (
											report.valuationItems.map(v => (
												<TableRow key={v.productId} hover>
													<TableCell
														sx={{
															fontFamily: 'monospace',
															fontWeight: 500,
														}}
													>
														{v.sku}
													</TableCell>
													<TableCell>{v.name}</TableCell>
													<TableCell>{v.categoryName}</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{parseFloat(v.currentStock).toLocaleString(
															'id-ID',
														)}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{FormatCurrency(v.costPrice)}
													</TableCell>
													<TableCell
														align='right'
														sx={{
															fontFamily: 'monospace',
															fontWeight: 600,
														}}
													>
														{FormatCurrency(v.totalValue)}
													</TableCell>
												</TableRow>
											))
										)}
										<TableRow
											sx={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}
										>
											<TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
												TOTAL ON-HAND ASSET VALUE
											</TableCell>
											<TableCell
												align='right'
												sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
											>
												{parseFloat(
													report.summary.totalUnitsOnHand,
												).toLocaleString('id-ID')}
											</TableCell>
											<TableCell align='right' />
											<TableCell
												align='right'
												sx={{
													fontFamily: 'monospace',
													fontWeight: 'bold',
													borderBottom: '3px double #000',
												}}
											>
												{FormatCurrency(report.summary.totalValuation)}
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</TableContainer>
						)}

						{/* TAB 2: Shrinkage & Waste Discrepancy Log Table */}
						{activeTab === 1 && (
							<TableContainer component={Paper} variant='outlined'>
								<Table size='small'>
									<TableHead sx={{ backgroundColor: '#f8fafc' }}>
										<TableRow>
											<TableCell width='12%' sx={{ fontWeight: 600 }}>
												{t(
													'reports.inventoryValuation.shrinkageTable.date',
												)}
											</TableCell>
											<TableCell width='14%' sx={{ fontWeight: 600 }}>
												{t(
													'reports.inventoryValuation.shrinkageTable.adjustmentNumber',
												)}
											</TableCell>
											<TableCell width='10%' sx={{ fontWeight: 600 }}>
												{t(
													'reports.inventoryValuation.shrinkageTable.type',
												)}
											</TableCell>
											<TableCell width='22%' sx={{ fontWeight: 600 }}>
												{t(
													'reports.inventoryValuation.shrinkageTable.product',
												)}
											</TableCell>
											<TableCell
												width='10%'
												align='right'
												sx={{ fontWeight: 600 }}
											>
												{t(
													'reports.inventoryValuation.shrinkageTable.quantity',
												)}
											</TableCell>
											<TableCell
												width='12%'
												align='right'
												sx={{ fontWeight: 600 }}
											>
												{t(
													'reports.inventoryValuation.shrinkageTable.subtotal',
												)}
											</TableCell>
											<TableCell width='20%' sx={{ fontWeight: 600 }}>
												{t(
													'reports.inventoryValuation.shrinkageTable.reason',
												)}
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{report.discrepancies.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={7}
													align='center'
													sx={{ py: 3, color: 'text.secondary' }}
												>
													{t('reports.inventoryValuation.emptyShrinkage')}
												</TableCell>
											</TableRow>
										) : (
											report.discrepancies.map((d, idx) => (
												<TableRow key={idx} hover>
													<TableCell>
														{dayjs(d.date).format('DD/MM/YYYY')}
													</TableCell>
													<TableCell sx={{ fontFamily: 'monospace' }}>
														{d.adjustmentNumber}
													</TableCell>
													<TableCell>
														<Chip
															label={d.type}
															size='small'
															color={
																d.type === 'Waste'
																	? 'error'
																	: 'warning'
															}
															variant='outlined'
														/>
													</TableCell>
													<TableCell>
														<strong>{d.sku}</strong> - {d.productName}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{parseFloat(
															d.quantityAdjusted,
														).toLocaleString('id-ID')}
													</TableCell>
													<TableCell
														align='right'
														sx={{
															fontFamily: 'monospace',
															fontWeight: 600,
														}}
													>
														{FormatCurrency(d.subtotalCost)}
													</TableCell>
													<TableCell>{d.reason}</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					</>
				) : null}
			</Box>
		</PageContainer>
	)
}

export default InventoryValuationReport

export { InventoryValuationReport as Component }
