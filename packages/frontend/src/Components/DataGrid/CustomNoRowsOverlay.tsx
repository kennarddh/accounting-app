import { FC } from 'react'

import BlockIcon from '@mui/icons-material/Block'
import ErrorIcon from '@mui/icons-material/Error'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'

import { Box, Typography } from '@mui/material'

import { useTranslation } from 'react-i18next'

export enum DataSourceErrorKind {
	Forbidden = 'Forbidden',
	NoConnection = 'NoConnnection',
	Unknown = 'Unknown',
}

const CustomNoRowsOverlay: FC<{ errorKind: DataSourceErrorKind | null }> = props => {
	const { t } = useTranslation()

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 1,
				height: '100%',
			}}
		>
			{props.errorKind === null ? (
				<>
					<PlaylistRemoveIcon fontSize='large' />
					<Typography align='center'>{t('errors.noData')}</Typography>
				</>
			) : props.errorKind === DataSourceErrorKind.NoConnection ? (
				<>
					<ErrorIcon fontSize='large' />
					<Typography align='center'>{t('errors.network.title')}</Typography>
					<Typography align='center'>{t('errors.network.text')}</Typography>
				</>
			) : props.errorKind === DataSourceErrorKind.Forbidden ? (
				<>
					<BlockIcon fontSize='large' />
					<Typography align='center'>{t('errors.accessDenied.title')}</Typography>
					<Typography align='center'>{t('errors.accessDenied.text')}</Typography>
				</>
			) : (
				<>
					<ErrorIcon fontSize='large' />
					<Typography align='center'>{t('errors.unknown.title')}</Typography>
					<Typography align='center'>{t('errors.unknown.text')}</Typography>
				</>
			)}
		</Box>
	)
}

export default CustomNoRowsOverlay
