import { FC, SubmitEvent, useCallback, useEffect, useState, useTransition } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Alert, Box, Button, FormControl, MenuItem, TextField } from '@mui/material'

import { AccountType, ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/Admin/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import AccountFindByIdApi from 'Api/Account/AccountFindByIdApi'
import AccountUpdateApi from 'Api/Account/AccountUpdateApi'

const EditAccount: FC = () => {
	const { id } = useParams()

	const [ErrorText, SetErrorText] = useState<string | null>(null)
	const [HasLoaded, SetHasLoaded] = useState(false)

	const [code, setCode] = useState('')
	const [Name, SetName] = useState('')
	const [type, setType] = useState<AccountType>(AccountType.Asset)

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../../')

			try {
				const account = await AccountFindByIdApi({ id })

				setCode(account.code)
				SetName(account.name)
				setType(account.type)

				SetHasLoaded(true)
			} catch {
				await Navigate('../../')
			}
		}

		main().catch((error: unknown) => console.error('EditAccount load error', error))
	}, [Navigate, id])

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			if (!id) return
			if (!HasLoaded) return

			startTransition(async () => {
				try {
					await AccountUpdateApi({ id, code, name: Name })

					await Navigate('../../')
				} catch (thrownError) {
					SetErrorText(
						await HandleApiError(thrownError, async error => {
							if (
								error.resource === ApiErrorResource.Account &&
								error.kind === ApiErrorKind.NotFound
							) {
								return t('accounts.errors.notFound')
							} else if (
								error.resource === ApiErrorResource.Account &&
								error.kind === ApiErrorKind.Taken
							) {
								return t('accounts.errors.codeTaken')
							}
						}),
					)
				}
			})
		},
		[HasLoaded, Name, Navigate, code, id, t, type],
	)

	return (
		<PageContainer title={t('accounts.edit.title')}>
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
						value={code}
						onChange={event => setCode(event.target.value)}
						label={t('accounts.code')}
						variant='outlined'
						required
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Name}
						onChange={event => SetName(event.target.value)}
						label={t('accounts.name')}
						variant='outlined'
						required
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						select
						defaultValue={type}
						label={t('accounts.type')}
						variant='outlined'
						disabled
					>
						{Object.values(AccountType).map(type => (
							<MenuItem key={type} value={type}>
								{type}
							</MenuItem>
						))}
					</TextField>
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

export default EditAccount

export { EditAccount as Component }
