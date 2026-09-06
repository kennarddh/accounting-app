import { FC, useCallback } from 'react'

import { useNavigate } from 'react-router'

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import HomeIcon from '@mui/icons-material/Home'
import RefreshIcon from '@mui/icons-material/Refresh'

import { Box, Button, Container, Typography, alpha } from '@mui/material'

import { useTranslation } from 'react-i18next'

const ErrorPageTemplate: FC<{ title: string; text: string }> = ({ title, text }) => {
	const Navigate = useNavigate()

	const { t } = useTranslation()

	const Back = useCallback(async () => {
		await Navigate(-1)
	}, [Navigate])

	const Refresh = useCallback(async () => {
		await Navigate(0)
	}, [Navigate])

	const Home = useCallback(async () => {
		await Navigate('/')
	}, [Navigate])

	return (
		<Box
			sx={theme => ({
				width: '100dvw',
				height: '100dvh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 2,
				background: `linear-gradient(180deg, #ffffff 50%, ${alpha(theme.palette.primary.light, 0.5)} 100%)`,
			})}
		>
			<Typography variant='h4'>{title}</Typography>
			<Typography
				sx={{
					textAlign: 'center',
					maxWidth: {
						md: '50%',
						xs: '90%',
					},
				}}
			>
				{text}
			</Typography>
			<Container sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
				<Button variant='contained' onClick={Back} startIcon={<ArrowBackIosNewIcon />}>
					{t('common.back')}
				</Button>
				<Button variant='contained' onClick={Home} startIcon={<HomeIcon />}>
					{t('common.home')}
				</Button>
				<Button variant='contained' onClick={Refresh} startIcon={<RefreshIcon />}>
					{t('common.refresh')}
				</Button>
			</Container>
		</Box>
	)
}

export default ErrorPageTemplate
