import { FC, SubmitEvent, useCallback, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import {
	Alert,
	Box,
	Button,
	FormControl,
	IconButton,
	InputAdornment,
	TextField,
} from '@mui/material'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/Admin/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import UserCreateApi from 'Api/User/UserCreateApi'

const NewUser: FC = () => {
	const [IsPasswordVisible, SetIsPasswordVisible] = useState(false)
	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [Name, SetName] = useState('')
	const [Username, SetUsername] = useState('')
	const [Password, SetPassword] = useState('')

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			startTransition(async () => {
				try {
					await UserCreateApi({
						name: Name,
						username: Username,
						password: Password,
					})

					await Navigate('../')
				} catch (error) {
					SetErrorText(
						await HandleApiError(error, async error => {
							if (
								error.resource === ApiErrorResource.Username &&
								error.kind === ApiErrorKind.Taken
							) {
								return t('users.errors.usernameTaken')
							}
						}),
					)
				}
			})
		},
		[Name, Navigate, Password, Username, t],
	)

	return (
		<PageContainer title={t('users.new.title')}>
			<Box
				component='form'
				noValidate
				onSubmit={OnSubmit}
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				{ErrorText !== null ? (
					<Alert severity='error' sx={{ width: '100%', whiteSpace: 'pre-line' }}>
						{ErrorText}
					</Alert>
				) : null}
				<FormControl fullWidth>
					<TextField
						value={Username}
						onChange={event => SetUsername(event.target.value)}
						label={t('users.username')}
						variant='outlined'
						required
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Name}
						onChange={event => SetName(event.target.value)}
						label={t('users.name')}
						variant='outlined'
						required
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Password}
						onChange={event => SetPassword(event.target.value)}
						label={t('users.password')}
						variant='outlined'
						required
						autoComplete='new-password'
						type={IsPasswordVisible ? 'text' : 'password'}
						slotProps={{
							input: {
								endAdornment: (
									<InputAdornment position='end'>
										<IconButton
											aria-label={
												IsPasswordVisible
													? t('users.hidePassword')
													: t('users.showPassword')
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
				<Button type='submit' variant='outlined' fullWidth loading={isPending}>
					{t('common.submit')}
				</Button>
			</Box>
		</PageContainer>
	)
}

export default NewUser

export { NewUser as Component }
