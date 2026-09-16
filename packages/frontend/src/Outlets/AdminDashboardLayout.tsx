import { FC } from 'react'

import { Outlet } from 'react-router'

import { Box } from '@mui/material'

import Header from 'Components/Menu/Header'
import { DRAWER_WIDTH } from 'Components/Menu/SideMenu'

const AdminDashboardLayout: FC = () => {
	return (
		<>
			<Header />
			<Box
				sx={{
					flexGrow: 1,
					height: 'calc(100dvh - 64px)',
					overflow: 'auto',
					marginTop: { xs: '56px', md: '64px' },
					marginLeft: { xs: 0, md: `${DRAWER_WIDTH}px` },
					width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
				}}
			>
				<Outlet />
			</Box>
		</>
	)
}

export default AdminDashboardLayout
