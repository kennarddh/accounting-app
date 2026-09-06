import { FC, useCallback, useState } from 'react'

import { useNavigate } from 'react-router'

import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'

import {
	Alert,
	Avatar,
	Button,
	Divider,
	Drawer,
	Snackbar,
	Stack,
	Typography,
	drawerClasses,
} from '@mui/material'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import useAuthStore from 'Stores/AuthStore'
import { useTranslation } from 'react-i18next'

import MenuContent from 'Components/Menu/MenuContent'

import AuthLogoutApi from 'Api/Auth/AuthLogoutApi'
import { IsApiResponseError } from 'Api/index'

import LanguageSelector from './LanguageSelector'

export interface MobileSideMenuProps {
	open: boolean | undefined
	toggleDrawer: (newOpen: boolean) => void
}

const MobileSideMenu: FC<MobileSideMenuProps> = ({ open, toggleDrawer }) => {
	const user = useAuthStore(state => state.user)
	const completeLogout = useAuthStore(state => state.completeLogout)
	const [ErrorSnackbarText, SetErrorSnackbarText] = useState<string | null>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

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

	if (user === null) return null

	return (
		<>
			<Drawer
				anchor='left'
				open={open ?? false}
				onClose={() => toggleDrawer(false)}
				sx={{
					zIndex: theme => theme.zIndex.drawer + 1,
					[`& .${drawerClasses.paper}`]: {
						backgroundImage: 'none',
						backgroundColor: 'background.paper',
					},
				}}
			>
				<Stack
					sx={{
						maxWidth: '70dvw',
						height: '100%',
					}}
				>
					<Stack direction='row' sx={{ p: 2, pb: 0, gap: 1 }}>
						<Stack
							direction='row'
							sx={{ gap: 1, alignItems: 'center', flexGrow: 1, p: 1 }}
						>
							<Avatar
								sizes='small'
								alt={user.name}
								src='https://avatars.githubusercontent.com/u/19550456'
								sx={{ width: 24, height: 24 }}
							/>
							<Typography component='p' variant='h6'>
								{user.name}
							</Typography>
						</Stack>
						<LanguageSelector />
					</Stack>
					<Divider />
					<Stack sx={{ flexGrow: 1 }}>
						<MenuContent onClickLink={() => toggleDrawer(false)} />
						<Divider />
					</Stack>
					<Stack sx={{ p: 2 }}>
						<Button
							variant='outlined'
							fullWidth
							startIcon={<LogoutRoundedIcon />}
							onClick={OnLogout}
						>
							{t('auth.logoutButton')}
						</Button>
					</Stack>
				</Stack>
			</Drawer>
			<Snackbar
				open={ErrorSnackbarText !== null}
				autoHideDuration={6000}
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

export default MobileSideMenu
