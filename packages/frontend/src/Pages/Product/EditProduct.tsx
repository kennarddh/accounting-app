import { FC, SubmitEvent, useCallback, useEffect, useState, useTransition } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Alert, Box, Button, FormControl, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import ProductFindByIdApi from 'Api/Product/ProductFindByIdApi'
import ProductUpdateApi from 'Api/Product/ProductUpdateApi'

const EditProduct: FC = () => {
	const { id } = useParams()

	const [ErrorText, SetErrorText] = useState<string | null>(null)
	const [HasLoaded, SetHasLoaded] = useState(false)

	const [sku, setSku] = useState('')
	const [Name, SetName] = useState('')
	const [price, setPrice] = useState('')
	const [costPrice, setCostPrice] = useState('')
	const [categoryId, setCategoryId] = useState<string | null>(null)

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../../')

			try {
				const product = await ProductFindByIdApi({ id })

				setSku(product.sku)
				SetName(product.name)
				setPrice(product.price)
				setCostPrice(product.costPrice)
				setCategoryId(product.category.id)

				SetHasLoaded(true)
			} catch {
				await Navigate('../../')
			}
		}

		main().catch((error: unknown) => console.error('EditProduct load error', error))
	}, [Navigate, id])

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			if (!id) return
			if (!HasLoaded) return

			if (categoryId === null) return SetErrorText(t('errors.Product.CategoryRequired'))

			startTransition(async () => {
				try {
					await ProductUpdateApi({ id, name: Name, price, costPrice, categoryId })

					await Navigate('../../')
				} catch (thrownError) {
					SetErrorText(HandleApiError(thrownError))
				}
			})
		},
		[HasLoaded, Name, Navigate, id, price, costPrice, categoryId, t],
	)

	return (
		<PageContainer title={t('products.edit.title')}>
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
					<TextField value={sku} label={t('products.sku')} variant='outlined' disabled />
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

export default EditProduct

export { EditProduct as Component }
