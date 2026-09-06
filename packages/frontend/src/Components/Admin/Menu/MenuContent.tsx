import { FC, JSX, useMemo } from 'react'

import { Link, useLocation } from 'react-router'

import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'

import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material'

import { useTranslation } from 'react-i18next'

export interface MenuListItem {
	text: string
	to: string
	icon?: JSX.Element
}

const MenuContent: FC<{ onClickLink?: () => void }> = props => {
	const Location = useLocation()

	const { t } = useTranslation()

	const MenuListItems = useMemo<MenuListItem[]>(
		() => [
			{
				text: t('navigations.links.home'),
				to: '/',
				icon: <HomeRoundedIcon />,
			},
			{
				text: t('navigations.links.users'),
				to: '/user',
				icon: <PeopleRoundedIcon />,
			},
			{
				text: t('navigations.links.userSessions'),
				to: '/user/session',
				icon: <HowToRegRoundedIcon />,
			},
			{
				text: t('navigations.links.accounts'),
				to: '/account',
				icon: <Inventory2RoundedIcon />,
			},
		],
		[t],
	)

	return (
		<Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
			<List dense>
				{MenuListItems.map((item, index) => (
					<ListItem key={index} disablePadding sx={{ display: 'block' }}>
						<ListItemButton
							component={Link}
							to={item.to}
							selected={Location.pathname === item.to}
							onClick={props.onClickLink}
						>
							{item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Stack>
	)
}

export default MenuContent
