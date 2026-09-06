import { FC, SubmitEvent, useCallback, useEffect, useState, useTransition } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Alert, Box, Button, FormControl, TextField } from '@mui/material'

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/Admin/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import UserFindByIdApi from 'Api/User/UserFindByIdApi'
import UserUpdateApi from 'Api/User/UserUpdateApi'

const EditUser: FC = () => {
	const { id } = useParams()

	const [ErrorText, SetErrorText] = useState<string | null>(null)
	const [HasLoaded, SetHasLoaded] = useState(false)

	const [Name, SetName] = useState('')
	const [Username, SetUsername] = useState('')

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../../')

			try {
				const user = await UserFindByIdApi({ id })

				SetName(user.name)
				SetUsername(user.username)

				SetHasLoaded(true)
			} catch {
				await Navigate('../../')
			}
		}

		main().catch((error: unknown) => console.error('EditUser load error', error))
	}, [Navigate, id])

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			if (!id) return
			if (!HasLoaded) return

			startTransition(async () => {
				try {
					await UserUpdateApi({
						id: id,
						name: Name,
					})

					await Navigate('../../')
				} catch (error) {
					SetErrorText(
						await HandleApiError(error, async error => {
							if (
								error.resource === ApiErrorResource.User &&
								error.kind === ApiErrorKind.NotFound
							) {
								return t('users.errors.notFound')
							}
						}),
					)
				}
			})
		},
		[HasLoaded, Name, Navigate, id, t],
	)

	return (
		<PageContainer title={t('users.edit.title')}>
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
						label={t('users.username')}
						variant='outlined'
						disabled
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
				<Button
					type='submit'
					variant='outlined'
					fullWidth
					disabled={!HasLoaded}
					loading={isPending}
				>
					{t('common.submit')}
				</Button>
			</Box>
		</PageContainer>
	)
}

export default EditUser

export { EditUser as Component }
