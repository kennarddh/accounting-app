import { FC } from 'react'

import { Box, CircularProgress, alpha } from '@mui/material'

const LoadingPage: FC = () => {
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
			<CircularProgress size={40} />
		</Box>
	)
}

export default LoadingPage
