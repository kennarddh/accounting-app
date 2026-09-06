import { FC } from 'react'

import { AppBar, Box, Stack, Toolbar, Typography } from '@mui/material'

import { useTranslation } from 'react-i18next'

import LanguageSelector from '../../Menu/LanguageSelector'

const DesktopHeader: FC = () => {
	const { t } = useTranslation()

	return (
		<AppBar
			position='fixed'
			sx={{
				display: { xs: 'none', md: 'block' },
				width: '100%',
				boxShadow: 0,
				bgcolor: 'background.paper',
				backgroundImage: 'none',
				borderBottom: '1px solid',
				borderColor: 'divider',
				zIndex: theme => theme.zIndex.drawer + 1,
			}}
		>
			<Toolbar variant='regular'>
				<Stack direction='row' sx={{ width: '100%', justifyContent: 'space-between' }}>
					<Stack spacing={2} direction='row'>
						<Typography variant='h5' component='h1' sx={{ color: 'text.primary' }}>
							{t('navigations.brand')}
						</Typography>
					</Stack>
					<Box sx={{ display: 'flex', gap: 1, flexDirection: 'row' }}>
						<LanguageSelector />
					</Box>
				</Stack>
			</Toolbar>
		</AppBar>
	)
}

export default DesktopHeader
