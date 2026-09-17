import { FC, SubmitEvent, useCallback, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

import { Alert, Box, Button, FormControl, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import CategoryCreateApi from 'Api/Category/CategoryCreateApi'

const NewCategory: FC = () => {
	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [Name, SetName] = useState('')

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			startTransition(async () => {
				try {
					await CategoryCreateApi({
						name: Name,
					})

					await Navigate('../')
				} catch (thrownError) {
					SetErrorText(HandleApiError(thrownError))
				}
			})
		},
		[Name, Navigate],
	)

	return (
		<PageContainer title={t('categories.new.title')}>
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
						value={Name}
						onChange={event => SetName(event.target.value)}
						label={t('categories.name')}
						variant='outlined'
						required
					/>
				</FormControl>
				<Button type='submit' variant='outlined' fullWidth loading={isPending}>
					{t('common.submit')}
				</Button>
			</Box>
		</PageContainer>
	)
}

export default NewCategory

export { NewCategory as Component }
