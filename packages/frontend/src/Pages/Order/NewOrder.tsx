import { FC, SubmitEvent, useCallback, useMemo, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import {
	Alert,
	Box,
	Button,
	FormControl,
	IconButton,
	MenuItem,
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

import { OrderStatus, PaymentMethod } from '@accounting-app/common'
import dayjs, { Dayjs } from 'dayjs'
import { Decimal } from 'decimal.js'
import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'
import SelectProduct from 'Components/SelectResources/SelectProduct'

import { safeDecimal } from 'Utils/DecimalUtils'
import HandleApiError from 'Utils/HandleApiError'

import OrderCreateApi from 'Api/Order/OrderCreateApi'
import ProductFindByIdApi from 'Api/Product/ProductFindByIdApi'

interface OrderItemRow {
	id: string
	productId: string | null
	unitPrice: string
	currentStock: string
	quantity: string
	subtotal: string
}

const NewOrder: FC = () => {
	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [orderNumber, setOrderNumber] = useState(() => `ORD-${dayjs().format('YYYYMMDD-HHmmss')}`)
	const [date, setDate] = useState<Dayjs>(dayjs())
	const [status, setStatus] = useState<OrderStatus>(OrderStatus.Completed)
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash)

	const [items, setItems] = useState<OrderItemRow[]>([
		{
			id: '1',
			productId: null,
			unitPrice: '0',
			currentStock: '0',
			quantity: '1',
			subtotal: '0',
		},
	])

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const handleAddItem = () => {
		setItems(prev => [
			...prev,
			{
				id: crypto.randomUUID(),
				productId: null,
				unitPrice: '0',
				currentStock: '0',
				quantity: '1',
				subtotal: '0',
			},
		])
	}

	const handleRemoveItem = (index: number) => {
		if (items.length <= 1) return
		setItems(prev => prev.filter((_, i) => i !== index))
	}

	const calculateSubtotal = (quantity: string, unitPrice: string): string => {
		const qtyDec = safeDecimal(quantity || '0')
		const priceDec = safeDecimal(unitPrice || '0')
		return qtyDec.times(priceDec).toDecimalPlaces(4).toString()
	}

	const handleProductChange = async (index: number, productId: string | null) => {
		let defaultPrice = '0'
		let stock = '0'

		if (productId) {
			try {
				const product = await ProductFindByIdApi({ id: productId })
				defaultPrice = product.price
				stock = product.currentStock
			} catch (error) {
				console.error('Failed to load product details:', error)
			}
		}

		setItems(prev => {
			const updated = [...prev]
			const current = updated[index]
			if (current) {
				const newSubtotal = calculateSubtotal(current.quantity, defaultPrice)
				updated[index] = {
					...current,
					productId,
					unitPrice: defaultPrice,
					currentStock: stock,
					subtotal: newSubtotal,
				}
			}
			return updated
		})
	}

	const handleQuantityChange = (index: number, quantity: string) => {
		setItems(prev => {
			const updated = [...prev]
			const current = updated[index]
			if (current) {
				updated[index] = {
					...current,
					quantity,
					subtotal: calculateSubtotal(quantity, current.unitPrice),
				}
			}
			return updated
		})
	}

	const totalAmount = useMemo(() => {
		return items
			.reduce((acc, item) => acc.plus(safeDecimal(item.subtotal || '0')), new Decimal(0))
			.toDecimalPlaces(4)
			.toString()
	}, [items])

	const canSubmit = useMemo(() => {
		return (
			!orderNumber.trim() ||
			items.length === 0 ||
			items.some(item => {
				if (!item.productId) return true
				const qty = safeDecimal(item.quantity)
				// Disallow submitting if quantity is 0 or still in incomplete '-' state
				return qty.isZero() || item.quantity === '-' || item.quantity === '.'
			})
		)
	}, [items, orderNumber])

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			startTransition(async () => {
				try {
					await OrderCreateApi({
						orderNumber,
						date: date.toISOString(),
						status,
						paymentMethod,
						items: items.map(item => ({
							productId: item.productId ?? '',
							quantity: item.quantity || '0',
						})),
					})

					await Navigate('../')
				} catch (thrownError) {
					SetErrorText(HandleApiError(thrownError))
				}
			})
		},
		[Navigate, date, items, orderNumber, paymentMethod, status],
	)

	return (
		<PageContainer title={t('orders.new.title')}>
			<Box
				component='form'
				noValidate
				onSubmit={OnSubmit}
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				{ErrorText !== null ? (
					<Alert severity='error' sx={{ width: '100%', whiteSpace: 'pre-line' }}>
						{ErrorText}
					</Alert>
				) : null}

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 1, minWidth: 250 }}>
						<TextField
							value={orderNumber}
							onChange={event => setOrderNumber(event.target.value)}
							label={t('orders.orderNumber')}
							variant='outlined'
							required
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							select
							value={status}
							onChange={event => setStatus(event.target.value as OrderStatus)}
							label={t('orders.status')}
							variant='outlined'
							required
						>
							{Object.values(OrderStatus).map(st => (
								<MenuItem key={st} value={st}>
									{t(`orders.enum.status.${st}`)}
								</MenuItem>
							))}
						</TextField>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							select
							value={paymentMethod}
							onChange={event =>
								setPaymentMethod(event.target.value as PaymentMethod)
							}
							label={t('orders.paymentMethod')}
							variant='outlined'
							required
						>
							{Object.values(PaymentMethod).map(pm => (
								<MenuItem key={pm} value={pm}>
									{t(`orders.enum.paymentMethod.${pm}`)}
								</MenuItem>
							))}
						</TextField>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 250 }}>
						<DateTimePicker
							label={t('orders.date')}
							value={date}
							onChange={newValue => newValue && setDate(newValue)}
							ampm={false}
						/>
					</FormControl>
				</Box>

				<TableContainer component={Paper} variant='outlined' sx={{ mb: 2 }}>
					<Table size='small'>
						<TableHead sx={{ backgroundColor: '#f8fafc' }}>
							<TableRow>
								<TableCell width='36%'>{t('orders.product')}</TableCell>
								<TableCell width='16%' align='right'>
									{t('products.currentStock')}
								</TableCell>
								<TableCell width='16%' align='right'>
									{t('orders.unitPrice')}
								</TableCell>
								<TableCell width='16%' align='right'>
									{t('orders.quantity')}
								</TableCell>
								<TableCell width='16%' align='right'>
									{t('orders.subtotal')}
								</TableCell>
								<TableCell width='4%' align='center' />
							</TableRow>
						</TableHead>
						<TableBody>
							{items.map((item, index) => (
								<TableRow key={item.id}>
									<TableCell>
										<SelectProduct
											value={item.productId}
											onChange={val => void handleProductChange(index, val)}
											onError={SetErrorText}
											slotProps={{
												button: {
													size: 'small',
													sx: { minHeight: 40, py: 0.5 },
												},
											}}
										/>
									</TableCell>

									<TableCell align='right'>
										<Typography
											variant='body2'
											sx={{ fontFamily: 'monospace', pr: 1 }}
										>
											{item.currentStock}
										</Typography>
									</TableCell>

									<TableCell align='right'>
										<Typography
											variant='body2'
											sx={{ fontFamily: 'monospace', pr: 1 }}
										>
											{item.unitPrice}
										</Typography>
									</TableCell>

									<TableCell align='right'>
										<MuiMoneyInput
											size='small'
											value={item.quantity}
											onChange={val => handleQuantityChange(index, val)}
										/>
									</TableCell>

									<TableCell align='right'>
										<Typography
											variant='body2'
											sx={{
												fontFamily: 'monospace',
												fontWeight: 'bold',
												pr: 1,
											}}
										>
											{item.subtotal}
										</Typography>
									</TableCell>

									<TableCell align='center'>
										<IconButton
											size='small'
											disabled={items.length <= 1}
											onClick={() => handleRemoveItem(index)}
										>
											<DeleteOutlinedIcon fontSize='small' />
										</IconButton>
									</TableCell>
								</TableRow>
							))}

							<TableRow sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
								<TableCell colSpan={4} align='right'>
									<Typography variant='body2' sx={{ fontWeight: 'bold' }}>
										{t('orders.totals')}:
									</Typography>
								</TableCell>
								<TableCell align='right'>
									<Typography
										variant='body2'
										sx={{
											fontWeight: 'bold',
											fontFamily: 'monospace',
											pr: 1,
										}}
									>
										{totalAmount}
									</Typography>
								</TableCell>
								<TableCell />
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>

				<Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
					<Button
						startIcon={<AddIcon />}
						variant='outlined'
						size='small'
						onClick={handleAddItem}
					>
						{t('orders.addItem')}
					</Button>
				</Box>

				<Button
					type='submit'
					variant='outlined'
					fullWidth
					loading={isPending}
					disabled={canSubmit}
				>
					{t('common.submit')}
				</Button>
			</Box>
		</PageContainer>
	)
}

export default NewOrder

export { NewOrder as Component }
