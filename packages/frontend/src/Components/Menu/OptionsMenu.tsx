import { FC, MouseEvent, useCallback, useState } from 'react'

import { Link } from 'react-router'

import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'

import {
	Alert,
	Divider,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Snackbar,
	dividerClasses,
	listClasses,
	listItemIconClasses,
	paperClasses,
} from '@mui/material'

import { useTranslation } from 'react-i18next'

import MenuButton from 'Components/Menu/MenuButton'

import { useLogout } from 'Hooks/useLogout'

const OptionsMenu: FC = () => {
	const [AnchorElement, SetAnchorElement] = useState<HTMLElement | null>(null)

	const { logout, errorText, clearError } = useLogout()

	const { t } = useTranslation()

	const OnClick = useCallback((event: MouseEvent<HTMLElement>) => {
		SetAnchorElement(event.currentTarget)
	}, [])

	const OnClose = useCallback(() => {
		SetAnchorElement(null)
	}, [])

	return (
		<>
			<MenuButton
				aria-label={t('navigations.menu.open')}
				onClick={OnClick}
				sx={{ borderColor: 'transparent' }}
			>
				<MoreVertRoundedIcon />
			</MenuButton>
			<Menu
				anchorEl={AnchorElement}
				id='menu'
				open={!!AnchorElement}
				onClose={OnClose}
				transformOrigin={{ horizontal: 'right', vertical: 'top' }}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
				sx={{
					[`& .${listClasses.root}`]: {
						padding: '4px',
					},
					[`& .${paperClasses.root}`]: {
						padding: 0,
					},
					[`& .${dividerClasses.root}`]: {
						margin: '4px -4px',
					},
				}}
			>
				<MenuItem component={Link} to='/profile'>
					<ListItemText>{t('navigations.links.profile')}</ListItemText>
				</MenuItem>
				<Divider />
				<MenuItem
					onClick={logout}
					sx={{
						[`& .${listItemIconClasses.root}`]: {
							ml: 'auto',
							minWidth: 0,
						},
					}}
				>
					<ListItemText sx={{ mr: 1 }}>{t('auth.logoutButton')}</ListItemText>
					<ListItemIcon>
						<LogoutRoundedIcon fontSize='small' />
					</ListItemIcon>
				</MenuItem>
			</Menu>
			<Snackbar
				open={errorText !== null}
				autoHideDuration={10000}
				onClose={clearError}
				message={errorText}
				slotProps={{
					clickAwayListener: {
						onClickAway: event => {
							// https://mui.com/material-ui/react-snackbar/#preventing-default-click-away-event
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
							;(event as any).defaultMuiPrevented = true
						},
					},
				}}
			>
				<Alert
					onClose={clearError}
					severity='error'
					variant='filled'
					sx={{ width: '100%' }}
				>
					{errorText}
				</Alert>
			</Snackbar>
		</>
	)
}

export default OptionsMenu
