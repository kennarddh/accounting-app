import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Box, FormControl, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import CategoryFindByIdApi, { CategoryFindByIdOutput } from 'Api/Category/CategoryFindByIdApi'

const CategoryDetail: FC = () => {
	const { id } = useParams()

	const [Category, SetCategory] = useState<CategoryFindByIdOutput | null>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../../')

			try {
				SetCategory(await CategoryFindByIdApi({ id }))
			} catch {
				await Navigate('../../')
			}
		}

		main().catch((error: unknown) => console.error('CategoryDetail load error', error))
	}, [Navigate, id])

	if (Category === null) return null

	return (
		<PageContainer title={t('categories.detail.title')}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				<FormControl fullWidth>
					<TextField
						value={Category.name}
						label={t('categories.name')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Category.createdAt}
						label={t('categories.createdAt')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
			</Box>
		</PageContainer>
	)
}

export default CategoryDetail

export { CategoryDetail as Component }
