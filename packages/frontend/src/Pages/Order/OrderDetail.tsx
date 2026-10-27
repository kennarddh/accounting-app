import { FC, useCallback, useEffect, useState, useTransition } from 'react'

import { useNavigate, useParams } from 'react-router'

import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ReplayIcon from '@mui/icons-material/Replay'

import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	FormControl,
	Paper,
	Snackbar,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'

import { OrderStatus } from '@accounting-app/common'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import FormatCurrency from 'Utils/FormatCurrency'
import HandleApiError from 'Utils/HandleApiError'

import useConfirm from 'Hooks/useConfirm'

import OrderFindByIdApi, { OrderFindByIdOutput } from 'Api/Order/OrderFindByIdApi'
import OrderRefundApi from 'Api/Order/OrderRefundApi'

const OrderDetail: FC = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const confirm = useConfirm()

	const [order, setOrder] = useState<OrderFindByIdOutput | null>(null)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [isRefunding, startRefundTransition] = useTransition()

	const loadOrder = useCallback(async () => {
		if (!id) return
		try {
			const result = await OrderFindByIdApi({ id })
			setOrder(result)
		} catch {
			await navigate('../../')
		}
	}, [id, navigate])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void loadOrder()
	}, [loadOrder])

	const handleRefundOrCancel = async (
		targetStatus: OrderStatus.Refunded | OrderStatus.Cancelled,
	) => {
		if (!order || !id) return

		const isRefund = targetStatus === OrderStatus.Refunded
		const isConfirmed = await confirm({
			title: isRefund
				? t('orders.refund.confirmTitle')
				: t('orders.refund.confirmCancelTitle'),
			content: isRefund
				? t('orders.refund.confirmMessage', { orderNumber: order.orderNumber })
				: t('orders.refund.confirmCancelMessage', { orderNumber: order.orderNumber }),
			confirmText: isRefund
				? t('orders.refund.refundButton')
				: t('orders.refund.cancelButton'),
			confirmColor: 'error',
		})

		if (!isConfirmed) return

		startRefundTransition(async () => {
			try {
				await OrderRefundApi({
					id,
					status: targetStatus,
				})
				setSuccessMessage(
					isRefund
						? t('orders.refund.successRefund', { orderNumber: order.orderNumber })
						: t('orders.refund.successCancel', { orderNumber: order.orderNumber }),
				)
				await loadOrder()
			} catch (err) {
				setErrorText(HandleApiError(err))
			}
		})
	}

	if (order === null) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
				<CircularProgress />
			</Box>
		)
	}

	const isCompleted = order.status === OrderStatus.Completed

	const getStatusChipColor = (status: OrderStatus) => {
		switch (status) {
			case OrderStatus.Completed:
				return 'success'
			case OrderStatus.Cancelled:
				return 'error'
			case OrderStatus.Refunded:
				return 'warning'
			default:
				return 'default'
		}
	}

	return (
		<PageContainer title={t('orders.detail.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{errorText && <Alert severity='error'>{errorText}</Alert>}

				{/* Top Action Toolbar */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: 1.5,
						width: '100%',
						flexWrap: 'wrap',
					}}
				>
					{/* Re-order / Duplicate */}
					<Button
						variant='outlined'
						startIcon={<ContentCopyIcon />}
						onClick={() =>
							navigate('/order/new', {
								state: {
									duplicateFromOrder: {
										paymentMethod: order.paymentMethod,
										items: order.items.map(item => ({
											productId: item.product.id,
											quantity: item.quantity,
											unitPrice: item.unitPrice,
											unitCost: item.unitCost,
											subtotal: item.subtotal,
										})),
									},
								},
							})
						}
					>
						{t('common.reorder')}
					</Button>

					{/* Void / Cancel Button (Enabled only if Completed) */}
					{isCompleted && (
						<Button
							variant='outlined'
							color='inherit'
							startIcon={<CancelOutlinedIcon />}
							onClick={() => handleRefundOrCancel(OrderStatus.Cancelled)}
							loading={isRefunding}
						>
							{t('orders.refund.cancelButton')}
						</Button>
					)}

					{/* Refund Button (Enabled only if Completed) */}
					{isCompleted && (
						<Button
							variant='contained'
							color='error'
							startIcon={<ReplayIcon />}
							onClick={() => handleRefundOrCancel(OrderStatus.Refunded)}
							loading={isRefunding}
						>
							{t('orders.refund.refundButton')}
						</Button>
					)}
				</Box>

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 1, minWidth: 250 }}>
						<TextField
							value={order.orderNumber}
							label={t('orders.orderNumber')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200, justifyContent: 'center' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Typography variant='body2' sx={{ color: 'text.secondary' }}>
								{t('orders.status')}:
							</Typography>
							<Chip
								label={t(`orders.enum.status.${order.status}`)}
								color={getStatusChipColor(order.status)}
								size='medium'
							/>
						</Box>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							value={t(`orders.enum.paymentMethod.${order.paymentMethod}`)}
							label={t('orders.paymentMethod')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 250 }}>
						<DateTimePicker
							label={t('orders.date')}
							defaultValue={dayjs(order.date)}
							ampm={false}
							readOnly
						/>
					</FormControl>
				</Box>

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 1, minWidth: 250 }}>
						<TextField
							value={order.cashier.name}
							label={t('orders.cashier')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					{order.journalEntry && (
						<FormControl sx={{ flex: 1, minWidth: 250 }}>
							<TextField
								value={order.journalEntry.entryNumber}
								label={t('orders.journalEntry')}
								variant='outlined'
								slotProps={{
									inputLabel: { shrink: true },
									input: { readOnly: true },
								}}
							/>
						</FormControl>
					)}
				</Box>

				<TableContainer component={Paper} variant='outlined' sx={{ mb: 2 }}>
					<Table size='small'>
						<TableHead sx={{ backgroundColor: '#f8fafc' }}>
							<TableRow>
								<TableCell width='36%' sx={{ fontWeight: 600 }}>
									{t('orders.product')}
								</TableCell>
								<TableCell width='16%' align='right' sx={{ fontWeight: 600 }}>
									{t('orders.unitPrice')}
								</TableCell>
								<TableCell width='16%' align='right' sx={{ fontWeight: 600 }}>
									{t('orders.unitCost')}
								</TableCell>
								<TableCell width='16%' align='right' sx={{ fontWeight: 600 }}>
									{t('orders.quantity')}
								</TableCell>
								<TableCell width='16%' align='right' sx={{ fontWeight: 600 }}>
									{t('orders.subtotal')}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{order.items.map((item, index) => (
								<TableRow key={index} hover>
									<TableCell>
										<Typography variant='body2' sx={{ fontWeight: 600 }}>
											{item.product.sku} - {item.product.name}
										</Typography>
									</TableCell>
									<TableCell align='right' sx={{ fontFamily: 'monospace' }}>
										{FormatCurrency(item.unitPrice)}
									</TableCell>
									<TableCell align='right' sx={{ fontFamily: 'monospace' }}>
										{FormatCurrency(item.unitCost)}
									</TableCell>
									<TableCell align='right' sx={{ fontFamily: 'monospace' }}>
										{item.quantity}
									</TableCell>
									<TableCell
										align='right'
										sx={{ fontFamily: 'monospace', fontWeight: 600 }}
									>
										{FormatCurrency(item.subtotal)}
									</TableCell>
								</TableRow>
							))}

							<TableRow sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
								<TableCell colSpan={4} align='right' sx={{ fontWeight: 'bold' }}>
									{t('orders.totalCost')}:
								</TableCell>
								<TableCell
									align='right'
									sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
								>
									{FormatCurrency(order.totalCost)}
								</TableCell>
							</TableRow>

							<TableRow sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
								<TableCell colSpan={4} align='right' sx={{ fontWeight: 'bold' }}>
									{t('orders.totalAmount')}:
								</TableCell>
								<TableCell
									align='right'
									sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
								>
									{FormatCurrency(order.totalAmount)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>

				<Snackbar
					open={successMessage !== null}
					autoHideDuration={4000}
					onClose={() => setSuccessMessage(null)}
					message={successMessage}
				/>
			</Box>
		</PageContainer>
	)
}

export default OrderDetail
export { OrderDetail as Component }
