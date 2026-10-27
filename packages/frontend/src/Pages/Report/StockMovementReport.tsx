import { FC, useCallback, useEffect, useState, useTransition } from 'react'

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import HistoryIcon from '@mui/icons-material/History'
import RefreshIcon from '@mui/icons-material/Refresh'

import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	FormControl,
	Grid,
	InputLabel,
	Menu,
	MenuItem,
	Paper,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import dayjs, { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import FormatCurrency from 'Utils/FormatCurrency'
import HandleApiError from 'Utils/HandleApiError'

import ProductFindLookupApi, { ProductLookupOutput } from 'Api/Product/ProductFindLookupApi'
import StockMovementReportApi, {
	StockMovementReportOutput,
} from 'Api/Report/StockMovementReportApi'
import StockMovementReportExportApi from 'Api/Report/StockMovementReportExportApi'

const StockMovementReport: FC = () => {
	const { t } = useTranslation()

	const [fromDate, setFromDate] = useState<Dayjs>(() => dayjs().startOf('month'))
	const [toDate, setToDate] = useState<Dayjs>(() => dayjs().endOf('day'))
	const [productId, setProductId] = useState<string>('')
	const [movementType, setMovementType] = useState<string>('')
	const [products, setProducts] = useState<ProductLookupOutput[]>([])

	const [report, setReport] = useState<StockMovementReportOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
	const [isExporting, setIsExporting] = useState(false)

	// 1. Load active products for dropdown
	useEffect(() => {
		const load = async () => {
			try {
				const list = await ProductFindLookupApi()
				setProducts(list)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		}
		void load()
	}, [])

	// 2. Fetch Report
	const fetchReport = useCallback(() => {
		setErrorText(null)
		startTransition(async () => {
			try {
				const result = await StockMovementReportApi({
					fromDate: fromDate.startOf('day').valueOf(),
					toDate: toDate.endOf('day').valueOf(),
					productId: productId !== '' ? productId : undefined,
					type: movementType !== '' ? movementType : undefined,
				})
				setReport(result)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		})
	}, [fromDate, toDate, productId, movementType])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchReport()
	}, [fetchReport])

	const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
		setExportAnchorEl(null)
		setIsExporting(true)
		setErrorText(null)

		try {
			const blob = await StockMovementReportExportApi({
				fromDate: fromDate.startOf('day').valueOf(),
				toDate: toDate.endOf('day').valueOf(),
				productId: productId !== '' ? productId : undefined,
				type: movementType !== '' ? movementType : undefined,
				format,
			})

			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `stock_movements_${dayjs().format('YYYY-MM-DD')}.${format}`

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

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'Restock':
				return 'success'
			case 'Return':
				return 'info'
			case 'Sale':
				return 'default'
			case 'Waste':
				return 'error'
			case 'Correction':
				return 'warning'
			default:
				return 'default'
		}
	}

	return (
		<PageContainer title={t('reports.stockMovement.title')}>
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

					<FormControl size='small' sx={{ minWidth: 240 }}>
						<InputLabel id='stock-product-label'>
							{t('reports.stockMovement.productFilter')}
						</InputLabel>
						<Select
							labelId='stock-product-label'
							label={t('reports.stockMovement.productFilter')}
							value={productId}
							onChange={e => setProductId(e.target.value)}
						>
							<MenuItem value=''>
								<em>{t('reports.stockMovement.allProducts')}</em>
							</MenuItem>
							{products.map(p => (
								<MenuItem key={p.id} value={p.id}>
									{p.sku} - {p.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl size='small' sx={{ minWidth: 160 }}>
						<InputLabel id='stock-type-label'>
							{t('reports.stockMovement.movementType')}
						</InputLabel>
						<Select
							labelId='stock-type-label'
							label={t('reports.stockMovement.movementType')}
							value={movementType}
							onChange={e => setMovementType(e.target.value)}
						>
							<MenuItem value=''>
								<em>{t('reports.stockMovement.allTypes')}</em>
							</MenuItem>
							<MenuItem value='Sale'>
								{t('reports.stockMovement.types.Sale')}
							</MenuItem>
							<MenuItem value='Restock'>
								{t('reports.stockMovement.types.Restock')}
							</MenuItem>
							<MenuItem value='Waste'>
								{t('reports.stockMovement.types.Waste')}
							</MenuItem>
							<MenuItem value='Correction'>
								{t('reports.stockMovement.types.Correction')}
							</MenuItem>
							<MenuItem value='Return'>
								{t('reports.stockMovement.types.Return')}
							</MenuItem>
						</Select>
					</FormControl>

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
						{/* Summary Metric Cards */}
						<Grid container spacing={2}>
							{/* Card 1: Total Inflow */}
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Card variant='outlined' sx={{ bgcolor: '#f0fdf4' }}>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												mb: 1,
											}}
										>
											<Typography variant='body2' color='textSecondary'>
												{t('reports.stockMovement.summary.totalIn')}
											</Typography>
											<ArrowUpwardIcon color='success' />
										</Box>
										<Typography
											variant='h5'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
												color: 'success.dark',
											}}
										>
											+{parseFloat(report.totalIn).toLocaleString('id-ID')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 2: Total Outflow */}
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
												{t('reports.stockMovement.summary.totalOut')}
											</Typography>
											<ArrowDownwardIcon color='error' />
										</Box>
										<Typography
											variant='h5'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
												color: 'error.main',
											}}
										>
											-{parseFloat(report.totalOut).toLocaleString('id-ID')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 3: Net Stock Change */}
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
												{t('reports.stockMovement.summary.netDelta')}
											</Typography>
											<CompareArrowsIcon color='primary' />
										</Box>
										<Typography
											variant='h5'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
												color:
													parseFloat(report.netDelta) >= 0
														? 'success.main'
														: 'error.main',
											}}
										>
											{parseFloat(report.netDelta) > 0
												? `+${report.netDelta}`
												: report.netDelta}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 4: Single Product Balance OR Movement Records */}
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
												{report.filteredProduct
													? t(
															'reports.stockMovement.summary.closingStock',
														)
													: t(
															'reports.stockMovement.summary.totalRecords',
														)}
											</Typography>
											<HistoryIcon color='info' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{report.filteredProduct && report.closingStock !== null
												? parseFloat(report.closingStock).toLocaleString(
														'id-ID',
													)
												: report.movements.length}
										</Typography>
										{report.filteredProduct && report.openingStock !== null && (
											<Typography variant='caption' color='textSecondary'>
												Opening:{' '}
												{parseFloat(report.openingStock).toLocaleString(
													'id-ID',
												)}
											</Typography>
										)}
									</CardContent>
								</Card>
							</Grid>
						</Grid>

						{/* Stock Movement Audit Log Table */}
						<TableContainer component={Paper} variant='outlined'>
							<Table size='small'>
								<TableHead sx={{ backgroundColor: '#f8fafc' }}>
									<TableRow>
										<TableCell width='12%' sx={{ fontWeight: 600 }}>
											{t('reports.stockMovement.table.date')}
										</TableCell>
										<TableCell width='15%' sx={{ fontWeight: 600 }}>
											{t('reports.stockMovement.table.refNumber')}
										</TableCell>
										<TableCell width='10%' sx={{ fontWeight: 600 }}>
											{t('reports.stockMovement.table.type')}
										</TableCell>
										<TableCell width='23%' sx={{ fontWeight: 600 }}>
											{t('reports.stockMovement.table.product')}
										</TableCell>
										<TableCell
											width='10%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.stockMovement.table.quantity')}
										</TableCell>
										<TableCell
											width='10%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.stockMovement.table.unitCost')}
										</TableCell>
										<TableCell
											width='10%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.stockMovement.table.totalCost')}
										</TableCell>
										{report.filteredProduct && (
											<TableCell
												width='10%'
												align='right'
												sx={{ fontWeight: 600 }}
											>
												{t('reports.stockMovement.table.runningStock')}
											</TableCell>
										)}
									</TableRow>
								</TableHead>
								<TableBody>
									{/* Opening Stock Line (if single product is selected) */}
									{report.filteredProduct && report.openingStock !== null && (
										<TableRow sx={{ backgroundColor: '#f1f5f9' }}>
											<TableCell
												colSpan={4}
												sx={{ fontStyle: 'italic', fontWeight: 600 }}
											>
												{t('reports.stockMovement.summary.openingStock')}
											</TableCell>
											<TableCell align='right' />
											<TableCell align='right' />
											<TableCell align='right' />
											<TableCell
												align='right'
												sx={{ fontFamily: 'monospace', fontWeight: 700 }}
											>
												{parseFloat(report.openingStock).toLocaleString(
													'id-ID',
												)}
											</TableCell>
										</TableRow>
									)}

									{report.movements.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={report.filteredProduct ? 8 : 7}
												align='center'
												sx={{ py: 3, color: 'text.secondary' }}
											>
												{t('reports.stockMovement.empty')}
											</TableCell>
										</TableRow>
									) : (
										report.movements.map(m => {
											const isPos = parseFloat(m.quantity) > 0

											return (
												<TableRow key={m.movementId} hover>
													<TableCell>
														{dayjs(m.date).format('DD/MM/YYYY HH:mm')}
													</TableCell>
													<TableCell
														sx={{
															fontFamily: 'monospace',
															fontWeight: 500,
														}}
													>
														{m.referenceNumber}
													</TableCell>
													<TableCell>
														<Chip
															label={t(
																`reports.stockMovement.types.${m.type}`,
															)}
															size='small'
															color={getTypeColor(m.type)}
															variant='outlined'
														/>
													</TableCell>
													<TableCell>
														<strong>{m.sku}</strong> - {m.productName}
													</TableCell>
													<TableCell
														align='right'
														sx={{
															fontFamily: 'monospace',
															fontWeight: 600,
															color: isPos
																? 'success.main'
																: 'error.main',
														}}
													>
														{isPos ? `+${m.quantity}` : m.quantity}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{FormatCurrency(m.costPerUnit)}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{FormatCurrency(m.totalCost)}
													</TableCell>
													{report.filteredProduct && (
														<TableCell
															align='right'
															sx={{
																fontFamily: 'monospace',
																fontWeight: 600,
															}}
														>
															{m.runningStock}
														</TableCell>
													)}
												</TableRow>
											)
										})
									)}
								</TableBody>
							</Table>
						</TableContainer>
					</>
				) : null}
			</Box>
		</PageContainer>
	)
}

export default StockMovementReport

export { StockMovementReport as Component }
