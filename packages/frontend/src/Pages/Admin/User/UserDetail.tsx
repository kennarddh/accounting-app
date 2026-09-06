import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Box, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/Admin/PageContainer'

import UserFindByIdApi from 'Api/User/UserFindByIdApi'

const UserDetail: FC = () => {
	const { id } = useParams()

	const [Name, SetName] = useState('')
	const [Username, SetUsername] = useState('')
	const [CreatedBy, SetCreatedBy] = useState<{ id: string; name: string } | null>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../')

			try {
				const user = await UserFindByIdApi({ id })

				SetName(user.name)
				SetUsername(user.username)
				SetCreatedBy(user.createdBy)
			} catch {
				await Navigate('../')
			}
		}

		main().catch((error: unknown) => console.error('UserDetail load error', error))
	}, [Navigate, id])

	return (
		<PageContainer title={t('users.detail.title')}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				<TextField
					value={Username}
					label={t('users.username')}
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
				<TextField
					value={Name}
					label={t('users.name')}
					variant='outlined'
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
				<TextField
					value={CreatedBy?.name ?? t('users.noCreatedBy')}
					label={t('users.createdBy')}
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
			</Box>
		</PageContainer>
	)
}

export default UserDetail

export { UserDetail as Component }
