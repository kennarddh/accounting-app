import { FC } from 'react'

import AddIcon from '@mui/icons-material/Add'

import { Tooltip } from '@mui/material'
import { Toolbar, ToolbarButton } from '@mui/x-data-grid'

import { useTranslation } from 'react-i18next'

interface EditToolbarProps {
	onCreate: () => void
}

const EditToolbar: FC<EditToolbarProps> = props => {
	const { t } = useTranslation()

	return (
		<Toolbar>
			<Tooltip title={t('common.create')}>
				<ToolbarButton onClick={props.onCreate}>
					<AddIcon fontSize='small' />
				</ToolbarButton>
			</Tooltip>
		</Toolbar>
	)
}

export default EditToolbar
