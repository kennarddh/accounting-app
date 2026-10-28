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

import TrialBalanceApi, { TrialBalanceOutput } from 'Api/Report/TrialBalanceApi'
import TrialBalanceExportApi from 'Api/Report/TrialBalanceExportApi'

const TrialBalanceReport: FC = () => {
	const { t } = useTranslation()

	const [toDate, setToDate] = useState<Dayjs>(() => dayjs().endOf('day'))

	const [report, setReport] = useState<TrialBalanceOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
	const [isExporting, setIsExporting] = useState(false)

	const fetchReport = useCallback(() => {
		setErrorText(null)
		startTransition(async () => {
			try {
				const result = await TrialBalanceApi({
					toDate: toDate.endOf('day').valueOf(),
				})
				setReport(result)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		})
	}, [toDate])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchReport()
	}, [fetchReport])

	const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
		setExportAnchorEl(null)
		setIsExporting(true)
		setErrorText(null)

		try {
			const blob = await TrialBalanceExportApi({
				toDate: toDate.endOf('day').valueOf(),
				format,
			})

			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `trial_balance_${dayjs().format('YYYY-MM-DD')}.${format}`

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
		<PageContainer title={t('reports.trialBalance.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
				{/* Top Controls Bar */}
				<Paper
					variant='outlined'
					sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
				>
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
						{t('reports.trialBalance.runReport')}
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
						{/* Verification Summary Banner */}
						<Card
							variant='outlined'
							sx={{ bgcolor: report.isBalanced ? '#f0fdf4' : '#fef2f2' }}
						>
							<CardContent
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: { xs: 'flex-start', md: 'center' },
									py: 2,
									flexDirection: { xs: 'column', md: 'row' },
								}}
							>
								<Box>
									<Typography variant='overline' color='textSecondary'>
										{t('reports.trialBalance.subtitle')}
									</Typography>
									<Typography
										variant='h6'
										sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
									>
										Status:
										<Chip
											label={
												report.isBalanced
													? t('reports.trialBalance.balanced')
													: t('reports.trialBalance.outOfBalance', {
															diff: FormatCurrency(report.difference),
														})
											}
											color={report.isBalanced ? 'success' : 'error'}
											size='small'
										/>
									</Typography>
								</Box>

								<Box
									sx={{
										display: 'flex',
										width: { xs: '100%', md: 'unset' },
										gap: { xs: 1, md: 4 },
										textAlign: 'right',
										flexDirection: { xs: 'column', md: 'row' },
										alignItems: { xs: 'flex-end', md: 'unset' },
									}}
								>
									<Box>
										<Typography variant='caption' color='textSecondary'>
											Total Debits
										</Typography>
										<Typography
											variant='h6'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
											}}
										>
											{FormatCurrency(report.totalDebit)}
										</Typography>
									</Box>
									<Box>
										<Typography variant='caption' color='textSecondary'>
											Total Credits
										</Typography>
										<Typography
											variant='h6'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
											}}
										>
											{FormatCurrency(report.totalCredit)}
										</Typography>
									</Box>
								</Box>
							</CardContent>
						</Card>

						{/* Full Trial Balance Ledger Table */}
						<TableContainer component={Paper} variant='outlined'>
							<Table size='small'>
								<TableHead sx={{ backgroundColor: '#f8fafc' }}>
									<TableRow>
										<TableCell width='15%' sx={{ fontWeight: 600 }}>
											{t('reports.trialBalance.accountCode')}
										</TableCell>
										<TableCell width='40%' sx={{ fontWeight: 600 }}>
											{t('reports.trialBalance.accountName')}
										</TableCell>
										<TableCell width='15%' sx={{ fontWeight: 600 }}>
											{t('reports.trialBalance.accountType')}
										</TableCell>
										<TableCell
											width='15%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.trialBalance.debit')}
										</TableCell>
										<TableCell
											width='15%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.trialBalance.credit')}
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{report.items.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												align='center'
												sx={{ py: 3, color: 'text.secondary' }}
											>
												{t('reports.trialBalance.empty')}
											</TableCell>
										</TableRow>
									) : (
										report.items.map(item => (
											<TableRow key={item.id} hover>
												<TableCell
													sx={{
														fontFamily: 'monospace',
														fontWeight: 500,
													}}
												>
													{item.code}
												</TableCell>
												<TableCell>{item.name}</TableCell>
												<TableCell>
													<Chip
														label={item.type}
														size='small'
														variant='outlined'
													/>
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{parseFloat(item.debit) > 0
														? FormatCurrency(item.debit)
														: '-'}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{parseFloat(item.credit) > 0
														? FormatCurrency(item.credit)
														: '-'}
												</TableCell>
											</TableRow>
										))
									)}

									{/* Total & Bottom Double Underline */}
									<TableRow
										sx={{
											backgroundColor: report.isBalanced
												? '#f1f5f9'
												: '#fee2e2',
											fontWeight: 'bold',
										}}
									>
										<TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
											{t('reports.trialBalance.totals')}
										</TableCell>
										<TableCell
											align='right'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 'bold',
												borderBottom: '3px double #000',
											}}
										>
											{FormatCurrency(report.totalDebit)}
										</TableCell>
										<TableCell
											align='right'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 'bold',
												borderBottom: '3px double #000',
											}}
										>
											{FormatCurrency(report.totalCredit)}
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

export default TrialBalanceReport

export { TrialBalanceReport as Component }
