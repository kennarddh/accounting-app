import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import EditIcon from '@mui/icons-material/Edit'

import {
	Box,
	Button,
	Chip,
	CircularProgress,
	FormControl,
	TextField,
	Typography,
} from '@mui/material'

import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import SupplierFindByIdApi, { SupplierFindByIdOutput } from 'Api/Supplier/SupplierFindByIdApi'

const SupplierDetail: FC = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { t } = useTranslation()

	const [supplier, setSupplier] = useState<SupplierFindByIdOutput | null>(null)

	useEffect(() => {
		const load = async () => {
			if (!id) return
			try {
				const s = await SupplierFindByIdApi({ id })
				setSupplier(s)
			} catch {
				await navigate('../../')
			}
		}
		void load()
	}, [id, navigate])

	if (!supplier) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
				<CircularProgress />
			</Box>
		)
	}

	const isDisabled = supplier.disabledAt !== null

	return (
		<PageContainer title={t('suppliers.detail.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
					<Button
						variant='contained'
						startIcon={<EditIcon />}
						onClick={() => navigate('edit')}
						disabled={isDisabled}
					>
						{t('common.edit')}
					</Button>
				</Box>

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							value={supplier.code}
							label={t('suppliers.code')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					<FormControl sx={{ flex: 2, minWidth: 250 }}>
						<TextField
							value={supplier.name}
							label={t('suppliers.name')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					<FormControl sx={{ minWidth: 140, justifyContent: 'center' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Typography variant='body2' sx={{ color: 'text.secondary' }}>
								{t('suppliers.status')}:
							</Typography>
							<Chip
								label={isDisabled ? t('common.disabled') : t('common.active')}
								color={isDisabled ? 'default' : 'success'}
								size='medium'
							/>
						</Box>
					</FormControl>
				</Box>

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							value={supplier.contact ?? '-'}
							label={t('suppliers.contact')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							value={supplier.phone ?? '-'}
							label={t('suppliers.phone')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							value={supplier.email ?? '-'}
							label={t('suppliers.email')}
							variant='outlined'
							slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						/>
					</FormControl>
				</Box>

				<FormControl fullWidth>
					<TextField
						value={supplier.terms ?? '-'}
						label={t('suppliers.terms')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>

				<FormControl fullWidth>
					<TextField
						value={supplier.address ?? '-'}
						label={t('suppliers.address')}
						variant='outlined'
						multiline
						rows={2}
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>

				<Typography variant='caption' sx={{ color: 'text.secondary', mt: 1 }}>
					{t('suppliers.createdAt')}:{' '}
					{dayjs(supplier.createdAt).format('DD/MM/YYYY HH:mm')}
				</Typography>
			</Box>
		</PageContainer>
	)
}

export default SupplierDetail

export { SupplierDetail as Component }
