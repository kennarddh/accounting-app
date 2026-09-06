import { FC, MouseEvent, useCallback, useState } from 'react'

import { Link, useNavigate } from 'react-router'

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

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import useAuthStore from 'Stores/AuthStore'
import { useTranslation } from 'react-i18next'

import MenuButton from 'Components/Menu/MenuButton'

import AuthLogoutApi from 'Api/Auth/AuthLogoutApi'
import { IsApiResponseError } from 'Api/index'

const OptionsMenu: FC = () => {
	const [AnchorElement, SetAnchorElement] = useState<HTMLElement | null>(null)
	const [ErrorSnackbarText, SetErrorSnackbarText] = useState<string | null>(null)

	const completeLogout = useAuthStore(state => state.completeLogout)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnClick = useCallback((event: MouseEvent<HTMLElement>) => {
		SetAnchorElement(event.currentTarget)
	}, [])

	const OnClose = useCallback(() => {
		SetAnchorElement(null)
	}, [])

	const OnLogout = useCallback(async () => {
		try {
			await AuthLogoutApi()

			completeLogout()

			await Navigate('/login')
		} catch (error) {
			if (IsApiResponseError(error)) {
				if (error.apiErrorResponse.errors.others) {
					if (
						error.apiErrorResponse.errors.others[0]?.resource ===
							ApiErrorResource.UserSession &&
						error.apiErrorResponse.errors.others[0].kind === ApiErrorKind.Inactive
					) {
						SetErrorSnackbarText(t('auth.errors.sessionInactive'))
					}
				} else {
					console.error('Unknown logout error occured.', error)

					SetErrorSnackbarText(t('errors.unknown.text'))
				}
			} else {
				SetErrorSnackbarText(t('errors.network.text'))
			}
		}
	}, [Navigate, completeLogout, t])

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
				<MenuItem component={Link} to='/admin/profile'>
					<ListItemText>{t('navigations.links.profile')}</ListItemText>
				</MenuItem>
				<Divider />
				<MenuItem
					onClick={OnLogout}
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
				open={ErrorSnackbarText !== null}
				autoHideDuration={10000}
				onClose={() => SetErrorSnackbarText(null)}
				message={ErrorSnackbarText}
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
					onClose={() => SetErrorSnackbarText(null)}
					severity='error'
					variant='filled'
					sx={{ width: '100%' }}
				>
					{ErrorSnackbarText}
				</Alert>
			</Snackbar>
		</>
	)
}

export default OptionsMenu
