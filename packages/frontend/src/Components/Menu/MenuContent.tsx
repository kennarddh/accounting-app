import { FC, JSX, useMemo } from 'react'

import { Link, useLocation } from 'react-router'

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

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
				icon: <HomeRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.users'),
				to: '/user',
				icon: <PeopleRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.userSessions'),
				to: '/user/session',
				icon: <HowToRegRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.accounts'),
				to: '/account',
				icon: <AccountBalanceRoundedIcon fontSize='small' />, // Chart of Accounts
			},
			{
				text: t('navigations.links.journal'),
				to: '/journal',
				icon: <MenuBookRoundedIcon fontSize='small' />, // Accounting Ledger / Journal Book
			},
			{
				text: t('navigations.links.categories'),
				to: '/category',
				icon: <CategoryRoundedIcon fontSize='small' />, // Product Categories
			},
			{
				text: t('navigations.links.products'),
				to: '/product',
				icon: <Inventory2RoundedIcon fontSize='small' />, // Products & Inventory
			},
			{
				text: t('navigations.links.stockAdjustments'),
				to: '/stock-adjustment',
				icon: <TuneRoundedIcon fontSize='small' />, // Adjustments / Corrections
			},
			{
				text: t('navigations.links.orders'),
				to: '/order',
				icon: <ShoppingCartRoundedIcon fontSize='small' />, // POS / Orders / Sales
			},
			{
				text: t('navigations.links.profitAndLoss'),
				to: '/report/profit-and-loss',
				icon: <AssessmentRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.trialBalance'),
				to: '/report/trial-balance',
				icon: <FactCheckRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.balanceSheet'),
				to: '/report/balance-sheet',
				icon: <AccountBalanceWalletRoundedIcon fontSize='small' />,
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
							selected={
								item.to === '/'
									? Location.pathname === '/'
									: Location.pathname.startsWith(item.to)
							}
							onClick={props.onClickLink}
						>
							{item.icon ? (
								<ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
							) : null}
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Stack>
	)
}

export default MenuContent
