import { FC, SubmitEvent, useCallback, useRef, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

import { Alert, Box, Button, FormControl, Snackbar, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'
import SelectCategory from 'Components/SelectResources/SelectCategory'

import HandleApiError from 'Utils/HandleApiError'

import ProductCreateApi from 'Api/Product/ProductCreateApi'

const NewProduct: FC = () => {
	const [ErrorText, SetErrorText] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	const [sku, setSku] = useState('')
	const [Name, SetName] = useState('')
	const [price, setPrice] = useState('')
	const [costPrice, setCostPrice] = useState('')
	const [categoryId, setCategoryId] = useState<string | null>(null)

	const [isPending, startTransition] = useTransition()
	const keepOpenRef = useRef(false)
	const Navigate = useNavigate()
	const { t } = useTranslation()

	const resetForm = () => {
		setSku('')
		SetName('')
		setPrice('')
		setCostPrice('')
		setCategoryId(null)
		SetErrorText(null)
	}

	const executeSubmit = useCallback(
		(keepOpen: boolean) => {
			if (categoryId === null) return SetErrorText(t('errors.Product.CategoryRequired'))

			keepOpenRef.current = keepOpen

			startTransition(async () => {
				try {
					await ProductCreateApi({
						name: Name,
						sku,
						price,
						costPrice,
						categoryId,
					})

					if (keepOpenRef.current) {
						setSuccessMessage(t('common.createdSuccessfully', { item: Name }))
						resetForm()
					} else {
						await Navigate('../')
					}
				} catch (thrownError) {
					SetErrorText(HandleApiError(thrownError))
				}
			})
		},
		[sku, Name, price, costPrice, categoryId, t, Navigate, SetErrorText],
	)

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			executeSubmit(false)
		},
		[executeSubmit],
	)

	return (
		<PageContainer title={t('products.new.title')}>
			<Box
				component='form'
				noValidate
				onSubmit={OnSubmit}
				sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
			>
				{ErrorText !== null ? (
					<Alert severity='error' sx={{ width: '100%', whiteSpace: 'pre-line' }}>
						{ErrorText}
					</Alert>
				) : null}

				<FormControl fullWidth>
					<TextField
						value={sku}
						onChange={event => setSku(event.target.value)}
						label={t('products.sku')}
						variant='outlined'
						required
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Name}
						onChange={event => SetName(event.target.value)}
						label={t('products.name')}
						variant='outlined'
						required
					/>
				</FormControl>
				<FormControl fullWidth>
					<MuiMoneyInput
						size='medium'
						label={t('products.price')}
						value={price}
						onChange={val => setPrice(val)}
						align='left'
						fullWidth
						required
						prefix='Rp '
					/>
				</FormControl>
				<FormControl fullWidth>
					<MuiMoneyInput
						size='medium'
						label={t('products.costPrice')}
						value={costPrice}
						onChange={val => setCostPrice(val)}
						align='left'
						fullWidth
						required
						prefix='Rp '
					/>
				</FormControl>
				<SelectCategory
					value={categoryId}
					onChange={setCategoryId}
					onError={SetErrorText}
				/>

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

export default NewProduct

export { NewProduct as Component }
