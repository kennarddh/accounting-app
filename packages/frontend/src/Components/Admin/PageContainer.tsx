import { FC, ReactNode } from 'react'

import { Box, Typography } from '@mui/material'

export interface PageContainerProps {
	title: string
	children?: ReactNode
	hideTitle?: boolean
	noPadding?: boolean
}

const PageContainer: FC<PageContainerProps> = ({ title, children, hideTitle, noPadding }) => {
	return (
		<Box
			sx={theme => ({
				width: `calc(100% - ${noPadding ? 0 : theme.spacing(4)})`,
				height: `calc(100% - ${noPadding ? 0 : theme.spacing(4)})`,
				padding: noPadding ? 0 : 2,
				overflowY: 'auto',
			})}
		>
			{hideTitle ? null : (
				<Typography variant='h5' component='h1' sx={{ mb: 2 }}>
					{title}
				</Typography>
			)}
			{children}
		</Box>
	)
}

export default PageContainer
