import { FC, useCallback, useEffect, useState } from 'react'

import { useNavigate } from 'react-router'

import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TuneIcon from '@mui/icons-material/Tune'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Grid,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material'

import { OrderStatus, StockAdjustmentType } from '@accounting-app/common'
import dayjs from 'dayjs'
import { Decimal } from 'decimal.js'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import FormatCurrency from 'Utils/FormatCurrency'
import HandleApiError from 'Utils/HandleApiError'

import OrderFindManyApi, { OrderFindManySingleOutput } from 'Api/Order/OrderFindManyApi'
import ProductFindManyApi from 'Api/Product/ProductFindManyApi'
import StockAdjustmentFindManyApi, {
	StockAdjustmentFindManySingleOutput,
} from 'Api/StockAdjustment/StockAdjustmentFindManyApi'

interface DashboardMetrics {
	todaySales: Decimal
	todayOrdersCount: number
	lowStockCount: number
	monthToDateGrossProfit: Decimal
}

const Home: FC = () => {
	const [isLoading, setIsLoading] = useState(true)
	const [errorText, setErrorText] = useState<string | null>(null)

	const [metrics, setMetrics] = useState<DashboardMetrics>({
		todaySales: new Decimal(0),
		todayOrdersCount: 0,
		lowStockCount: 0,
		monthToDateGrossProfit: new Decimal(0),
	})

	const [recentOrders, setRecentOrders] = useState<OrderFindManySingleOutput[]>([])
	const [recentAdjustments, setRecentAdjustments] = useState<
		StockAdjustmentFindManySingleOutput[]
	>([])

	const navigate = useNavigate()
	const { t } = useTranslation()

	const loadDashboardData = useCallback(async () => {
		setIsLoading(true)
		setErrorText(null)

		try {
			const startOfToday = dayjs().startOf('day').valueOf()
			const startOfMonth = dayjs().startOf('month').valueOf()

			const [monthOrdersRes, recentOrdersRes, productsRes, adjustmentsRes] =
				await Promise.all([
					OrderFindManyApi({
						fromDate: startOfMonth,
						pagination: { limit: 100 },
					}),
					OrderFindManyApi({
						pagination: { limit: 5 },
					}),
					ProductFindManyApi({
						pagination: { limit: 100 },
					}),
					StockAdjustmentFindManyApi({
						pagination: { limit: 5 },
					}),
				])

			let todaySales = new Decimal(0)
			let todayCount = 0
			let mtdProfit = new Decimal(0)

			for (const order of monthOrdersRes.list) {
				if (order.status === OrderStatus.Completed) {
					const orderAmount = new Decimal(order.totalAmount || 0)
					const orderCost = new Decimal(order.totalCost || 0)

					mtdProfit = mtdProfit.plus(orderAmount.minus(orderCost))

					if (order.date.getTime() >= startOfToday) {
						todaySales = todaySales.plus(orderAmount)
						todayCount += 1
					}
				}
			}

			let lowStock = 0
			for (const p of productsRes.list) {
				const stockNum = parseFloat(p.currentStock || '0')
				if (stockNum < 10) {
					lowStock += 1
				}
			}

			setMetrics({
				todaySales,
				todayOrdersCount: todayCount,
				lowStockCount: lowStock,
				monthToDateGrossProfit: mtdProfit,
			})

			setRecentOrders(recentOrdersRes.list)
			setRecentAdjustments(adjustmentsRes.list)
		} catch (error) {
			setErrorText(HandleApiError(error))
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void loadDashboardData()
	}, [loadDashboardData])

	const getTypeChipColor = (type: StockAdjustmentType) => {
		switch (type) {
			case StockAdjustmentType.Restock:
				return 'success'
			case StockAdjustmentType.Waste:
				return 'error'
			case StockAdjustmentType.Correction:
				return 'warning'
			default:
				return 'default'
		}
	}

	return (
		<PageContainer title={t('dashboard.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
				{errorText && (
					<Alert severity='error' sx={{ width: '100%' }}>
						{errorText}
					</Alert>
				)}

				{/* Quick Action Buttons */}
				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
					<Button
						variant='contained'
						color='primary'
						startIcon={<AddShoppingCartIcon />}
						onClick={() => navigate('/order/new')}
					>
						{t('orders.new.title')}
					</Button>
					<Button
						variant='outlined'
						startIcon={<TuneIcon />}
						onClick={() => navigate('/stock-adjustment/new')}
					>
						{t('stockAdjustments.new.title')}
					</Button>
					<Button
						variant='outlined'
						startIcon={<MenuBookIcon />}
						onClick={() => navigate('/journal/new')}
					>
						{t('journal.new.title')}
					</Button>
				</Box>

				{/* Top Metric Cards */}
				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
						<CircularProgress />
					</Box>
				) : (
					<Grid container spacing={2}>
						{/* Card 1: Today's Sales */}
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
										<Typography variant='body2' color='text.secondary'>
											{t('dashboard.metrics.todaySales')}
										</Typography>
										<AttachMoneyIcon color='primary' />
									</Box>
									<Typography
										variant='h5'
										sx={{ fontWeight: 700, fontFamily: 'monospace' }}
									>
										{FormatCurrency(metrics.todaySales.toString())}
									</Typography>
									<Typography variant='caption' color='text.secondary'>
										{t('dashboard.metricsSub.todaySales')}
									</Typography>
								</CardContent>
							</Card>
						</Grid>

						{/* Card 2: Today's Order Count */}
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
										<Typography variant='body2' color='text.secondary'>
											{t('dashboard.metrics.todayOrders')}
										</Typography>
										<ShoppingCartIcon color='info' />
									</Box>
									<Typography
										variant='h5'
										sx={{
											fontWeight: 700,
											fontFamily: 'monospace',
										}}
									>
										{metrics.todayOrdersCount}
									</Typography>
									<Typography variant='caption' color='text.secondary'>
										{t('dashboard.metricsSub.todayOrders')}
									</Typography>
								</CardContent>
							</Card>
						</Grid>

						{/* Card 3: Low Stock Warning */}
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
										<Typography variant='body2' color='text.secondary'>
											{t('dashboard.metrics.lowStock')}
										</Typography>
										<WarningAmberIcon
											color={
												metrics.lowStockCount > 0 ? 'warning' : 'success'
											}
										/>
									</Box>
									<Typography
										variant='h5'
										sx={{
											fontWeight: 700,
											fontFamily: 'monospace',
											color:
												metrics.lowStockCount > 0
													? 'warning.main'
													: 'text.primary',
										}}
									>
										{metrics.lowStockCount}
									</Typography>
									<Typography variant='caption' color='text.secondary'>
										{t('dashboard.metricsSub.lowStock')}
									</Typography>
								</CardContent>
							</Card>
						</Grid>

						{/* Card 4: Month to Date Gross Profit */}
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
										<Typography variant='body2' color='text.secondary'>
											{t('dashboard.metrics.mtdProfit')}
										</Typography>
										<TrendingUpIcon color='success' />
									</Box>
									<Typography
										variant='h5'
										sx={{
											fontWeight: 700,
											fontFamily: 'monospace',
											color: metrics.monthToDateGrossProfit.isNegative()
												? 'error.main'
												: 'success.main',
										}}
									>
										{FormatCurrency(metrics.monthToDateGrossProfit.toString())}
									</Typography>
									<Typography variant='caption' color='text.secondary'>
										{t('dashboard.metricsSub.mtdProfit')}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				)}

				{/* Recent Activity Feeds */}
				<Grid container spacing={3}>
					{/* Feed 1: Recent Orders */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Paper variant='outlined' sx={{ p: 2 }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									mb: 1.5,
								}}
							>
								<Typography
									variant='h6'
									sx={{ fontSize: '1.1rem', fontWeight: 600 }}
								>
									{t('dashboard.recentOrders.title')}
								</Typography>
								<Button
									size='small'
									endIcon={<ArrowForwardIcon />}
									onClick={() => navigate('/order')}
								>
									{t('dashboard.viewAll')}
								</Button>
							</Box>

							<TableContainer>
								<Table size='small'>
									<TableHead>
										<TableRow>
											<TableCell>{t('orders.orderNumber')}</TableCell>
											<TableCell>{t('orders.date')}</TableCell>
											<TableCell align='right'>
												{t('orders.totalAmount')}
											</TableCell>
											<TableCell align='center'>
												{t('orders.status')}
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{recentOrders.length === 0 ? (
											<TableRow>
												<TableCell colSpan={4} align='center'>
													<Typography
														variant='body2'
														color='text.secondary'
														sx={{ py: 2 }}
													>
														{t('dashboard.recentOrders.empty')}
													</Typography>
												</TableCell>
											</TableRow>
										) : (
											recentOrders.map(order => (
												<TableRow
													key={order.id}
													hover
													sx={{ cursor: 'pointer' }}
													onClick={() => navigate(`/order/${order.id}`)}
												>
													<TableCell sx={{ fontWeight: 500 }}>
														{order.orderNumber}
													</TableCell>
													<TableCell>
														{dayjs(order.date).format(
															'DD/MM/YYYY HH:mm',
														)}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{FormatCurrency(order.totalAmount)}
													</TableCell>
													<TableCell align='center'>
														<Chip
															label={order.status}
															size='small'
															color={
																order.status ===
																OrderStatus.Completed
																	? 'success'
																	: 'default'
															}
														/>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</TableContainer>
						</Paper>
					</Grid>

					{/* Feed 2: Recent Stock Adjustments */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Paper variant='outlined' sx={{ p: 2 }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									mb: 1.5,
								}}
							>
								<Typography
									variant='h6'
									sx={{
										fontSize: '1.1rem',
										fontWeight: 600,
									}}
								>
									{t('dashboard.recentAdjustments.title')}
								</Typography>
								<Button
									size='small'
									endIcon={<ArrowForwardIcon />}
									onClick={() => navigate('/stock-adjustment')}
								>
									{t('dashboard.viewAll')}
								</Button>
							</Box>

							<TableContainer>
								<Table size='small'>
									<TableHead>
										<TableRow>
											<TableCell>
												{t('stockAdjustments.adjustmentNumber')}
											</TableCell>
											<TableCell>{t('stockAdjustments.type')}</TableCell>
											<TableCell>{t('stockAdjustments.reason')}</TableCell>
											<TableCell align='right'>
												{t('stockAdjustments.totalCost')}
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{recentAdjustments.length === 0 ? (
											<TableRow>
												<TableCell colSpan={4} align='center'>
													<Typography
														variant='body2'
														color='text.secondary'
														sx={{ py: 2 }}
													>
														{t('dashboard.recentAdjustments.empty')}
													</Typography>
												</TableCell>
											</TableRow>
										) : (
											recentAdjustments.map(adj => (
												<TableRow
													key={adj.id}
													hover
													sx={{ cursor: 'pointer' }}
													onClick={() =>
														navigate(`/stock-adjustment/${adj.id}`)
													}
												>
													<TableCell sx={{ fontWeight: 500 }}>
														{adj.adjustmentNumber}
													</TableCell>
													<TableCell>
														<Chip
															label={adj.type}
															size='small'
															color={getTypeChipColor(adj.type)}
														/>
													</TableCell>
													<TableCell
														sx={{
															maxWidth: 150,
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap',
														}}
													>
														{adj.reason}
													</TableCell>
													<TableCell
														align='right'
														sx={{ fontFamily: 'monospace' }}
													>
														{FormatCurrency(adj.totalCost)}
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
			</Box>
		</PageContainer>
	)
}

export default Home

export { Home as Component }
