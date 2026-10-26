import { FC, useCallback, useEffect, useState, useTransition } from 'react'

import FileDownloadIcon from '@mui/icons-material/FileDownload'
import RefreshIcon from '@mui/icons-material/Refresh'

import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Menu,
	MenuItem,
	Paper,
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

import BalanceSheetApi, { BalanceSheetOutput } from 'Api/Report/BalanceSheetApi'
import BalanceSheetExportApi from 'Api/Report/BalanceSheetExportApi'

const BalanceSheetReport: FC = () => {
	const { t } = useTranslation()

	const [asOfDate, setAsOfDate] = useState<Dayjs>(() => dayjs().endOf('day'))
	const [report, setReport] = useState<BalanceSheetOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
	const [isExporting, setIsExporting] = useState(false)

	const fetchReport = useCallback(() => {
		setErrorText(null)
		startTransition(async () => {
			try {
				const result = await BalanceSheetApi({
					asOfDate: asOfDate.endOf('day').valueOf(),
				})
				setReport(result)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		})
	}, [asOfDate])

	useEffect(() => {
		fetchReport()
	}, [fetchReport])

	const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
		setExportAnchorEl(null)
		setIsExporting(true)
		setErrorText(null)

		try {
			const blob = await BalanceSheetExportApi({
				asOfDate: asOfDate.endOf('day').valueOf(),
				format,
			})

			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `balance_sheet_${dayjs().format('YYYY-MM-DD')}.${format}`

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
		<PageContainer title={t('reports.balanceSheet.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
				{/* Controls Toolbar */}
				<Paper
					variant='outlined'
					sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
				>
					<DatePicker
						label={t('reports.balanceSheet.asOfDate')}
						value={asOfDate}
						onChange={val => val && setAsOfDate(val)}
						slotProps={{ textField: { size: 'small' } }}
					/>
					<Button
						variant='contained'
						startIcon={<RefreshIcon />}
						onClick={fetchReport}
						loading={isPending}
					>
						{t('reports.balanceSheet.runReport')}
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
						{/* Verification Summary Card */}
						<Card
							variant='outlined'
							sx={{ bgcolor: report.isBalanced ? '#f0fdf4' : '#fef2f2' }}
						>
							<CardContent
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									py: 2,
								}}
							>
								<Box>
									<Typography variant='overline' color='textSecondary'>
										{t('reports.balanceSheet.subtitle')}
									</Typography>
									<Typography
										variant='h6'
										sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
									>
										Status:
										<Chip
											label={
												report.isBalanced
													? t('reports.balanceSheet.balanced')
													: t('reports.balanceSheet.outOfBalance', {
															diff: FormatCurrency(report.difference),
														})
											}
											color={report.isBalanced ? 'success' : 'error'}
											size='small'
										/>
									</Typography>
								</Box>

								<Box sx={{ display: 'flex', gap: 4, textAlign: 'right' }}>
									<Box>
										<Typography variant='caption' color='textSecondary'>
											{t('reports.balanceSheet.totalAssets')}
										</Typography>
										<Typography
											variant='h6'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{FormatCurrency(report.assets.total)}
										</Typography>
									</Box>
									<Box>
										<Typography variant='caption' color='textSecondary'>
											{t('reports.balanceSheet.totalLiabilitiesAndEquity')}
										</Typography>
										<Typography
											variant='h6'
											sx={{ fontFamily: 'monospace', fontWeight: 700 }}
										>
											{FormatCurrency(report.totalLiabilitiesAndEquity)}
										</Typography>
									</Box>
								</Box>
							</CardContent>
						</Card>

						{/* Balance Sheet Statement */}
						<TableContainer component={Paper} variant='outlined'>
							<Table size='small'>
								<TableHead sx={{ backgroundColor: '#f8fafc' }}>
									<TableRow>
										<TableCell width='70%' sx={{ fontWeight: 600 }}>
											{t('reports.profitAndLoss.account')}
										</TableCell>
										<TableCell width='30%' align='right' sx={{ fontWeight: 600 }}>
											{t('reports.profitAndLoss.amount')}
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{/* 1. ASSETS */}
									<TableRow sx={{ backgroundColor: '#f1f5f9' }}>
										<TableCell colSpan={2} sx={{ fontWeight: 700 }}>
											{t('reports.balanceSheet.assets')}
										</TableCell>
									</TableRow>
									{report.assets.items.length === 0 ? (
										<TableRow>
											<TableCell colSpan={2} sx={{ color: 'text.secondary', pl: 4 }}>
												{t('reports.balanceSheet.empty')}
											</TableCell>
										</TableRow>
									) : (
										report.assets.items.map(a => (
											<TableRow key={a.id} hover>
												<TableCell sx={{ pl: 4 }}>
													{a.code} - {a.name}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{FormatCurrency(a.amount)}
												</TableCell>
											</TableRow>
										))
									)}
									<TableRow sx={{ fontWeight: 'bold' }}>
										<TableCell sx={{ pl: 4 }}>
											{t('reports.balanceSheet.totalAssets')}
										</TableCell>
										<TableCell
											align='right'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 'bold',
												borderBottom: '3px double #000',
											}}
										>
											{FormatCurrency(report.assets.total)}
										</TableCell>
									</TableRow>

									{/* 2. LIABILITIES */}
									<TableRow sx={{ backgroundColor: '#f1f5f9' }}>
										<TableCell colSpan={2} sx={{ fontWeight: 700 }}>
											{t('reports.balanceSheet.liabilities')}
										</TableCell>
									</TableRow>
									{report.liabilities.items.length === 0 ? (
										<TableRow>
											<TableCell colSpan={2} sx={{ color: 'text.secondary', pl: 4 }}>
												{t('reports.balanceSheet.empty')}
											</TableCell>
										</TableRow>
									) : (
										report.liabilities.items.map(l => (
											<TableRow key={l.id} hover>
												<TableCell sx={{ pl: 4 }}>
													{l.code} - {l.name}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{FormatCurrency(l.amount)}
												</TableCell>
											</TableRow>
										))
									)}
									<TableRow sx={{ fontWeight: 'bold' }}>
										<TableCell sx={{ pl: 4 }}>
											{t('reports.balanceSheet.totalLiabilities')}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
										>
											{FormatCurrency(report.liabilities.total)}
										</TableCell>
									</TableRow>

									{/* 3. EQUITY */}
									<TableRow sx={{ backgroundColor: '#f1f5f9' }}>
										<TableCell colSpan={2} sx={{ fontWeight: 700 }}>
											{t('reports.balanceSheet.equity')}
										</TableCell>
									</TableRow>
									{report.equity.items.map(e => (
										<TableRow key={e.id} hover>
											<TableCell sx={{ pl: 4 }}>
												{e.code} - {e.name}
											</TableCell>
											<TableCell
												align='right'
												sx={{ fontFamily: 'monospace' }}
											>
												{FormatCurrency(e.amount)}
											</TableCell>
										</TableRow>
									))}
									<TableRow hover>
										<TableCell sx={{ pl: 4, fontStyle: 'italic' }}>
											{t('reports.balanceSheet.retainedEarnings')}
										</TableCell>
										<TableCell align='right' sx={{ fontFamily: 'monospace' }}>
											{FormatCurrency(report.equity.retainedEarnings)}
										</TableCell>
									</TableRow>
									<TableRow sx={{ fontWeight: 'bold' }}>
										<TableCell sx={{ pl: 4 }}>
											{t('reports.balanceSheet.totalEquity')}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
										>
											{FormatCurrency(report.equity.total)}
										</TableCell>
									</TableRow>

									{/* GRAND TOTAL LIABILITIES + EQUITY */}
									<TableRow
										sx={{
											backgroundColor: report.isBalanced ? '#f1f5f9' : '#fee2e2',
											fontWeight: 'bold',
										}}
									>
										<TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
											{t('reports.balanceSheet.totalLiabilitiesAndEquity')}
										</TableCell>
										<TableCell
											align='right'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 'bold',
												fontSize: '0.95rem',
												borderBottom: '3px double #000',
											}}
										>
											{FormatCurrency(report.totalLiabilitiesAndEquity)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>
					</>
				) : null}
			</Box>
		</PageContainer>
	)
}

export default BalanceSheetReport

export { BalanceSheetReport as Component }