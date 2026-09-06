import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import { Box, TextField } from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/Admin/PageContainer'

import UserSessionFindByIdApi, {
	UserSessionFindByIdOutput,
} from 'Api/UserSession/UserSessionFindByIdApi'

const UserSessionDetail: FC = () => {
	const { id } = useParams()

	const [UserSession, SetUserSession] = useState<UserSessionFindByIdOutput | null>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	useEffect(() => {
		const main = async () => {
			if (!id) return await Navigate('../')

			try {
				const userSession = await UserSessionFindByIdApi({ id })

				SetUserSession(userSession)
			} catch {
				await Navigate('../')
			}
		}

		main().catch((error: unknown) => console.error('UserSessionDetail load error', error))
	}, [Navigate, id])

	// TODO: Show loading state
	if (UserSession === null) return null

	return (
		<PageContainer title={t('userSessions.detail.title')}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				<TextField
					value={UserSession.user.name}
					label={t('userSessions.user')}
					variant='outlined'
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
				<TextField
					value={UserSession.ipAddress}
					label={t('userSessions.ipAddress')}
					variant='outlined'
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
				<TextField
					value={t('common.dateTime', { date: UserSession.createdAt })}
					label={t('userSessions.createdAt')}
					variant='outlined'
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
				<TextField
					value={t('common.dateTime', { date: UserSession.expireAt })}
					label={t('userSessions.expireAt')}
					variant='outlined'
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
				<TextField
					value={t('common.dateTime', { date: UserSession.lastRefreshAt })}
					label={t('userSessions.lastRefreshAt')}
					variant='outlined'
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
				<TextField
					value={
						UserSession.loggedOutAt === null
							? ''
							: t('common.dateTime', { date: UserSession.loggedOutAt })
					}
					label={t('userSessions.loggedOutAt')}
					variant='outlined'
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
				<TextField
					value={
						UserSession.revokedAt === null
							? ''
							: t('common.dateTime', { date: UserSession.revokedAt })
					}
					label={t('userSessions.revokedAt')}
					variant='outlined'
					slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
				/>
			</Box>
		</PageContainer>
	)
}

export default UserSessionDetail

export { UserSessionDetail as Component }
