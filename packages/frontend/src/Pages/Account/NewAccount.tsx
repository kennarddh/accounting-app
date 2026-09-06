import { FC, SubmitEvent, useCallback, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

import { Alert, Box, Button, FormControl, MenuItem, TextField } from '@mui/material'

import { AccountType, ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import AccountCreateApi from 'Api/Account/AccountCreateApi'

const NewAccount: FC = () => {
	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [code, setCode] = useState('')
	const [Name, SetName] = useState('')
	const [type, setType] = useState<AccountType>(AccountType.Asset)

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			startTransition(async () => {
				try {
					await AccountCreateApi({
						code,
						name: Name,
						type,
					})

					await Navigate('../')
				} catch (thrownError) {
					SetErrorText(
						await HandleApiError(thrownError, async error => {
							if (
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
		[Name, Navigate, code, type, t],
	)

	return (
		<PageContainer title={t('accounts.new.title')}>
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
						value={type}
						onChange={event => setType(event.target.value as AccountType)}
						label={t('accounts.type')}
						variant='outlined'
						required
					>
						{Object.values(AccountType).map(type => (
							<MenuItem key={type} value={type}>
								{t(`accounts.enum.type.${type}`)}
							</MenuItem>
						))}
					</TextField>
				</FormControl>
				<Button type='submit' variant='outlined' fullWidth loading={isPending}>
					{t('common.submit')}
				</Button>
			</Box>
		</PageContainer>
	)
}

export default NewAccount

export { NewAccount as Component }
