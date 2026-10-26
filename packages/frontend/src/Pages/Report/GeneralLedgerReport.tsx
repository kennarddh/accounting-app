import { FC, useCallback, useEffect, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

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
	FormControl,
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

import AccountFindOptionsApi, { AccountOptionOutput } from 'Api/Account/AccountFindOptionsApi'
import GeneralLedgerApi, { GeneralLedgerOutput } from 'Api/Report/GeneralLedgerApi'
import GeneralLedgerExportApi from 'Api/Report/GeneralLedgerExportApi'

const GeneralLedgerReport: FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const [accounts, setAccounts] = useState<AccountOptionOutput[]>([])
	const [selectedAccountId, setSelectedAccountId] = useState<string>('')

	const [fromDate, setFromDate] = useState<Dayjs>(() => dayjs().startOf('month'))
	const [toDate, setToDate] = useState<Dayjs>(() => dayjs().endOf('day'))

	const [report, setReport] = useState<GeneralLedgerOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
	const [isExporting, setIsExporting] = useState(false)

	// 1. Load active account dropdown options
	useEffect(() => {
		const loadOptions = async () => {
			try {
				const opts = await AccountFindOptionsApi()
				setAccounts(opts)
				if (opts.length > 0 && opts[0]) {
					setSelectedAccountId(opts[0].id)
				}
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		}
		void loadOptions()
	}, [])

	// 2. Fetch General Ledger Report
	const fetchReport = useCallback(() => {
		if (!selectedAccountId) return

		setErrorText(null)
		startTransition(async () => {
			try {
				const result = await GeneralLedgerApi({
					accountId: selectedAccountId,
					fromDate: fromDate.startOf('day').valueOf(),
					toDate: toDate.endOf('day').valueOf(),
				})
				setReport(result)
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		})
	}, [fromDate, toDate, selectedAccountId])

	useEffect(() => {
		if (selectedAccountId) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			fetchReport()
		}
	}, [fetchReport, selectedAccountId])

	const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
		setExportAnchorEl(null)
		setIsExporting(true)
		setErrorText(null)

		try {
			const blob = await GeneralLedgerExportApi({
				accountId: selectedAccountId,
				fromDate: fromDate.startOf('day').valueOf(),
				toDate: toDate.endOf('day').valueOf(),
				format,
			})

			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `general_ledger_${report?.account.code ?? 'account'}_${dayjs().format('YYYY-MM-DD')}.${format}`

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
		<PageContainer title={t('reports.generalLedger.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
				{/* Filters Bar */}
				<Paper
					variant='outlined'
					sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
				>
					<FormControl size='small' sx={{ minWidth: 260 }}>
						<InputLabel id='gl-account-select-label'>
							{t('reports.generalLedger.selectAccount')}
						</InputLabel>
						<Select
							labelId='gl-account-select-label'
							label={t('reports.generalLedger.selectAccount')}
							value={selectedAccountId}
							onChange={e => setSelectedAccountId(e.target.value)}
						>
							{accounts.map(acc => (
								<MenuItem key={acc.id} value={acc.id}>
									{acc.code} - {acc.name} ({acc.type})
								</MenuItem>
							))}
						</Select>
					</FormControl>

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
						{t('reports.generalLedger.runReport')}
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
						{/* Account Summary & Balance Metrics */}
						<Card variant='outlined' sx={{ bgcolor: '#f8fafc' }}>
							<CardContent
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									flexWrap: 'wrap',
									gap: 2,
								}}
							>
								<Box>
									<Typography
										variant='h6'
										sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
									>
										{report.account.code} - {report.account.name}
										<Chip
											label={report.account.type}
											size='small'
											variant='outlined'
										/>
									</Typography>
									<Typography variant='caption' color='textSecondary'>
										{t('reports.generalLedger.normalBalance', {
											type: report.account.isDebitNormal ? 'Debit' : 'Credit',
										})}
									</Typography>
								</Box>

								<Box
									sx={{
										display: 'flex',
										gap: 3,
										textAlign: 'right',
										flexWrap: 'wrap',
									}}
								>
									<Box>
										<Typography variant='caption' color='textSecondary'>
											{t('reports.generalLedger.openingBalance')}
										</Typography>
										<Typography
											variant='body1'
											sx={{ fontFamily: 'monospace', fontWeight: 600 }}
										>
											{FormatCurrency(report.openingBalance)}
										</Typography>
									</Box>

									<Box>
										<Typography variant='caption' color='textSecondary'>
											{t('reports.generalLedger.periodDebits')}
										</Typography>
										<Typography
											variant='body1'
											sx={{ fontFamily: 'monospace', fontWeight: 600 }}
										>
											{FormatCurrency(report.totalDebit)}
										</Typography>
									</Box>

									<Box>
										<Typography variant='caption' color='textSecondary'>
											{t('reports.generalLedger.periodCredits')}
										</Typography>
										<Typography
											variant='body1'
											sx={{ fontFamily: 'monospace', fontWeight: 600 }}
										>
											{FormatCurrency(report.totalCredit)}
										</Typography>
									</Box>

									<Box>
										<Typography variant='caption' color='textSecondary'>
											{t('reports.generalLedger.endingBalance')}
										</Typography>
										<Typography
											variant='h6'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 700,
												color: 'primary.main',
											}}
										>
											{FormatCurrency(report.endingBalance)}
										</Typography>
									</Box>
								</Box>
							</CardContent>
						</Card>

						{/* Transactions Ledger Table */}
						<TableContainer component={Paper} variant='outlined'>
							<Table size='small'>
								<TableHead sx={{ backgroundColor: '#f8fafc' }}>
									<TableRow>
										<TableCell width='12%' sx={{ fontWeight: 600 }}>
											{t('reports.generalLedger.date')}
										</TableCell>
										<TableCell width='18%' sx={{ fontWeight: 600 }}>
											{t('reports.generalLedger.entryNumber')}
										</TableCell>
										<TableCell width='34%' sx={{ fontWeight: 600 }}>
											{t('reports.generalLedger.description')}
										</TableCell>
										<TableCell
											width='12%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.generalLedger.debit')}
										</TableCell>
										<TableCell
											width='12%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.generalLedger.credit')}
										</TableCell>
										<TableCell
											width='12%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.generalLedger.balance')}
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{/* Opening Balance Row */}
									<TableRow sx={{ backgroundColor: '#f1f5f9' }}>
										<TableCell
											colSpan={5}
											sx={{ fontStyle: 'italic', fontWeight: 600 }}
										>
											{t('reports.generalLedger.openingBalance')}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontWeight: 600 }}
										>
											{FormatCurrency(report.openingBalance)}
										</TableCell>
									</TableRow>

									{report.transactions.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												align='center'
												sx={{ py: 3, color: 'text.secondary' }}
											>
												{t('reports.generalLedger.empty')}
											</TableCell>
										</TableRow>
									) : (
										report.transactions.map(tx => (
											<TableRow
												key={tx.journalEntryId + tx.entryNumber}
												hover
											>
												<TableCell>
													{dayjs(tx.date).format('DD/MM/YYYY')}
												</TableCell>
												<TableCell
													sx={{
														fontFamily: 'monospace',
														cursor: 'pointer',
														color: 'primary.main',
													}}
													onClick={() =>
														navigate(`/journal/${tx.journalEntryId}`)
													}
												>
													{tx.entryNumber}
												</TableCell>
												<TableCell>{tx.description}</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{parseFloat(tx.debit) > 0
														? FormatCurrency(tx.debit)
														: '-'}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{parseFloat(tx.credit) > 0
														? FormatCurrency(tx.credit)
														: '-'}
												</TableCell>
												<TableCell
													align='right'
													sx={{
														fontFamily: 'monospace',
														fontWeight: 500,
													}}
												>
													{FormatCurrency(tx.runningBalance)}
												</TableCell>
											</TableRow>
										))
									)}

									{/* Ending Summary Totals */}
									<TableRow
										sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}
									>
										<TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
											{t('reports.generalLedger.endingBalance')}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
										>
											{FormatCurrency(report.totalDebit)}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
										>
											{FormatCurrency(report.totalCredit)}
										</TableCell>
										<TableCell
											align='right'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 'bold',
												borderBottom: '3px double #000',
											}}
										>
											{FormatCurrency(report.endingBalance)}
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

export default GeneralLedgerReport

export { GeneralLedgerReport as Component }
