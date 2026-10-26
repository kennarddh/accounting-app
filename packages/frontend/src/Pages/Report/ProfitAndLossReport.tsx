import { FC, useCallback, useEffect, useState, useTransition } from 'react'

import PrintIcon from '@mui/icons-material/Print'
import RefreshIcon from '@mui/icons-material/Refresh'

import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
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
import { Decimal } from 'decimal.js'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import FormatCurrency from 'Utils/FormatCurrency'
import HandleApiError from 'Utils/HandleApiError'

import ProfitAndLossApi, { ProfitAndLossOutput } from 'Api/Report/ProfitAndLossApi'

const ProfitAndLossReport: FC = () => {
	const { t } = useTranslation()

	const [fromDate, setFromDate] = useState<Dayjs>(() => dayjs().startOf('month'))
	const [toDate, setToDate] = useState<Dayjs>(() => dayjs().endOf('day'))

	const [report, setReport] = useState<ProfitAndLossOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const fetchReport = useCallback(() => {
		setErrorText(null)
		startTransition(async () => {
			try {
				const result = await ProfitAndLossApi({
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
		fetchReport()
	}, [fetchReport])

	const isNetProfitPositive = report
		? new Decimal(report.netProfit).greaterThanOrEqualTo(0)
		: true

	return (
		<PageContainer title={t('reports.profitAndLoss.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
				{/* Top Controls: Date Filters & Print */}
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
						{t('reports.profitAndLoss.runReport')}
					</Button>
					<Button
						variant='outlined'
						startIcon={<PrintIcon />}
						sx={{ ml: 'auto' }}
						onClick={() => window.print()}
					>
						{t('common.details')}
					</Button>
				</Paper>

				{errorText && <Alert severity='error'>{errorText}</Alert>}

				{isPending && !report ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
						<CircularProgress />
					</Box>
				) : report ? (
					<>
						{/* Net Profit Summary Card */}
						<Card
							variant='outlined'
							sx={{ bgcolor: isNetProfitPositive ? '#f0fdf4' : '#fef2f2' }}
						>
							<CardContent
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<Box>
									<Typography variant='overline' color='textSecondary'>
										{t('reports.profitAndLoss.subtitle')}
									</Typography>
									<Typography variant='h6'>
										{isNetProfitPositive
											? t('reports.profitAndLoss.netProfit')
											: t('reports.profitAndLoss.netLoss')}
									</Typography>
								</Box>
								<Typography
									variant='h4'
									sx={{
										fontWeight: 700,
										fontFamily: 'monospace',
										color: isNetProfitPositive ? 'success.main' : 'error.main',
									}}
								>
									{FormatCurrency(report.netProfit)}
								</Typography>
							</CardContent>
						</Card>

						{/* Financial Statement Paper */}
						<TableContainer component={Paper} variant='outlined'>
							<Table size='small'>
								<TableHead sx={{ backgroundColor: '#f8fafc' }}>
									<TableRow>
										<TableCell width='70%' sx={{ fontWeight: 600 }}>
											{t('reports.profitAndLoss.account')}
										</TableCell>
										<TableCell
											width='30%'
											align='right'
											sx={{ fontWeight: 600 }}
										>
											{t('reports.profitAndLoss.amount')}
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{/* SECTION 1: OPERATING REVENUES */}
									<TableRow sx={{ backgroundColor: '#f1f5f9' }}>
										<TableCell colSpan={2} sx={{ fontWeight: 700 }}>
											{t('reports.profitAndLoss.operatingRevenues')}
										</TableCell>
									</TableRow>
									{report.revenues.items.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={2}
												sx={{ color: 'text.secondary', pl: 4 }}
											>
												{t('reports.profitAndLoss.empty')}
											</TableCell>
										</TableRow>
									) : (
										report.revenues.items.map(item => (
											<TableRow key={item.id} hover>
												<TableCell sx={{ pl: 4 }}>
													{item.code} - {item.name}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{FormatCurrency(item.amount)}
												</TableCell>
											</TableRow>
										))
									)}
									<TableRow sx={{ fontWeight: 'bold' }}>
										<TableCell sx={{ pl: 4 }}>
											{t('reports.profitAndLoss.totalRevenues')}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
										>
											{FormatCurrency(report.revenues.total)}
										</TableCell>
									</TableRow>

									{/* SECTION 2: COST OF GOODS SOLD */}
									<TableRow sx={{ backgroundColor: '#f1f5f9' }}>
										<TableCell colSpan={2} sx={{ fontWeight: 700 }}>
											{t('reports.profitAndLoss.cogs')}
										</TableCell>
									</TableRow>
									{report.cogs.items.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={2}
												sx={{ color: 'text.secondary', pl: 4 }}
											>
												{t('reports.profitAndLoss.empty')}
											</TableCell>
										</TableRow>
									) : (
										report.cogs.items.map(item => (
											<TableRow key={item.id} hover>
												<TableCell sx={{ pl: 4 }}>
													{item.code} - {item.name}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{FormatCurrency(item.amount)}
												</TableCell>
											</TableRow>
										))
									)}
									<TableRow sx={{ fontWeight: 'bold' }}>
										<TableCell sx={{ pl: 4 }}>
											{t('reports.profitAndLoss.totalCogs')}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
										>
											{FormatCurrency(report.cogs.total)}
										</TableCell>
									</TableRow>

									{/* GROSS PROFIT HIGHLIGHT */}
									<TableRow sx={{ backgroundColor: '#e2e8f0', fontWeight: 800 }}>
										<TableCell sx={{ fontSize: '0.95rem' }}>
											{t('reports.profitAndLoss.grossProfit')}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontSize: '0.95rem' }}
										>
											{FormatCurrency(report.grossProfit)}
										</TableCell>
									</TableRow>

									{/* SECTION 3: OPERATING EXPENSES */}
									<TableRow sx={{ backgroundColor: '#f1f5f9' }}>
										<TableCell colSpan={2} sx={{ fontWeight: 700 }}>
											{t('reports.profitAndLoss.operatingExpenses')}
										</TableCell>
									</TableRow>
									{report.expenses.items.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={2}
												sx={{ color: 'text.secondary', pl: 4 }}
											>
												{t('reports.profitAndLoss.empty')}
											</TableCell>
										</TableRow>
									) : (
										report.expenses.items.map(item => (
											<TableRow key={item.id} hover>
												<TableCell sx={{ pl: 4 }}>
													{item.code} - {item.name}
												</TableCell>
												<TableCell
													align='right'
													sx={{ fontFamily: 'monospace' }}
												>
													{FormatCurrency(item.amount)}
												</TableCell>
											</TableRow>
										))
									)}
									<TableRow sx={{ fontWeight: 'bold' }}>
										<TableCell sx={{ pl: 4 }}>
											{t('reports.profitAndLoss.totalExpenses')}
										</TableCell>
										<TableCell
											align='right'
											sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
										>
											{FormatCurrency(report.expenses.total)}
										</TableCell>
									</TableRow>

									{/* NET PROFIT HIGHLIGHT */}
									<TableRow
										sx={{
											backgroundColor: isNetProfitPositive
												? '#dcfce7'
												: '#fee2e2',
											fontWeight: 900,
										}}
									>
										<TableCell sx={{ fontSize: '1.05rem' }}>
											{isNetProfitPositive
												? t('reports.profitAndLoss.netProfit')
												: t('reports.profitAndLoss.netLoss')}
										</TableCell>
										<TableCell
											align='right'
											sx={{
												fontFamily: 'monospace',
												fontSize: '1.05rem',
												color: isNetProfitPositive
													? 'success.dark'
													: 'error.dark',
											}}
										>
											{FormatCurrency(report.netProfit)}
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

export default ProfitAndLossReport

export { ProfitAndLossReport as Component }
