import { FC, useCallback, useEffect, useState, useTransition } from 'react'

import FileDownloadIcon from '@mui/icons-material/FileDownload'
import LayersIcon from '@mui/icons-material/Layers'
import PaymentsIcon from '@mui/icons-material/Payments'
import RefreshIcon from '@mui/icons-material/Refresh'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

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

import CategoryFindManyApi, { CategoryFindManySingleOutput } from 'Api/Category/CategoryFindManyApi'
import SalesByProductApi, { SalesByProductOutput } from 'Api/Report/SalesByProductApi'
import SalesByProductExportApi from 'Api/Report/SalesByProductExportApi'

const SalesByProductReport: FC = () => {
	const { t } = useTranslation()

	const [fromDate, setFromDate] = useState<Dayjs>(() => dayjs().startOf('month'))
	const [toDate, setToDate] = useState<Dayjs>(() => dayjs().endOf('day'))
	const [categoryId, setCategoryId] = useState<string>('')
	const [categoriesList, setCategoriesList] = useState<CategoryFindManySingleOutput[]>([])

	const [report, setReport] = useState<SalesByProductOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
	const [isExporting, setIsExporting] = useState(false)

	// 1. Fetch Categories for Dropdown Filter
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const cats = await CategoryFindManyApi({ pagination: { limit: 100 } })
				setCategoriesList(cats.list)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		}
		void loadCategories()
	}, [])

	// 2. Fetch Report
	const fetchReport = useCallback(() => {
		setErrorText(null)
		startTransition(async () => {
			try {
				const result = await SalesByProductApi({
					fromDate: fromDate.startOf('day').valueOf(),
					toDate: toDate.endOf('day').valueOf(),
					categoryId: categoryId !== '' ? categoryId : undefined,
				})
				setReport(result)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		})
	}, [fromDate, toDate, categoryId])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchReport()
	}, [fetchReport])

	const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
		setExportAnchorEl(null)
		setIsExporting(true)
		setErrorText(null)

		try {
			const blob = await SalesByProductExportApi({
				fromDate: fromDate.startOf('day').valueOf(),
				toDate: toDate.endOf('day').valueOf(),
				categoryId: categoryId !== '' ? categoryId : undefined,
				format,
			})

			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `sales_by_product_${dayjs().format('YYYY-MM-DD')}.${format}`

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
		<PageContainer title={t('reports.salesByProduct.title')}>
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

					<FormControl size='small' sx={{ minWidth: 200 }}>
						<InputLabel id='cat-filter-label'>
							{t('reports.salesByProduct.categoryFilter')}
						</InputLabel>
						<Select
							labelId='cat-filter-label'
							label={t('reports.salesByProduct.categoryFilter')}
							value={categoryId}
							onChange={e => setCategoryId(e.target.value)}
						>
							<MenuItem value=''>
								<em>{t('reports.salesByProduct.allCategories')}</em>
							</MenuItem>
							{categoriesList.map(c => (
								<MenuItem key={c.id} value={c.id}>
									{c.name}
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
						{/* KPI Summary Cards */}
						<Grid container spacing={2}>
							{/* Card 1: Total Revenue */}
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
												{t('reports.salesByProduct.summary.totalRevenue')}
											</Typography>
											<PaymentsIcon color='primary' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{FormatCurrency(report.summary.totalRevenue)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 2: Gross Profit */}
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
												{t('reports.salesByProduct.summary.totalProfit')}
											</Typography>
											<TrendingUpIcon color='success' />
										</Box>
										<Typography
											variant='h5'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
												color: 'success.main',
											}}
										>
											{FormatCurrency(report.summary.totalProfit)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 3: Units Sold */}
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
												{t('reports.salesByProduct.summary.unitsSold')}
											</Typography>
											<ShoppingCartIcon color='info' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{parseFloat(
												report.summary.totalQuantity,
											).toLocaleString('id-ID')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							{/* Card 4: Overall Margin % */}
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
												{t('reports.salesByProduct.summary.avgMargin')}
											</Typography>
											<LayersIcon color='warning' />
										</Box>
										<Typography
											variant='h5'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{report.summary.overallMarginPercent}%
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>

						{/* 1. Category Summary Table */}
						<Paper variant='outlined' sx={{ p: 2 }}>
							<Typography
								variant='h6'
								sx={{ fontSize: '1.05rem', fontWeight: 600, mb: 1.5 }}
							>
								{t('reports.salesByProduct.categoriesTable.title')}
							</Typography>
							<TableContainer>
								<Table size='small'>
									<TableHead sx={{ backgroundColor: '#f8fafc' }}>
										<TableRow>
											<TableCell sx={{ fontWeight: 600 }}>
												{t(
													'reports.salesByProduct.categoriesTable.category',
												)}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t(
													'reports.salesByProduct.categoriesTable.uniqueProducts',
												)}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.categoriesTable.units')}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t(
													'reports.salesByProduct.categoriesTable.revenue',
												)}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.categoriesTable.cost')}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.categoriesTable.profit')}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.categoriesTable.margin')}
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{report.categories.map(c => (
											<TableRow key={c.categoryId} hover>
												<TableCell sx={{ fontWeight: 500 }}>
													{c.categoryName}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{c.productCount}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{parseFloat(c.quantitySold).toLocaleString(
														'id-ID',
													)}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{FormatCurrency(c.totalRevenue)}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{FormatCurrency(c.totalCost)}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{FormatCurrency(c.grossProfit)}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{c.marginPercent}%
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</Paper>

						{/* 2. Detailed Product Table */}
						<Paper variant='outlined' sx={{ p: 2 }}>
							<Typography
								variant='h6'
								sx={{ fontSize: '1.05rem', fontWeight: 600, mb: 1.5 }}
							>
								{t('reports.salesByProduct.productsTable.title')}
							</Typography>
							<TableContainer>
								<Table size='small'>
									<TableHead sx={{ backgroundColor: '#f8fafc' }}>
										<TableRow>
											<TableCell sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.productsTable.sku')}
											</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.productsTable.product')}
											</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.productsTable.category')}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.productsTable.units')}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.productsTable.revenue')}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.productsTable.cost')}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.productsTable.profit')}
											</TableCell>
											<TableCell align='right' sx={{ fontWeight: 600 }}>
												{t('reports.salesByProduct.productsTable.margin')}
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{report.products.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={8}
													align='center'
													sx={{ py: 3, color: 'text.secondary' }}
												>
													{t('reports.salesByProduct.empty')}
												</TableCell>
											</TableRow>
										) : (
											report.products.map(p => (
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
													<TableCell>{p.categoryName}</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{parseFloat(p.quantitySold).toLocaleString(
															'id-ID',
														)}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{FormatCurrency(p.totalRevenue)}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{FormatCurrency(p.totalCost)}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{FormatCurrency(p.grossProfit)}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{p.marginPercent}%
													</TableCell>
												</TableRow>
											))
										)}

										{/* Total Row */}
										<TableRow
											sx={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}
										>
											<TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
												TOTALS
											</TableCell>
											<TableCell
												align='right'
												sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
											>
												{parseFloat(
													report.summary.totalQuantity,
												).toLocaleString('id-ID')}
											</TableCell>
											<TableCell
												align='right'
												sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
											>
												{FormatCurrency(report.summary.totalRevenue)}
											</TableCell>
											<TableCell
												align='right'
												sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
											>
												{FormatCurrency(report.summary.totalCost)}
											</TableCell>
											<TableCell
												align='right'
												sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
											>
												{FormatCurrency(report.summary.totalProfit)}
											</TableCell>
											<TableCell
												align='right'
												sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
											>
												{report.summary.overallMarginPercent}%
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</TableContainer>
						</Paper>
					</>
				) : null}
			</Box>
		</PageContainer>
	)
}

export default SalesByProductReport

export { SalesByProductReport as Component }
