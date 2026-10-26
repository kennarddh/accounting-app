import { FC, SubmitEvent, useCallback, useMemo, useRef, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import PriceCheckIcon from '@mui/icons-material/PriceCheck'

import {
	Alert,
	Box,
	Button,
	ButtonGroup,
	Card,
	CardContent,
	Chip,
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

import HandleApiError from 'Utils/HandleApiError'

import useKeyboardShortcuts from 'Hooks/useKeyboardShortcuts'

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

const safeDecimal = (val: string | number | null | undefined): Decimal => {
	if (!val || val === '-' || val === '.' || val === '-.') return new Decimal(0)
	try {
		return new Decimal(val)
	} catch {
		return new Decimal(0)
	}
}

const NewOrder: FC = () => {
	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [orderNumber, setOrderNumber] = useState(() => `ORD-${dayjs().format('YYYYMMDD-HHmmss')}`)
	const [date, setDate] = useState<Dayjs>(dayjs())
	const [status, setStatus] = useState<OrderStatus>(OrderStatus.Completed)
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash)
	const [cashTendered, setCashTendered] = useState<string>('')

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
	const formRef = useRef<HTMLFormElement>(null)
	const Navigate = useNavigate()
	const { t } = useTranslation()

	const handleAddItem = useCallback(() => {
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
	}, [])

	const handleRemoveItem = (index: number) => {
		if (items.length <= 1) return
		setItems(prev => prev.filter((_, i) => i !== index))
	}

	const calculateSubtotal = (quantity: string, unitPrice: string): string => {
		const qtyDec = safeDecimal(quantity)
		const priceDec = safeDecimal(unitPrice)
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
			.reduce((acc, item) => acc.plus(safeDecimal(item.subtotal)), new Decimal(0))
			.toDecimalPlaces(4)
			.toString()
	}, [items])

	const changeDue = useMemo(() => {
		const tendered = safeDecimal(cashTendered)
		const total = safeDecimal(totalAmount)
		return tendered.minus(total)
	}, [cashTendered, totalAmount])

	const canSubmit = useMemo(() => {
		const validItems =
			items.length > 0 &&
			items.every(item => item.productId && safeDecimal(item.quantity).greaterThan(0))

		const validCash =
			paymentMethod !== PaymentMethod.Cash ||
			safeDecimal(cashTendered).greaterThanOrEqualTo(safeDecimal(totalAmount))

		return !orderNumber.trim() || !validItems || !validCash
	}, [cashTendered, items, orderNumber, paymentMethod, totalAmount])

	const OnSubmit = useCallback(
		(event?: SubmitEvent<HTMLFormElement>) => {
			if (event) event.preventDefault()
			if (canSubmit || isPending) return

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
		[Navigate, canSubmit, date, isPending, items, orderNumber, paymentMethod, status],
	)

	useKeyboardShortcuts({
		onSave: () => OnSubmit(),
		onNew: handleAddItem,
		onCancel: () => Navigate('../'),
	})

	const addDenomination = (amount: number) => {
		const current = safeDecimal(cashTendered)
		setCashTendered(current.plus(amount).toString())
	}

	return (
		<PageContainer title={t('orders.new.title')}>
			<Box
				ref={formRef}
				component='form'
				noValidate
				onSubmit={OnSubmit}
				sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
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

				<TableContainer component={Paper} variant='outlined' sx={{ mb: 1 }}>
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
							{items.map((item, index) => {
								const stockVal = parseFloat(item.currentStock || '0')
								const isOutOfStock = stockVal <= 0
								const isLow = stockVal <= 5

								return (
									<TableRow key={item.id}>
										<TableCell>
											<SelectProduct
												value={item.productId}
												onChange={val =>
													void handleProductChange(index, val)
												}
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
											<Chip
												label={
													isOutOfStock
														? t('stockStatus.outOfStock', {
																count: stockVal,
															})
														: isLow
															? t('stockStatus.lowStock', {
																	count: stockVal,
																})
															: t('stockStatus.inStock', {
																	count: stockVal,
																})
												}
												size='small'
												color={
													isOutOfStock
														? 'error'
														: isLow
															? 'warning'
															: 'default'
												}
												variant='outlined'
											/>
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
								)
							})}

							<TableRow sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
								<TableCell colSpan={4} align='right'>
									<Typography variant='body2' sx={{ fontWeight: 'bold' }}>
										{t('orders.totals')}:
									</Typography>
								</TableCell>
								<TableCell align='right'>
									<Typography
										variant='h6'
										sx={{ fontWeight: 'bold', fontFamily: 'monospace', pr: 1 }}
									>
										{t('common.currency', { value: Number(totalAmount) })}
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
						{t('orders.addItem')}{' '}
						<Typography variant='caption' sx={{ ml: 1, opacity: 0.7 }}>
							(Ctrl+N)
						</Typography>
					</Button>
				</Box>

				{paymentMethod === PaymentMethod.Cash && (
					<Card variant='outlined' sx={{ bgcolor: '#fafafa', p: 1 }}>
						<CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<PriceCheckIcon color='primary' />
								<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
									{t('cashCalculator.title')}
								</Typography>
							</Box>

							<Box
								sx={{
									display: 'flex',
									gap: 3,
									alignItems: 'center',
									flexWrap: 'wrap',
								}}
							>
								<Box sx={{ width: 250 }}>
									<MuiMoneyInput
										label={t('cashCalculator.cashTendered')}
										value={cashTendered}
										onChange={setCashTendered}
										prefix='Rp '
										size='medium'
										fullWidth
										required
									/>
								</Box>

								<ButtonGroup size='medium' variant='outlined'>
									<Button onClick={() => setCashTendered(totalAmount)}>
										{t('cashCalculator.exact')}
									</Button>
									<Button onClick={() => addDenomination(10000)}>
										{t('cashCalculator.add10k')}
									</Button>
									<Button onClick={() => addDenomination(20000)}>
										{t('cashCalculator.add20k')}
									</Button>
									<Button onClick={() => addDenomination(50000)}>
										{t('cashCalculator.add50k')}
									</Button>
									<Button onClick={() => addDenomination(100000)}>
										{t('cashCalculator.add100k')}
									</Button>
								</ButtonGroup>

								<Box sx={{ ml: 'auto', textAlign: 'right' }}>
									<Typography variant='caption' color='textSecondary'>
										{t('cashCalculator.changeDue')}:
									</Typography>
									<Typography
										variant='h5'
										sx={{
											fontWeight: 700,
											fontFamily: 'monospace',
											color: changeDue.isNegative()
												? 'error.main'
												: 'success.main',
										}}
									>
										{changeDue.isNegative()
											? `- ${t('common.currency', { value: Math.abs(changeDue.toNumber()) })}`
											: t('common.currency', { value: changeDue.toNumber() })}
									</Typography>
								</Box>
							</Box>
						</CardContent>
					</Card>
				)}

				<Button
					type='submit'
					variant='contained'
					size='large'
					fullWidth
					loading={isPending}
					disabled={canSubmit}
					sx={{ mt: 1 }}
				>
					{t('common.submit')} (Ctrl+S)
				</Button>
			</Box>
		</PageContainer>
	)
}

export default NewOrder

export { NewOrder as Component }
