import { FC, ReactNode } from 'react'

import { Link as RouterLink, useLocation } from 'react-router'

import NavigateNextIcon from '@mui/icons-material/NavigateNext'

import { Box, Breadcrumbs, Link, Typography } from '@mui/material'

import { useTranslation } from 'react-i18next'

export interface PageContainerProps {
	title: string
	children?: ReactNode
	hideTitle?: boolean
	noPadding?: boolean
	customBreadcrumbs?: { label: string; to?: string }[]
}

const PageContainer: FC<PageContainerProps> = ({
	title,
	children,
	hideTitle,
	noPadding,
	customBreadcrumbs,
}) => {
	const location = useLocation()
	const { t, i18n } = useTranslation()

	const pathSegments = location.pathname.split('/').filter(Boolean)

	return (
		<Box
			sx={{
				width: '100%',
				height: '100%',
				padding: noPadding ? 0 : 2,
				overflowY: 'auto',
			}}
		>
			<Breadcrumbs
				separator={<NavigateNextIcon fontSize='small' />}
				aria-label='breadcrumb'
				sx={{ mb: 1.5 }}
			>
				<Link component={RouterLink} underline='hover' color='inherit' to='/'>
					{t('breadcrumbs.home')}
				</Link>

				{customBreadcrumbs
					? customBreadcrumbs.map((crumb, idx) => {
							const isLast = idx === customBreadcrumbs.length - 1
							return isLast || !crumb.to ? (
								<Typography key={idx} color='text.primary' variant='body2'>
									{crumb.label}
								</Typography>
							) : (
								<Link
									key={idx}
									component={RouterLink}
									underline='hover'
									color='inherit'
									to={crumb.to}
									variant='body2'
								>
									{crumb.label}
								</Link>
							)
						})
					: pathSegments.map((segment, index) => {
							const isLast = index === pathSegments.length - 1
							const targetUrl = `/${pathSegments.slice(0, index + 1).join('/')}`

							// Translate known route keywords from i18n, else show segment (for IDs/custom tokens)
							const translationKey = `breadcrumbs.${segment}`
							const label = i18n.exists(translationKey) ? t(translationKey) : segment

							return isLast ? (
								<Typography key={targetUrl} color='text.primary' variant='body2'>
									{label}
								</Typography>
							) : (
								<Link
									key={targetUrl}
									component={RouterLink}
									underline='hover'
									color='inherit'
									to={targetUrl}
									variant='body2'
								>
									{label}
								</Link>
							)
						})}
			</Breadcrumbs>

			{hideTitle ? null : (
				<Typography variant='h5' component='h1' sx={{ mb: 2, fontWeight: 600 }}>
					{title}
				</Typography>
			)}
			{children}
		</Box>
	)
}

export default PageContainer
