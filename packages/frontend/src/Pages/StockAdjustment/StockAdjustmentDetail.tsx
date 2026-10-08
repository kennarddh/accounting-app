import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import {
	Box,
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

import { StockAdjustmentType } from '@accounting-app/common'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import StockAdjustmentFindByIdApi, {
	StockAdjustmentFindByIdOutput,
} from 'Api/StockAdjustment/StockAdjustmentFindByIdApi'

const StockAdjustmentDetail: FC = () => {
	const { id } = useParams()

	const [adjustment, setAdjustment] = useState<StockAdjustmentFindByIdOutput | null>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../../')

			try {
				const result = await StockAdjustmentFindByIdApi({ id })
				setAdjustment(result)
			} catch {
				await Navigate('../../')
			}
		}

		main().catch((error: unknown) => console.error('StockAdjustmentDetail load error', error))
	}, [Navigate, id])

	if (adjustment === null) return null

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
		<PageContainer title={t('stockAdjustments.detail.title')}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 1, minWidth: 250 }}>
						<TextField
							value={adjustment.adjustmentNumber}
							label={t('stockAdjustments.adjustmentNumber')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200, justifyContent: 'center' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Typography variant='body2' color='textSecondary'>
								{t('stockAdjustments.type')}:
							</Typography>
							<Chip
								label={t(`stockAdjustments.enum.type.${adjustment.type}`)}
								color={getTypeChipColor(adjustment.type)}
								size='medium'
							/>
						</Box>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 250 }}>
						<DateTimePicker
							label={t('stockAdjustments.date')}
							defaultValue={dayjs(adjustment.date)}
							ampm={false}
							readOnly
						/>
					</FormControl>
				</Box>

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 2, minWidth: 250 }}>
						<TextField
							value={adjustment.reason}
							label={t('stockAdjustments.reason')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							value={adjustment.createdBy.name}
							label={t('stockAdjustments.createdBy')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>
				</Box>

				<TableContainer component={Paper} variant='outlined' sx={{ mb: 2 }}>
					<Table size='small'>
						<TableHead sx={{ backgroundColor: '#f8fafc' }}>
							<TableRow>
								<TableCell width='40%'>{t('stockAdjustments.product')}</TableCell>
								<TableCell width='20%' align='right'>
									{t('stockAdjustments.quantity')}
								</TableCell>
								<TableCell width='20%' align='right'>
									{t('stockAdjustments.unitCost')}
								</TableCell>
								<TableCell width='20%' align='right'>
									{t('stockAdjustments.subtotalCost')}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{adjustment.items.map((item, index) => (
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
											{item.quantity}
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
											{item.subtotalCost}
										</Typography>
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
										sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
									>
										{adjustment.totalCost}
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

export default StockAdjustmentDetail

export { StockAdjustmentDetail as Component }
