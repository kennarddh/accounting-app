import { FC, SubmitEvent, useCallback, useState, useTransition } from 'react'

import { Link as RouterLink, useNavigate } from 'react-router'

import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import {
	Alert,
	Box,
	Button,
	FormControl,
	IconButton,
	InputAdornment,
	Link,
	TextField,
	Typography,
} from '@mui/material'

import { ApiErrorKind } from '@accounting-app/common'
import useAuthStore from 'Stores/AuthStore'
import { useTranslation } from 'react-i18next'

import AuthLoginApi from 'Api/Auth/AuthLoginApi'
import { FormatParsingError, IsApiResponseError } from 'Api/index'

const Login: FC = () => {
	const [IsPasswordVisible, SetIsPasswordVisible] = useState(false)
	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [Username, SetUsername] = useState('')
	const [Password, SetPassword] = useState('')

	const completeLogin = useAuthStore(state => state.completeLogin)

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnLogin = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			startTransition(async () => {
				try {
					const result = await AuthLoginApi({
						username: Username,
						password: Password,
					})

					completeLogin(result.token, result.user)

					await Navigate('/admin')
				} catch (error) {
					if (IsApiResponseError(error)) {
						if (error.apiErrorResponse.errors.parsing) {
							const formattedParsingErrors = FormatParsingError(
								error.apiErrorResponse.errors.parsing,
							)

							const formattedParsingError = formattedParsingErrors.join('\n')

							SetErrorText(formattedParsingError)
						} else if (error.apiErrorResponse.errors.others) {
							if (
								error.apiErrorResponse.errors.others[0]?.resource === null &&
								error.apiErrorResponse.errors.others[0].kind ===
									ApiErrorKind.Unauthorized
							) {
								SetErrorText(t('auth.errors.unauthorized'))
							} else if (
								error.apiErrorResponse.errors.others[0]?.resource === null &&
								error.apiErrorResponse.errors.others[0].kind ===
									ApiErrorKind.InternalServerError
							) {
								SetErrorText(t('errors.unknown.text'))
							}
						} else {
							console.error('Unknown login error occured.', error)

							SetErrorText(t('errors.unknown.text'))
						}
					} else {
						console.error('Login error', error)

						SetErrorText(t('errors.network.text'))
					}
				}
			})
		},
		[Username, Password, completeLogin, Navigate, t],
	)

	return (
		<Box
			sx={{
				height: '100dvh',
				width: '100dvw',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<Box
				component='form'
				sx={{
					padding: '30px',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					flexDirection: 'column',
					gap: '10px',
					width: { xs: '90%', sm: '60%', md: '40%' },
					border: 1,
					borderColor: 'divider',
					borderRadius: 2,
				}}
				noValidate
				autoComplete='off'
				onSubmit={OnLogin}
			>
				<Typography
					component='h1'
					variant='h4'
					sx={{
						width: '100%',
						textAlign: 'center',
						fontSize: '10dwv',
					}}
				>
					{t('auth.login.title')}
				</Typography>
				{ErrorText !== null ? (
					<Alert severity='error' sx={{ width: '100%', whiteSpace: 'pre-line' }}>
						{ErrorText}
					</Alert>
				) : null}
				<FormControl fullWidth sx={{ m: 1, width: '100%' }}>
					<TextField
						value={Username}
						onChange={event => SetUsername(event.target.value)}
						label={t('auth.username')}
						variant='outlined'
						required
						autoComplete='username'
					/>
				</FormControl>
				<FormControl sx={{ m: 1, width: '100%' }}>
					<TextField
						value={Password}
						onChange={event => SetPassword(event.target.value)}
						label={t('auth.password')}
						variant='outlined'
						required
						autoComplete='password'
						type={IsPasswordVisible ? 'text' : 'password'}
						slotProps={{
							input: {
								endAdornment: (
									<InputAdornment position='end'>
										<IconButton
											aria-label={
												IsPasswordVisible
													? t('auth.hidePassword')
													: t('auth.showPassword')
											}
											onClick={() => SetIsPasswordVisible(prev => !prev)}
											onMouseDown={event => event.preventDefault()}
											onMouseUp={event => event.preventDefault()}
											edge='end'
										>
											{IsPasswordVisible ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								),
							},
						}}
					/>
				</FormControl>
				<Link component={RouterLink} sx={{ fontSize: '0.75rem' }} to='/'>
					{t('auth.forgetPasswordLink')}
				</Link>
				<Button type='submit' variant='outlined' sx={{ width: '100%' }} loading={isPending}>
					{t('auth.login.submit')}
				</Button>
			</Box>
		</Box>
	)
}

export default Login

export { Login as Component }
