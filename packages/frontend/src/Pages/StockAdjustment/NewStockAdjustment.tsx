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

import { StockAdjustmentType } from '@accounting-app/common'
import useAuthStore from 'Stores/AuthStore'
import dayjs, { Dayjs } from 'dayjs'
import { Decimal } from 'decimal.js'
import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'
import SelectProduct from 'Components/SelectResources/SelectProduct'

import HandleApiError from 'Utils/HandleApiError'

import ProductFindByIdApi from 'Api/Product/ProductFindByIdApi'
import StockAdjustmentCreateApi from 'Api/StockAdjustment/StockAdjustmentCreateApi'

interface AdjustmentItemRow {
	id: string
	productId: string | null
	quantity: string
	unitCost: string
	subtotalCost: string
}

const NewStockAdjustment: FC = () => {
	const user = useAuthStore(state => state.user)

	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [adjustmentNumber, setAdjustmentNumber] = useState(
		() => `ADJ-${dayjs().format('YYYYMMDD-HHmmss')}`,
	)
	const [date, setDate] = useState<Dayjs>(dayjs())
	const [type, setType] = useState<StockAdjustmentType>(StockAdjustmentType.Correction)
	const [reason, setReason] = useState('')

	const [items, setItems] = useState<AdjustmentItemRow[]>([
		{ id: '1', productId: null, quantity: '1', unitCost: '0', subtotalCost: '0' },
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
				quantity: '1',
				unitCost: '0',
				subtotalCost: '0',
			},
		])
	}

	const handleRemoveItem = (index: number) => {
		if (items.length <= 1) return
		setItems(prev => prev.filter((_, i) => i !== index))
	}

	const calculateSubtotal = (quantity: string, unitCost: string): string => {
		const qtyDec = new Decimal(quantity || '0')
		const costDec = new Decimal(unitCost || '0')
		return qtyDec.times(costDec).toDecimalPlaces(4).toString()
	}

	const handleProductChange = async (index: number, productId: string | null) => {
		let defaultCost = '0'
		if (productId) {
			try {
				const product = await ProductFindByIdApi({ id: productId })
				defaultCost = product.costPrice
			} catch (error) {
				console.error('Failed to load product cost:', error)
			}
		}

		setItems(prev => {
			const updated = [...prev]
			const current = updated[index]
			if (current) {
				const newUnitCost = defaultCost !== '0' ? defaultCost : current.unitCost
				const newSubtotal = calculateSubtotal(current.quantity, newUnitCost)
				updated[index] = {
					...current,
					productId,
					unitCost: newUnitCost,
					subtotalCost: newSubtotal,
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
					subtotalCost: calculateSubtotal(quantity, current.unitCost),
				}
			}
			return updated
		})
	}

	const handleUnitCostChange = (index: number, unitCost: string) => {
		setItems(prev => {
			const updated = [...prev]
			const current = updated[index]
			if (current) {
				updated[index] = {
					...current,
					unitCost,
					subtotalCost: calculateSubtotal(current.quantity, unitCost),
				}
			}
			return updated
		})
	}

	const totalCost = useMemo(() => {
		return items
			.reduce((acc, item) => acc.plus(item.subtotalCost || '0'), new Decimal(0))
			.toDecimalPlaces(4)
			.toString()
	}, [items])

	const canSubmit = useMemo(() => {
		return (
			!reason.trim() ||
			items.length === 0 ||
			items.some(item => !item.productId || new Decimal(item.quantity || 0).isZero())
		)
	}, [items, reason])

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			if (!user) return

			startTransition(async () => {
				try {
					// Backend validates date >= new Date(), ensure time is not in the past
					const submissionDate = new Date(
						Math.max(Date.now() + 2000, date.valueOf()),
					).toISOString()

					await StockAdjustmentCreateApi({
						adjustmentNumber,
						date: submissionDate,
						type,
						reason,
						totalCost,
						createdById: user.id,
						items: items.map(item => ({
							productId: item.productId ?? '',
							quantity: item.quantity || '0',
							unitCost: item.unitCost || '0',
							subtotalCost: item.subtotalCost || '0',
						})),
					})

					await Navigate('../')
				} catch (thrownError) {
					SetErrorText(HandleApiError(thrownError))
				}
			})
		},
		[Navigate, adjustmentNumber, date, items, reason, totalCost, type, user],
	)

	return (
		<PageContainer title={t('stockAdjustments.new.title')}>
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
							value={adjustmentNumber}
							onChange={event => setAdjustmentNumber(event.target.value)}
							label={t('stockAdjustments.adjustmentNumber')}
							variant='outlined'
							required
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							select
							value={type}
							onChange={event => setType(event.target.value as StockAdjustmentType)}
							label={t('stockAdjustments.type')}
							variant='outlined'
							required
						>
							{Object.values(StockAdjustmentType).map(tVal => (
								<MenuItem key={tVal} value={tVal}>
									{t(`stockAdjustments.enum.type.${tVal}`)}
								</MenuItem>
							))}
						</TextField>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 250 }}>
						<DateTimePicker
							label={t('stockAdjustments.date')}
							value={date}
							onChange={newValue => newValue && setDate(newValue)}
							ampm={false}
						/>
					</FormControl>
				</Box>

				<FormControl fullWidth>
					<TextField
						value={reason}
						onChange={event => setReason(event.target.value)}
						label={t('stockAdjustments.reason')}
						variant='outlined'
						required
					/>
				</FormControl>

				<TableContainer component={Paper} variant='outlined' sx={{ mb: 2 }}>
					<Table size='small'>
						<TableHead sx={{ backgroundColor: '#f8fafc' }}>
							<TableRow>
								<TableCell width='40%'>{t('stockAdjustments.product')}</TableCell>
								<TableCell width='18%' align='right'>
									{t('stockAdjustments.quantity')}
								</TableCell>
								<TableCell width='20%' align='right'>
									{t('stockAdjustments.unitCost')}
								</TableCell>
								<TableCell width='18%' align='right'>
									{t('stockAdjustments.subtotalCost')}
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
										<MuiMoneyInput
											size='small'
											value={item.quantity}
											onChange={val => handleQuantityChange(index, val)}
										/>
									</TableCell>

									<TableCell align='right'>
										<MuiMoneyInput
											size='small'
											value={item.unitCost}
											onChange={val => handleUnitCostChange(index, val)}
										/>
									</TableCell>

									<TableCell align='right'>
										<Typography
											variant='body2'
											sx={{ fontFamily: 'monospace', pr: 1 }}
										>
											{item.subtotalCost}
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
								<TableCell colSpan={3} align='right'>
									<Typography variant='body2' sx={{ fontWeight: 'bold' }}>
										{t('stockAdjustments.totals')}:
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
										{totalCost}
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
						{t('stockAdjustments.addItem')}
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

export default NewStockAdjustment

export { NewStockAdjustment as Component }
