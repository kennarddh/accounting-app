import { FC } from 'react'

import { Outlet } from 'react-router'

import { Box } from '@mui/material'

import Header from 'Components/Admin/Menu/Header'

const AdminDashboardLayout: FC = () => {
	return (
		<>
			<Header />
			<Box
				sx={{
					width: { xs: '100dvw', md: '80dvw' },
					height: 'calc(100dvh - 64px)',
					overflow: 'auto',
					marginTop: { xs: '0', md: '64px' },
					marginLeft: { xs: '0', md: '20dvw' },
				}}
			>
				<Outlet />
			</Box>
		</>
	)
}

export default AdminDashboardLayout
