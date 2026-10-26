import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import {
	Box,
	Button,
	Chip,
	FormControl,
	Paper,
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

import OrderFindByIdApi, { OrderFindByIdOutput } from 'Api/Order/OrderFindByIdApi'

const OrderDetail: FC = () => {
	const { id } = useParams()

	const [order, setOrder] = useState<OrderFindByIdOutput | null>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../../')

			try {
				const result = await OrderFindByIdApi({ id })
				setOrder(result)
			} catch {
				await Navigate('../../')
			}
		}

		main().catch((error: unknown) => console.error('OrderDetail load error', error))
	}, [Navigate, id])

	if (order === null) return null

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
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
					<Button
						variant='outlined'
						startIcon={<ContentCopyIcon />}
						onClick={() =>
							Navigate('/order/new', {
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
							<Typography variant='body2' color='textSecondary'>
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

					{order.journalEntry ? (
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
					) : null}
				</Box>

				<TableContainer component={Paper} variant='outlined' sx={{ mb: 2 }}>
					<Table size='small'>
						<TableHead sx={{ backgroundColor: '#f8fafc' }}>
							<TableRow>
								<TableCell width='36%'>{t('orders.product')}</TableCell>
								<TableCell width='16%' align='right'>
									{t('orders.unitPrice')}
								</TableCell>
								<TableCell width='16%' align='right'>
									{t('orders.unitCost')}
								</TableCell>
								<TableCell width='16%' align='right'>
									{t('orders.quantity')}
								</TableCell>
								<TableCell width='16%' align='right'>
									{t('orders.subtotal')}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{order.items.map((item, index) => (
								<TableRow key={index}>
									<TableCell>
										<Typography variant='body2'>
											<strong>{item.product.sku}</strong> -{' '}
											{item.product.name}
										</Typography>
									</TableCell>
									<TableCell align='right'>
										<Typography
											variant='body2'
											sx={{ fontFamily: 'monospace' }}
										>
											{item.unitPrice}
										</Typography>
									</TableCell>
									<TableCell align='right'>
										<Typography
											variant='body2'
											sx={{ fontFamily: 'monospace' }}
										>
											{item.unitCost}
										</Typography>
									</TableCell>
									<TableCell align='right'>
										<Typography
											variant='body2'
											sx={{ fontFamily: 'monospace' }}
										>
											{item.quantity}
										</Typography>
									</TableCell>
									<TableCell align='right'>
										<Typography
											variant='body2'
											sx={{ fontFamily: 'monospace' }}
										>
											{item.subtotal}
										</Typography>
									</TableCell>
								</TableRow>
							))}

							<TableRow sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
								<TableCell colSpan={4} align='right'>
									<Typography variant='body2' sx={{ fontWeight: 'bold' }}>
										{t('orders.totalCost')}:
									</Typography>
								</TableCell>
								<TableCell align='right'>
									<Typography
										variant='body2'
										sx={{
											fontWeight: 'bold',
											fontFamily: 'monospace',
										}}
									>
										{order.totalCost}
									</Typography>
								</TableCell>
							</TableRow>

							<TableRow sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
								<TableCell colSpan={4} align='right'>
									<Typography variant='body2' sx={{ fontWeight: 'bold' }}>
										{t('orders.totalAmount')}:
									</Typography>
								</TableCell>
								<TableCell align='right'>
									<Typography
										variant='body2'
										sx={{
											fontWeight: 'bold',
											fontFamily: 'monospace',
										}}
									>
										{order.totalAmount}
									</Typography>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		</PageContainer>
	)
}

export default OrderDetail

export { OrderDetail as Component }
