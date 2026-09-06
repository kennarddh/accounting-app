import { FC } from 'react'

import { Avatar, Box, Drawer, Stack, Toolbar, Typography, drawerClasses } from '@mui/material'

import useAuthStore from 'Stores/AuthStore'

import MenuContent from './MenuContent'
import OptionsMenu from './OptionsMenu'

const SideMenu: FC = () => {
	const user = useAuthStore(state => state.user)

	if (user === null) return null

	return (
		<Drawer
			variant='permanent'
			anchor='left'
			sx={{
				display: { xs: 'none', md: 'block' },
				width: '20%',
				[`& .${drawerClasses.paper}`]: {
					backgroundColor: 'background.paper',
					width: '20%',
				},
			}}
		>
			<Toolbar />
			<Box
				sx={{
					overflow: 'auto',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<MenuContent />
			</Box>
			<Stack
				direction='row'
				sx={{
					p: 2,
					gap: 1,
					alignItems: 'center',
					borderTop: '1px solid',
					borderColor: 'divider',
				}}
			>
				<Avatar
					sizes='small'
					alt={user.name}
					src='https://avatars.githubusercontent.com/u/19550456'
					sx={{ width: 36, height: 36 }}
				/>
				<Box sx={{ mr: 'auto' }}>
					<Typography variant='body2' sx={{ fontWeight: 500, lineHeight: '16px' }}>
						{user.name}
					</Typography>
				</Box>
				<OptionsMenu />
			</Stack>
		</Drawer>
	)
}

export default SideMenu
