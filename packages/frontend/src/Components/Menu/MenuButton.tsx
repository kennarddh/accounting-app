import { FC } from 'react'

import { Badge, IconButton, IconButtonProps, badgeClasses } from '@mui/material'

interface Props extends IconButtonProps {
	showBadge?: boolean
	badgeContent?: number
}

const MenuButton: FC<Props> = ({ showBadge = false, badgeContent = 0, ...props }) => {
	return (
		<Badge
			color='error'
			invisible={!showBadge}
			badgeContent={badgeContent}
			sx={{ [`& .${badgeClasses.badge}`]: { right: 2, top: 2 } }}
		>
			<IconButton size='small' {...props} />
		</Badge>
	)
}

export default MenuButton
