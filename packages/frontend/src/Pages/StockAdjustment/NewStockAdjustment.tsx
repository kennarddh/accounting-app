import { FC, SubmitEvent, useCallback, useMemo, useRef, useState, useTransition } from 'react'

import { useLocation, useNavigate } from 'react-router'

import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'

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
import dayjs, { Dayjs } from 'dayjs'
import { Decimal } from 'decimal.js'
import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'
import SelectProduct from 'Components/SelectResources/SelectProduct'

import { safeDecimal } from 'Utils/DecimalUtils'
import HandleApiError from 'Utils/HandleApiError'

import ProductFindByIdApi from 'Api/Product/ProductFindByIdApi'
import ProductFindManyApi from 'Api/Product/ProductFindManyApi'
import StockAdjustmentCreateApi from 'Api/StockAdjustment/StockAdjustmentCreateApi'

interface AdjustmentItemRow {
	id: string
	productId: string | null
	quantity: string
	unitCost: string
	subtotalCost: string
}

export interface DuplicateAdjustmentItemPayload {
	productId: string
	quantity: string
	unitCost: string
	subtotalCost: string
}

export interface DuplicateAdjustmentLocationState {
	duplicateFromAdjustment?: {
		type: StockAdjustmentType
		reason: string
		items: DuplicateAdjustmentItemPayload[]
	}
}

interface AdjustmentItemRow {
	id: string
	productId: string | null
	quantity: string
	unitCost: string
	subtotalCost: string
}

// Helper to parse standard CSV text (handles commas, trims whitespace)
const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
	const lines = text.split(/\r\n|\n/).filter(line => line.trim())
	if (lines.length < 2) return { headers: [], rows: [] }

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''))
	const rows: Record<string, string>[] = []

	for (let i = 1; i < lines.length; i++) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const values = lines[i]!.split(',').map(v => v.trim().replace(/['"]+/g, ''))
		if (values.length === headers.length) {
			const row: Record<string, string> = {}
			headers.forEach((h, idx) => {
				row[h] = values[idx] ?? ''
			})
			rows.push(row)
		}
	}
	return { headers, rows }
}

const NewStockAdjustment: FC = () => {
	const location = useLocation()
	const locationState = location.state as DuplicateAdjustmentLocationState | null
	const duplicateData = locationState?.duplicateFromAdjustment

	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [adjustmentNumber, setAdjustmentNumber] = useState(
		() => `ADJ-${dayjs().format('YYYYMMDD-HHmmss')}`,
	)
	const [date, setDate] = useState<Dayjs>(dayjs())

	const [type, setType] = useState<StockAdjustmentType>(
		() => duplicateData?.type ?? StockAdjustmentType.Correction,
	)
	const [reason, setReason] = useState<string>(() => duplicateData?.reason ?? '')

	const [items, setItems] = useState<AdjustmentItemRow[]>(() => {
		if (duplicateData?.items && duplicateData.items.length > 0) {
			return duplicateData.items.map(
				(item: DuplicateAdjustmentItemPayload): AdjustmentItemRow => ({
					id: crypto.randomUUID(),
					productId: item.productId,
					quantity: item.quantity,
					unitCost: item.unitCost,
					subtotalCost: item.subtotalCost,
				}),
			)
		}
		return [{ id: '1', productId: null, quantity: '1', unitCost: '0', subtotalCost: '0' }]
	})

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const fileInputRef = useRef<HTMLInputElement>(null)

	// Downloads a clean template CSV for stock counting
	const handleDownloadTemplate = () => {
		const csvContent =
			'data:text/csv;charset=utf-8,sku,quantity,unitCost\nBEV-001,5,8000\nBAK-001,-2,11000\n'
		const encodedUri = encodeURI(csvContent)
		const link = document.createElement('a')
		link.setAttribute('href', encodedUri)
		link.setAttribute('download', 'stock_count_template.csv')
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	// Handles parsing uploaded CSV and resolving SKUs against the product database
	const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		try {
			const text = await file.text()
			const { headers, rows } = parseCSV(text)

			if (!headers.includes('sku') || !headers.includes('quantity')) {
				SetErrorText(t('stockAdjustments.bulkImport.invalidColumns'))
				return
			}

			// Load products to match SKUs to product IDs & default costs
			const productsRes = await ProductFindManyApi({ pagination: { limit: 100 } })
			const skuMap = new Map(productsRes.list.map(p => [p.sku.toLowerCase(), p]))

			const importedItems: AdjustmentItemRow[] = []

			for (const row of rows) {
				const sku = (row.sku ?? '').toLowerCase()
				const qty = row.quantity ?? '0'
				const product = skuMap.get(sku)

				if (product) {
					const unitCost = row.unitcost ?? product.costPrice
					const subtotal = calculateSubtotal(qty, unitCost)

					importedItems.push({
						id: crypto.randomUUID(),
						productId: product.id,
						quantity: qty,
						unitCost,
						subtotalCost: subtotal,
					})
				}
			}

			if (importedItems.length === 0) {
				SetErrorText(t('stockAdjustments.bulkImport.noMatchingProducts'))
				return
			}

			setItems(importedItems)
			SetErrorText(null)
		} catch {
			SetErrorText(t('stockAdjustments.bulkImport.parsingError'))
		} finally {
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

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
		const qtyDec = safeDecimal(quantity || '0')
		const costDec = safeDecimal(unitCost || '0')
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
			.reduce((acc, item) => acc.plus(safeDecimal(item.subtotalCost)), new Decimal(0))
			.toDecimalPlaces(4)
			.toString()
	}, [items])

	const canSubmit = useMemo(() => {
		return (
			!reason.trim() ||
			items.length === 0 ||
			items.some(item => {
				if (!item.productId) return true
				const qty = safeDecimal(item.quantity)
				// Disallow submitting if quantity is 0 or still in incomplete '-' state
				return qty.isZero() || item.quantity === '-' || item.quantity === '.'
			})
		)
	}, [items, reason])

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			startTransition(async () => {
				try {
					await StockAdjustmentCreateApi({
						adjustmentNumber,
						date: date.toISOString(),
						type,
						reason,
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
		[Navigate, adjustmentNumber, date, items, reason, type],
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

				<Box
					sx={{
						display: 'flex',
						gap: 1,
						mb: 1.5,
						alignItems: 'center',
						flexWrap: 'wrap',
					}}
				>
					{/* Hidden native input */}
					<input
						type='file'
						accept='.csv'
						ref={fileInputRef}
						style={{ display: 'none' }}
						onChange={handleCSVUpload}
					/>

					<Button
						startIcon={<AddIcon />}
						variant='outlined'
						size='small'
						onClick={handleAddItem}
					>
						{t('stockAdjustments.addItem')}
					</Button>

					<Button
						startIcon={<UploadFileIcon />}
						variant='outlined'
						color='secondary'
						size='small'
						onClick={() => fileInputRef.current?.click()}
					>
						{t('stockAdjustments.bulkImport.uploadCountSheet')}
					</Button>

					<Button
						startIcon={<DownloadIcon />}
						variant='text'
						size='small'
						onClick={handleDownloadTemplate}
					>
						{t('stockAdjustments.bulkImport.downloadTemplate')}
					</Button>
				</Box>

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
											allowNegative={type === StockAdjustmentType.Correction}
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
