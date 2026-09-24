import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Box, FormControl, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import ProductFindByIdApi, { ProductFindByIdOutput } from 'Api/Product/ProductFindByIdApi'

const ProductDetail: FC = () => {
	const { id } = useParams()

	const [Product, SetProduct] = useState<ProductFindByIdOutput | null>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../../')

			try {
				SetProduct(await ProductFindByIdApi({ id }))
			} catch {
				await Navigate('../../')
			}
		}

		main().catch((error: unknown) => console.error('ProductDetail load error', error))
	}, [Navigate, id])

	if (Product === null) return null

	return (
		<PageContainer title={t('products.detail.title')}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				<FormControl fullWidth>
					<TextField
						value={Product.sku}
						label={t('products.sku')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Product.name}
						label={t('products.name')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Product.price}
						label={t('products.price')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Product.costPrice}
						label={t('products.costPrice')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Product.currentStock}
						label={t('products.currentStock')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Product.category.name}
						label={t('products.category')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Product.createdAt}
						label={t('products.createdAt')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
			</Box>
		</PageContainer>
	)
}

export default ProductDetail

export { ProductDetail as Component }
