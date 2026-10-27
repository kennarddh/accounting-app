import {
	FC,
	SubmitEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from 'react'

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
	InputLabel,
	MenuItem,
	Paper,
	Select,
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
import Papa from 'papaparse'
import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'
import SelectProduct from 'Components/SelectResources/SelectProduct'

import FormatCurrency from 'Utils/FormatCurrency'
import HandleApiError from 'Utils/HandleApiError'

import ProductFindLookupApi from 'Api/Product/ProductFindLookupApi'
import StockAdjustmentCreateApi from 'Api/StockAdjustment/StockAdjustmentCreateApi'
import SupplierFindManyApi, { SupplierFindManySingleOutput } from 'Api/Supplier/SupplierFindManyApi'

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
		supplierId?: string
		items: DuplicateAdjustmentItemPayload[]
	}
}

interface CSVStockRow {
	sku?: string
	quantity?: string
	unitcost?: string
}

const safeDecimal = (val: string | number | null | undefined): Decimal => {
	if (!val || val === '-' || val === '.' || val === '-.') return new Decimal(0)
	try {
		return new Decimal(val)
	} catch {
		return new Decimal(0)
	}
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
	const [supplierId, setSupplierId] = useState<string>(() => duplicateData?.supplierId ?? '')
	const [suppliers, setSuppliers] = useState<SupplierFindManySingleOutput[]>([])

	const [items, setItems] = useState<AdjustmentItemRow[]>(() => {
		if (duplicateData?.items && duplicateData.items.length > 0) {
			return duplicateData.items.map((item: DuplicateAdjustmentItemPayload) => ({
				id: crypto.randomUUID(),
				productId: item.productId,
				quantity: item.quantity,
				unitCost: item.unitCost,
				subtotalCost: item.subtotalCost,
			}))
		}
		return [{ id: '1', productId: null, quantity: '1', unitCost: '0', subtotalCost: '0' }]
	})

	const [isPending, startTransition] = useTransition()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const navigate = useNavigate()
	const { t } = useTranslation()

	// Load active suppliers for Restock picker
	useEffect(() => {
		const loadSuppliers = async () => {
			try {
				const res = await SupplierFindManyApi({ pagination: { limit: 100 } })
				setSuppliers(res.list)
			} catch (err) {
				console.error('Failed to load suppliers:', err)
			}
		}
		void loadSuppliers()
	}, [])

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
		const qtyDec = safeDecimal(quantity)
		const costDec = safeDecimal(unitCost)
		// Subtotal cost is always positive monetary value (abs(qty) * unitCost)
		return qtyDec.abs().times(costDec).toDecimalPlaces(4).toString()
	}

	const handleProductChange = async (index: number, productId: string | null) => {
		let defaultCost = '0'
		if (productId) {
			try {
				const products = await ProductFindLookupApi()
				const p = products.find(prod => prod.id === productId)
				if (p) defaultCost = p.costPrice
			} catch (err) {
				console.error('Failed to load product cost:', err)
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

	// Gross adjusted cost matches backend: totalGainCost + totalLossCost
	const totalCost = useMemo(() => {
		return items
			.reduce((acc, item) => acc.plus(safeDecimal(item.subtotalCost).abs()), new Decimal(0))
			.toDecimalPlaces(4)
			.toString()
	}, [items])

	const canSubmit = useMemo(() => {
		return (
			!reason.trim() ||
			items.length === 0 ||
			items.some(item => !item.productId || safeDecimal(item.quantity).isZero())
		)
	}, [items, reason])

	// --- RESTORED CSV IMPORT & TEMPLATE DOWNLOAD ---
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

	const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		Papa.parse<CSVStockRow>(file, {
			beforeFirstChunk: chunk => chunk.replace(/^\uFEFF/, ''),
			header: true,
			skipEmptyLines: 'greedy',
			transformHeader: header => header.trim().toLowerCase().replace(/['"]+/g, ''),
			complete: async results => {
				const rows = results.data

				if (rows.length === 0) {
					SetErrorText(t('stockAdjustments.bulkImport.noMatchingProducts'))
					return
				}

				const firstRow = rows[0]
				if (firstRow?.sku === undefined || firstRow.quantity === undefined) {
					SetErrorText(t('stockAdjustments.bulkImport.invalidColumns'))
					return
				}

				try {
					const products = await ProductFindLookupApi()
					const skuMap = new Map(products.map(p => [p.sku.toLowerCase(), p]))

					const importedItems: AdjustmentItemRow[] = []

					for (const row of rows) {
						const rawSku = (row.sku ?? '').trim().toLowerCase()
						const rawQty = (row.quantity ?? '0').trim()
						const product = skuMap.get(rawSku)

						if (product) {
							const unitCost = (row.unitcost ?? '').trim() || product.costPrice
							const subtotal = calculateSubtotal(rawQty, unitCost)

							importedItems.push({
								id: crypto.randomUUID(),
								productId: product.id,
								quantity: rawQty,
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
				} catch (err) {
					SetErrorText(HandleApiError(err))
				} finally {
					if (fileInputRef.current) fileInputRef.current.value = ''
				}
			},
			error: () => {
				SetErrorText(t('stockAdjustments.bulkImport.parsingError'))
				if (fileInputRef.current) fileInputRef.current.value = ''
			},
		})
	}
	// ------------------------------------------------

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
						supplierId:
							type === StockAdjustmentType.Restock && supplierId
								? supplierId
								: undefined,
						items: items.map(item => ({
							productId: item.productId ?? '',
							quantity: item.quantity || '0',
							unitCost: item.unitCost || '0',
						})),
					})

					await navigate('../')
				} catch (err) {
					SetErrorText(HandleApiError(err))
				}
			})
		},
		[adjustmentNumber, date, items, navigate, reason, supplierId, type],
	)

	return (
		<PageContainer title={t('stockAdjustments.new.title')}>
			<Box
				component='form'
				noValidate
				onSubmit={OnSubmit}
				sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
			>
				{ErrorText !== null && (
					<Alert severity='error' sx={{ width: '100%', whiteSpace: 'pre-line' }}>
						{ErrorText}
					</Alert>
				)}

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 1, minWidth: 240 }}>
						<TextField
							value={adjustmentNumber}
							onChange={e => setAdjustmentNumber(e.target.value)}
							label={t('stockAdjustments.adjustmentNumber')}
							variant='outlined'
							required
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							select
							value={type}
							onChange={e => setType(e.target.value as StockAdjustmentType)}
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

					{/* Conditionally rendered Supplier Dropdown for Restocks */}
					{type === StockAdjustmentType.Restock && (
						<FormControl sx={{ flex: 1.5, minWidth: 240 }}>
							<InputLabel id='supplier-select-label'>
								{t('stockAdjustments.supplier')}
							</InputLabel>
							<Select
								labelId='supplier-select-label'
								label={t('stockAdjustments.supplier')}
								value={supplierId}
								onChange={e => setSupplierId(e.target.value)}
							>
								<MenuItem value=''>
									<em>{t('stockAdjustments.noSupplier')}</em>
								</MenuItem>
								{suppliers.map(s => (
									<MenuItem key={s.id} value={s.id}>
										{s.code} - {s.name} {s.terms ? `(${s.terms})` : ''}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}

					<FormControl sx={{ flex: 1, minWidth: 240 }}>
						<DateTimePicker
							label={t('stockAdjustments.date')}
							value={date}
							onChange={val => val && setDate(val)}
							ampm={false}
						/>
					</FormControl>
				</Box>

				<FormControl fullWidth>
					<TextField
						value={reason}
						onChange={e => setReason(e.target.value)}
						label={t('stockAdjustments.reason')}
						variant='outlined'
						required
					/>
				</FormControl>

				{/* CSV Toolbar */}
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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

				{/* Line Items Table */}
				<TableContainer component={Paper} variant='outlined' sx={{ mb: 1 }}>
					<Table size='small'>
						<TableHead sx={{ backgroundColor: '#f8fafc' }}>
							<TableRow>
								<TableCell width='40%' sx={{ fontWeight: 600 }}>
									{t('stockAdjustments.product')}
								</TableCell>
								<TableCell width='18%' align='right' sx={{ fontWeight: 600 }}>
									{t('stockAdjustments.quantity')}
								</TableCell>
								<TableCell width='20%' align='right' sx={{ fontWeight: 600 }}>
									{t('stockAdjustments.unitCost')}
								</TableCell>
								<TableCell width='18%' align='right' sx={{ fontWeight: 600 }}>
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
											{FormatCurrency(item.subtotalCost)}
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
									<Typography variant='body2' sx={{ fontWeight: 600 }}>
										{t('stockAdjustments.totals')}:
									</Typography>
								</TableCell>
								<TableCell align='right'>
									<Typography
										variant='body2'
										sx={{ fontWeight: 700, fontFamily: 'monospace', pr: 1 }}
									>
										{FormatCurrency(totalCost)}
									</Typography>
								</TableCell>
								<TableCell />
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>

				<Box sx={{ display: 'flex', gap: 1 }}>
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
					variant='contained'
					size='large'
					fullWidth
					loading={isPending}
					disabled={canSubmit}
					sx={{ mt: 1 }}
				>
					{t('common.submit')}
				</Button>
			</Box>
		</PageContainer>
	)
}

export default NewStockAdjustment
export { NewStockAdjustment as Component }
