import { FC, useCallback, useState } from 'react'

import MenuRoundedIcon from '@mui/icons-material/MenuRounded'

import { AppBar, Stack, Toolbar, Typography } from '@mui/material'

import { useTranslation } from 'react-i18next'

import MobileSideMenu from 'Components/Admin/Menu/MobileSideMenu'
import MenuButton from 'Components/Menu/MenuButton'

const MobileHeader: FC = () => {
	const [Open, SetOpen] = useState(false)

	const { t } = useTranslation()

	const ToggleDrawer = useCallback((newOpen: boolean) => {
		SetOpen(newOpen)
	}, [])

	return (
		<AppBar
			position='sticky'
			sx={{
				display: { xs: 'block', md: 'none' },
				boxShadow: 0,
				bgcolor: 'background.paper',
				backgroundImage: 'none',
				borderBottom: '1px solid',
				borderColor: 'divider',
			}}
		>
			<Toolbar variant='regular'>
				<Stack
					direction='row'
					sx={{
						alignItems: 'center',
						flexGrow: 1,
						width: '100%',
						gap: 1,
						paddingY: 1,
					}}
				>
					<MobileSideMenu open={Open} toggleDrawer={ToggleDrawer} />
					<MenuButton aria-label='menu' onClick={() => ToggleDrawer(true)}>
						<MenuRoundedIcon />
					</MenuButton>
					<Stack spacing={0}>
						<Typography variant='h5' component='h1' sx={{ color: 'text.primary' }}>
							{t('navigations.brand')}
						</Typography>
					</Stack>
				</Stack>
			</Toolbar>
		</AppBar>
	)
}

export default MobileHeader
