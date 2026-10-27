import { FC, SubmitEvent, useCallback, useEffect, useState, useTransition } from 'react'

import SaveIcon from '@mui/icons-material/Save'

import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	Snackbar,
	Typography,
} from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'
import SelectAccount from 'Components/SelectResources/SelectAccount'

import HandleApiError from 'Utils/HandleApiError'

import {
	PosConfigurationGetApi,
	PosConfigurationOutput,
	PosConfigurationUpdateApi,
} from 'Api/PosConfiguration/PosConfigurationApi'

interface SettingFieldProps {
	label: string
	expectedType: 'Asset' | 'Liability' | 'Revenue' | 'Expense'
	value: string
	onChange: (value: string | null) => void
	onError: (err: string) => void
}

const SettingAccountField: FC<SettingFieldProps> = ({
	label,
	expectedType,
	value,
	onChange,
	onError,
}) => {
	const getTypeColor = (type: string) => {
		switch (type) {
			case 'Asset':
				return 'primary'
			case 'Revenue':
				return 'success'
			case 'Expense':
				return 'warning'
			case 'Liability':
				return 'secondary'
			default:
				return 'default'
		}
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
					{label}
				</Typography>
				<Chip
					label={expectedType}
					size='small'
					color={getTypeColor(expectedType)}
					variant='outlined'
					sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
				/>
			</Box>
			<SelectAccount
				value={value}
				onChange={onChange}
				onError={onError}
				slotProps={{
					button: {
						fullWidth: true,
						sx: {
							minHeight: 46,
							justifyContent: 'flex-start',
							px: 1.75,
							bgcolor: 'background.paper',
							textTransform: 'none',
						},
					},
				}}
			/>
		</Box>
	)
}

