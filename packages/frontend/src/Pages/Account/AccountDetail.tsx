import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Box, FormControl, MenuItem, TextField } from '@mui/material'

import { AccountType } from '@sport-score/common'
import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

import AccountFindByIdApi, { AccountFindByIdOutput } from 'Api/Account/AccountFindByIdApi'

const AccountDetail: FC = () => {
	const { id } = useParams()

	const [Account, SetAccount] = useState<AccountFindByIdOutput | null>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../../')

			try {
				const team = await AccountFindByIdApi({ id })

				SetAccount(team)
			} catch {
				await Navigate('../../')
			}
		}

		main().catch((error: unknown) => console.error('AccountDetail load error', error))
	}, [Navigate, id])

	if (Account === null) return null

	return (
		<PageContainer title={t('accounts.detail.title')}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				<FormControl fullWidth>
					<TextField
						value={Account.code}
						label={t('accounts.code')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Account.name}
						label={t('accounts.name')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						select
						defaultValue={Account.type}
						label={t('accounts.type')}
						variant='outlined'
						disabled
					>
						{Object.values(AccountType).map(type => (
							<MenuItem key={type} value={type}>
								{t(`accounts.enum.type.${type}`)}
							</MenuItem>
						))}
					</TextField>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={Account.createdAt}
						label={t('accounts.createdAt')}
						variant='outlined'
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
					/>
				</FormControl>
			</Box>
		</PageContainer>
	)
}

export default AccountDetail

export { AccountDetail as Component }
