import { FC, SubmitEvent, useCallback, useRef, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

import { Alert, Box, Button, FormControl, Snackbar, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import SupplierCreateApi from 'Api/Supplier/SupplierCreateApi'

const NewSupplier: FC = () => {
	const [ErrorText, SetErrorText] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	const [code, setCode] = useState('')
	const [name, setName] = useState('')
	const [contact, setContact] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [address, setAddress] = useState('')
	const [terms, setTerms] = useState('Net 30')

	const [isPending, startTransition] = useTransition()
	const keepOpenRef = useRef(false)
	const navigate = useNavigate()
	const { t } = useTranslation()

	const resetForm = () => {
		setCode('')
		setName('')
		setContact('')
		setEmail('')
		setPhone('')
		setAddress('')
		setTerms('Net 30')
		SetErrorText(null)
	}

	const executeSubmit = useCallback(
		(keepOpen: boolean) => {
			keepOpenRef.current = keepOpen

			startTransition(async () => {
				try {
					await SupplierCreateApi({
						code,
						name,
						contact: contact || undefined,
						email: email || undefined,
						phone: phone || undefined,
						address: address || undefined,
						terms: terms || undefined,
					})

					if (keepOpenRef.current) {
						setSuccessMessage(t('common.createdSuccessfully', { item: name }))
						resetForm()
					} else {
						await navigate('../')
					}
				} catch (err) {
					SetErrorText(HandleApiError(err))
				}
			})
		},
		[address, code, contact, email, name, navigate, phone, t, terms],
	)

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()
			executeSubmit(false)
		},
		[executeSubmit],
	)

	return (
		<PageContainer title={t('suppliers.new.title')}>
			<Box
				component='form'
				noValidate
				onSubmit={OnSubmit}
				sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
			>
				{ErrorText !== null && (
					<Alert severity='error' sx={{ width: '100%', whiteSpace: 'pre-line' }}>
						{ErrorText}
					</Alert>
				)}

				<FormControl fullWidth>
					<TextField
						value={code}
						onChange={e => setCode(e.target.value)}
						label={t('suppliers.code')}
						variant='outlined'
						required
					/>
				</FormControl>

				<FormControl fullWidth>
					<TextField
						value={name}
						onChange={e => setName(e.target.value)}
						label={t('suppliers.name')}
						variant='outlined'
						required
					/>
				</FormControl>

				<FormControl fullWidth>
					<TextField
						value={contact}
						onChange={e => setContact(e.target.value)}
						label={t('suppliers.contact')}
						variant='outlined'
					/>
				</FormControl>

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							value={phone}
							onChange={e => setPhone(e.target.value)}
							label={t('suppliers.phone')}
							variant='outlined'
						/>
					</FormControl>

					<FormControl sx={{ flex: 1, minWidth: 200 }}>
						<TextField
							value={email}
							onChange={e => setEmail(e.target.value)}
							label={t('suppliers.email')}
							variant='outlined'
						/>
					</FormControl>
				</Box>

				<FormControl fullWidth>
					<TextField
						value={terms}
						onChange={e => setTerms(e.target.value)}
						label={t('suppliers.terms')}
						variant='outlined'
						placeholder='e.g. Net 30, Due upon receipt'
					/>
				</FormControl>

				<FormControl fullWidth>
					<TextField
						value={address}
						onChange={e => setAddress(e.target.value)}
						label={t('suppliers.address')}
						variant='outlined'
						multiline
						rows={2}
					/>
				</FormControl>

				<Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
					<Button
						type='submit'
						variant='contained'
						fullWidth
						loading={isPending && !keepOpenRef.current}
					>
						{t('common.submit')}
					</Button>
					<Button
						type='button'
						variant='outlined'
						fullWidth
						loading={isPending && keepOpenRef.current}
						onClick={() => executeSubmit(true)}
					>
						{t('common.saveAndCreateAnother')}
					</Button>
				</Box>
			</Box>

			<Snackbar
				open={successMessage !== null}
				autoHideDuration={4000}
				onClose={() => setSuccessMessage(null)}
				message={successMessage}
			/>
		</PageContainer>
	)
}

export default NewSupplier

export { NewSupplier as Component }