const PosConfigurationSettings: FC = () => {
	const { t } = useTranslation()

	const [config, setConfig] = useState<PosConfigurationOutput | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	const [isPending, startTransition] = useTransition()

	useEffect(() => {
		const load = async () => {
			setIsLoading(true)
			setErrorText(null)
			try {
				const current = await PosConfigurationGetApi()
				setConfig(current)
			} catch (err) {
				setErrorText(HandleApiError(err))
			} finally {
				setIsLoading(false)
			}
		}
		void load()
	}, [])

	const handleAccountChange = (field: keyof PosConfigurationOutput, value: string | null) => {
		if (value) {
			setConfig(prev => (prev ? { ...prev, [field]: value } : prev))
		}
	}

	const handleSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()
			if (!config) return

			setErrorText(null)
			startTransition(async () => {
				try {
					await PosConfigurationUpdateApi(config)
					setSuccessMessage(t('settings.posConfiguration.savedSuccessfully'))
				} catch (err) {
					setErrorText(HandleApiError(err))
				}
			})
		},
		[config, t],
	)

	return (
		<PageContainer title={t('settings.posConfiguration.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 6 }}>
				<Typography variant='body1' sx={{ color: 'text.secondary', mt: -1 }}>
					{t('settings.posConfiguration.subtitle')}
				</Typography>

				{errorText && <Alert severity='error'>{errorText}</Alert>}

				{isLoading || !config ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
						<CircularProgress />
					</Box>
				) : (
					<Box
						component='form'
						onSubmit={handleSubmit}
						sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
					>
						{/* 1. Cash & Banking */}
						<Card variant='outlined'>
							<CardContent
								sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
							>
								<Box>
									<Typography
										variant='h6'
										sx={{ fontSize: '1.05rem', fontWeight: 600 }}
									>
										{t('settings.posConfiguration.sections.cashAndBank')}
									</Typography>
									<Typography
										variant='body2'
										sx={{ color: 'text.secondary', mt: 0.25 }}
									>
										{t('settings.posConfiguration.sections.cashAndBankDesc')}
									</Typography>
								</Box>
								<Divider />
								<Grid container spacing={2.5}>
									<Grid size={{ xs: 12, md: 6 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.cashAccount',
											)}
											expectedType='Asset'
											value={config.cashAccountId}
											onChange={val =>
												handleAccountChange('cashAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.bankAccount',
											)}
											expectedType='Asset'
											value={config.bankAccountId}
											onChange={val =>
												handleAccountChange('bankAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>

						{/* 2. Sales & Revenue */}
						<Card variant='outlined'>
							<CardContent
								sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
							>
								<Box>
									<Typography
										variant='h6'
										sx={{ fontSize: '1.05rem', fontWeight: 600 }}
									>
										{t('settings.posConfiguration.sections.salesAndRevenue')}
									</Typography>
									<Typography
										variant='body2'
										sx={{ color: 'text.secondary', mt: 0.25 }}
									>
										{t(
											'settings.posConfiguration.sections.salesAndRevenueDesc',
										)}
									</Typography>
								</Box>
								<Divider />
								<Grid container spacing={2.5}>
									<Grid size={{ xs: 12, md: 6 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.salesRevenueAccount',
											)}
											expectedType='Revenue'
											value={config.salesRevenueAccountId}
											onChange={val =>
												handleAccountChange('salesRevenueAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>

						{/* 3. Inventory & COGS */}
						<Card variant='outlined'>
							<CardContent
								sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
							>
								<Box>
									<Typography
										variant='h6'
										sx={{ fontSize: '1.05rem', fontWeight: 600 }}
									>
										{t('settings.posConfiguration.sections.inventoryAndCogs')}
									</Typography>
									<Typography
										variant='body2'
										sx={{ color: 'text.secondary', mt: 0.25 }}
									>
										{t(
											'settings.posConfiguration.sections.inventoryAndCogsDesc',
										)}
									</Typography>
								</Box>
								<Divider />
								<Grid container spacing={2.5}>
									<Grid size={{ xs: 12, md: 6 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.inventoryAssetAccount',
											)}
											expectedType='Asset'
											value={config.inventoryAssetAccountId}
											onChange={val =>
												handleAccountChange('inventoryAssetAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.cogsAccount',
											)}
											expectedType='Expense'
											value={config.cogsAccountId}
											onChange={val =>
												handleAccountChange('cogsAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>

						{/* 4. Adjustments, Spoilage & Shrinkage */}
						<Card variant='outlined'>
							<CardContent
								sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
							>
								<Box>
									<Typography
										variant='h6'
										sx={{ fontSize: '1.05rem', fontWeight: 600 }}
									>
										{t('settings.posConfiguration.sections.adjustments')}
									</Typography>
									<Typography
										variant='body2'
										sx={{ color: 'text.secondary', mt: 0.25 }}
									>
										{t('settings.posConfiguration.sections.adjustmentsDesc')}
									</Typography>
								</Box>
								<Divider />
								<Grid container spacing={2.5}>
									<Grid size={{ xs: 12, md: 4 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.spoilageExpenseAccount',
											)}
											expectedType='Expense'
											value={config.spoilageExpenseAccountId}
											onChange={val =>
												handleAccountChange('spoilageExpenseAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 4 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.shrinkageExpenseAccount',
											)}
											expectedType='Expense'
											value={config.shrinkageExpenseAccountId}
											onChange={val =>
												handleAccountChange(
													'shrinkageExpenseAccountId',
													val,
												)
											}
											onError={setErrorText}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 4 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.inventoryGainAccount',
											)}
											expectedType='Revenue'
											value={config.inventoryGainAccountId}
											onChange={val =>
												handleAccountChange('inventoryGainAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>

						{/* 5. Payables & Rounding */}
						<Card variant='outlined'>
							<CardContent
								sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
							>
								<Box>
									<Typography
										variant='h6'
										sx={{ fontSize: '1.05rem', fontWeight: 600 }}
									>
										{t('settings.posConfiguration.sections.payables')}
									</Typography>
									<Typography
										variant='body2'
										sx={{ color: 'text.secondary', mt: 0.25 }}
									>
										{t('settings.posConfiguration.sections.payablesDesc')}
									</Typography>
								</Box>
								<Divider />
								<Grid container spacing={2.5}>
									<Grid size={{ xs: 12, md: 6 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.accountsPayableAccount',
											)}
											expectedType='Liability'
											value={config.accountsPayableAccountId}
											onChange={val =>
												handleAccountChange('accountsPayableAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<SettingAccountField
											label={t(
												'settings.posConfiguration.fields.roundingAccount',
											)}
											expectedType='Expense'
											value={config.roundingAccountId}
											onChange={val =>
												handleAccountChange('roundingAccountId', val)
											}
											onError={setErrorText}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>

						{/* Save Action Bar */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
							<Button
								type='submit'
								variant='contained'
								size='large'
								startIcon={<SaveIcon />}
								loading={isPending}
								sx={{ minWidth: 220, fontWeight: 600, py: 1.25 }}
							>
								{t('settings.posConfiguration.saveButton')}
							</Button>
						</Box>
					</Box>
				)}

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

export default PosConfigurationSettings

export { PosConfigurationSettings as Component }
