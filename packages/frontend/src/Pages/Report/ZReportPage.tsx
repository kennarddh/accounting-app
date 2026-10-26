import { FC, useCallback, useEffect, useState, useTransition } from 'react'

import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import PriceCheckIcon from '@mui/icons-material/PriceCheck'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import RefreshIcon from '@mui/icons-material/Refresh'
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket'

import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
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

import ZReportApi, { ZReportOutput } from 'Api/Report/ZReportApi'
import ZReportExportApi from 'Api/Report/ZReportExportApi'
import UserFindManyApi, { UserFindManySingleOutput } from 'Api/User/UserFindManyApi'

const ZReportPage: FC = () => {
	const { t } = useTranslation()

	const [date, setDate] = useState<Dayjs>(() => dayjs())
	const [cashierId, setCashierId] = useState<string>('')
	const [cashiers, setCashiers] = useState<UserFindManySingleOutput[]>([])

	const [report, setReport] = useState<ZReportOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
	const [isExporting, setIsExporting] = useState(false)

	// 1. Load Cashiers List
	useEffect(() => {
		const loadCashiers = async () => {
			try {
				const users = await UserFindManyApi({ pagination: { limit: 100 } })
				setCashiers(users.list)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		}
		void loadCashiers()
	}, [])

	// 2. Fetch Z-Report
	const fetchReport = useCallback(() => {
		setErrorText(null)
		startTransition(async () => {
			try {
				const result = await ZReportApi({
					date: date.startOf('day').valueOf(),
					cashierId: cashierId !== '' ? cashierId : undefined,
				})
				setReport(result)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		})
	}, [date, cashierId])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchReport()
	}, [fetchReport])

	const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
		setExportAnchorEl(null)
		setIsExporting(true)
		setErrorText(null)

		try {
			const blob = await ZReportExportApi({
				date: date.startOf('day').valueOf(),
				cashierId: cashierId !== '' ? cashierId : undefined,
				format,
			})

			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `z_report_${date.format('YYYY-MM-DD')}.${format}`

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
		<PageContainer title={t('reports.zReport.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
				{/* Top Controls Toolbar */}
				<Paper
					variant='outlined'
					sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
				>
					<DatePicker
						label={t('reports.zReport.date')}
						value={date}
						onChange={val => val && setDate(val)}
						slotProps={{ textField: { size: 'small' } }}
					/>

					<FormControl size='small' sx={{ minWidth: 200 }}>
						<InputLabel id='zreport-cashier-label'>
							{t('reports.zReport.cashier')}
						</InputLabel>
						<Select
							labelId='zreport-cashier-label'
							label={t('reports.zReport.cashier')}
							value={cashierId}
							onChange={e => setCashierId(e.target.value)}
						>
							<MenuItem value=''>
								<em>{t('reports.zReport.allCashiers')}</em>
							</MenuItem>
							{cashiers.map(u => (
								<MenuItem key={u.id} value={u.id}>
									{u.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<Button
						variant='contained'
						startIcon={<RefreshIcon />}
						onClick={fetchReport}
						loading={isPending}
					>
						{t('reports.zReport.runReport')}
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
							{/* Card 1: Gross Sales */}
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
												{t('reports.zReport.summary.grossSales')}
											</Typography>
											<PointOfSaleIcon color='primary' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{FormatCurrency(report.grossSales)}
										</Typography>
										<Typography variant='caption' color='textSecondary'>
											Margin: {report.grossMarginPercent}%
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 2: Cash Collected in Till */}
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
												{t('reports.zReport.summary.cashCollected')}
											</Typography>
											<PriceCheckIcon color='success' />
										</Box>
										<Typography
											variant='h5'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
												color: 'success.dark',
											}}
										>
											{FormatCurrency(report.cashCollected)}
										</Typography>
										<Typography variant='caption' color='textSecondary'>
											Physical cash in register
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 3: Total Orders Processed */}
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
												{t('reports.zReport.summary.totalOrders')}
											</Typography>
											<ReceiptLongIcon color='info' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{report.totalOrders}
										</Typography>
										<Typography variant='caption' color='textSecondary'>
											Avg: {FormatCurrency(report.averageTicket)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 4: Items Sold */}
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
												{t('reports.zReport.summary.itemsSold')}
											</Typography>
											<ShoppingBasketIcon color='warning' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{report.totalItemsSold}
										</Typography>
										<Typography variant='caption' color='textSecondary'>
											Units passed register
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>

						{/* Breakdown Tables */}
						<Grid container spacing={3}>
							{/* 1. Payment Methods Reconciliation (Drawer Balancing) */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Paper variant='outlined' sx={{ p: 2 }}>
									<Typography
										variant='h6'
										sx={{ fontSize: '1.05rem', fontWeight: 600, mb: 1.5 }}
									>
										{t('reports.zReport.payments.title')}
									</Typography>
									<TableContainer>
										<Table size='small'>
											<TableHead sx={{ backgroundColor: '#f8fafc' }}>
												<TableRow>
													<TableCell sx={{ fontWeight: 600 }}>
														{t('reports.zReport.payments.method')}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontWeight: 600 }}
													>
														{t('reports.zReport.payments.orders')}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontWeight: 600 }}
													>
														{t('reports.zReport.payments.amount')}
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{report.payments.map(p => (
													<TableRow key={p.paymentMethod} hover>
														<TableCell sx={{ fontWeight: 500 }}>
															{p.paymentMethod}
														</TableCell>
														<TableCell
															align='right'
															sx={{ fontFamily: 'monospace' }}
														>
															{p.orderCount}
														</TableCell>
														<TableCell
															align='right'
															sx={{ fontFamily: 'monospace' }}
														>
															{FormatCurrency(p.totalAmount)}
														</TableCell>
													</TableRow>
												))}
												<TableRow
													sx={{
														backgroundColor: '#f1f5f9',
														fontWeight: 'bold',
													}}
												>
													<TableCell sx={{ fontWeight: 'bold' }}>
														Total Payments
													</TableCell>
													<TableCell
														align='right'
														sx={{
															fontFamily: 'monospace',
															fontWeight: 'bold',
														}}
													>
														{report.totalOrders}
													</TableCell>
													<TableCell
														align='right'
														sx={{
															fontFamily: 'monospace',
															fontWeight: 'bold',
														}}
													>
														{FormatCurrency(report.grossSales)}
													</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</TableContainer>
								</Paper>
							</Grid>

							{/* 2. Category Performance */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Paper variant='outlined' sx={{ p: 2 }}>
									<Typography
										variant='h6'
										sx={{ fontSize: '1.05rem', fontWeight: 600, mb: 1.5 }}
									>
										{t('reports.zReport.categories.title')}
									</Typography>
									<TableContainer>
										<Table size='small'>
											<TableHead sx={{ backgroundColor: '#f8fafc' }}>
												<TableRow>
													<TableCell sx={{ fontWeight: 600 }}>
														{t('reports.zReport.categories.category')}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontWeight: 600 }}
													>
														{t('reports.zReport.categories.quantity')}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontWeight: 600 }}
													>
														{t('reports.zReport.categories.revenue')}
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{report.categories.map(c => (
													<TableRow key={c.categoryName} hover>
														<TableCell sx={{ fontWeight: 500 }}>
															{c.categoryName}
														</TableCell>
														<TableCell
															align='right'
															sx={{ fontFamily: 'monospace' }}
														>
															{c.quantity}
														</TableCell>
														<TableCell
															align='right'
															sx={{ fontFamily: 'monospace' }}
														>
															{FormatCurrency(c.totalAmount)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								</Paper>
							</Grid>

							{/* 3. Top 10 Selling Products Table */}
							<Grid size={{ xs: 12 }}>
								<Paper variant='outlined' sx={{ p: 2 }}>
									<Typography
										variant='h6'
										sx={{ fontSize: '1.05rem', fontWeight: 600, mb: 1.5 }}
									>
										{t('reports.zReport.topProducts.title')}
									</Typography>
									<TableContainer>
										<Table size='small'>
											<TableHead sx={{ backgroundColor: '#f8fafc' }}>
												<TableRow>
													<TableCell width='15%' sx={{ fontWeight: 600 }}>
														{t('reports.zReport.topProducts.sku')}
													</TableCell>
													<TableCell width='45%' sx={{ fontWeight: 600 }}>
														{t('reports.zReport.topProducts.name')}
													</TableCell>
													<TableCell
														width='20%'
														align='right'
														sx={{ fontWeight: 600 }}
													>
														{t('reports.zReport.topProducts.quantity')}
													</TableCell>
													<TableCell
														width='20%'
														align='right'
														sx={{ fontWeight: 600 }}
													>
														{t('reports.zReport.topProducts.revenue')}
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{report.topProducts.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={4}
															align='center'
															sx={{ py: 2, color: 'text.secondary' }}
														>
															{t('reports.zReport.empty')}
														</TableCell>
													</TableRow>
												) : (
													report.topProducts.map(p => (
														<TableRow key={p.productId} hover>
															<TableCell
																sx={{
																	fontFamily: 'monospace',
																	fontWeight: 500,
																}}
															>
																{p.sku}
															</TableCell>
															<TableCell>{p.name}</TableCell>
															<TableCell
																align='right'
																sx={{ fontFamily: 'monospace' }}
															>
																{p.quantity}
															</TableCell>
															<TableCell
																align='right'
																sx={{
																	fontFamily: 'monospace',
																	fontWeight: 600,
																}}
															>
																{FormatCurrency(p.totalAmount)}
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</TableContainer>
								</Paper>
							</Grid>
						</Grid>
					</>
				) : null}
			</Box>
		</PageContainer>
	)
}

export default ZReportPage

export { ZReportPage as Component }
