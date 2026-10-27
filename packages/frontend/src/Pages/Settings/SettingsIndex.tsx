import { FC } from 'react'

import { useNavigate } from 'react-router'

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded'

import {
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Divider,
	Grid,
	Typography,
} from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

interface SettingCardConfig {
	title: string
	description: string
	path: string
	icon: React.ReactNode
	color: string
}

const SettingsIndex: FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const settingCards: SettingCardConfig[] = [
		{
			title: t('settings.index.posConfig.title'),
			description: t('settings.index.posConfig.description'),
			path: '/settings/pos-configuration',
			icon: <SettingsSuggestRoundedIcon sx={{ fontSize: 32 }} />,
			color: '#0284c7',
		},
	]

	return (
		<PageContainer title={t('settings.index.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
				<Typography variant='body1' sx={{ color: 'text.secondary', mt: -1 }}>
					{t('settings.index.subtitle')}
				</Typography>

				<Grid container spacing={2}>
					{settingCards.map((card, idx) => (
						<Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
							<Card
								variant='outlined'
								sx={{
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'space-between',
									transition: 'border-color 0.2s, box-shadow 0.2s',
									'&:hover': {
										borderColor: 'primary.main',
										boxShadow: 2,
									},
								}}
							>
								<CardContent>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 1.5,
											mb: 1.5,
											color: card.color,
										}}
									>
										{card.icon}
										<Typography
											variant='subtitle1'
											sx={{ fontWeight: 600, color: 'text.primary' }}
										>
											{card.title}
										</Typography>
									</Box>
									<Typography
										variant='body2'
										sx={{ color: 'text.secondary', minHeight: 40 }}
									>
										{card.description}
									</Typography>
								</CardContent>

								<Box>
									<Divider />
									<CardActions sx={{ p: 1.5 }}>
										<Button
											size='small'
											endIcon={<ArrowForwardRoundedIcon />}
											onClick={() => navigate(card.path)}
											sx={{
												ml: 'auto',
												textTransform: 'none',
												fontWeight: 600,
											}}
										>
											{t('settings.index.openSetting')}
										</Button>
									</CardActions>
								</Box>
							</Card>
						</Grid>
					))}
				</Grid>
			</Box>
		</PageContainer>
	)
}

export default SettingsIndex

export { SettingsIndex as Component }
