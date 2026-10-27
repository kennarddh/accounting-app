import { FC, SubmitEvent, useCallback, useEffect, useState, useTransition } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Alert, Box, Button, CircularProgress, FormControl, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import SupplierFindByIdApi from 'Api/Supplier/SupplierFindByIdApi'
import SupplierUpdateApi from 'Api/Supplier/SupplierUpdateApi'

const EditSupplier: FC = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { t } = useTranslation()

	const [ErrorText, SetErrorText] = useState<string | null>(null)
	const [hasLoaded, setHasLoaded] = useState(false)

	const [code, setCode] = useState('')
	const [name, setName] = useState('')
	const [contact, setContact] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [address, setAddress] = useState('')
	const [terms, setTerms] = useState('')

	const [isPending, startTransition] = useTransition()

	useEffect(() => {
		const load = async () => {
			if (!id) return
			try {
				const s = await SupplierFindByIdApi({ id })
				setCode(s.code)
				setName(s.name)
				setContact(s.contact ?? '')
				setEmail(s.email ?? '')
				setPhone(s.phone ?? '')
				setAddress(s.address ?? '')
				setTerms(s.terms ?? '')
				setHasLoaded(true)
			} catch {
				await navigate('../../')
			}
		}
		void load()
	}, [id, navigate])

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()
			if (!id || !hasLoaded) return

			startTransition(async () => {
				try {
					await SupplierUpdateApi({
						id,
						code,
						name,
						contact: contact || undefined,
						email: email || undefined,
						phone: phone || undefined,
						address: address || undefined,
						terms: terms || undefined,
					})
					await navigate('../../')
				} catch (err) {
					SetErrorText(HandleApiError(err))
				}
			})
		},
		[id, hasLoaded, code, name, contact, email, phone, address, terms, navigate],
	)

	return (
		<PageContainer title={t('suppliers.edit.title')}>
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

				{!hasLoaded ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
						<CircularProgress />
					</Box>
				) : (
					<>
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

						<Button type='submit' variant='contained' fullWidth loading={isPending}>
							{t('common.submit')}
						</Button>
					</>
				)}
			</Box>
		</PageContainer>
	)
}

export default EditSupplier

export { EditSupplier as Component }
