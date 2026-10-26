import { FC, JSX, useCallback, useMemo, useState } from 'react'

import { Link, useLocation } from 'react-router'

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded'

import {
	Collapse,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Stack,
} from '@mui/material'

import { useTranslation } from 'react-i18next'

export interface MenuListItem {
	text: string
	to?: string
	icon?: JSX.Element
	defaultOpen?: boolean
	children?: MenuListItem[]
}

// Helper: recursively checks if current URL matches an item or any of its descendants
const isPathActive = (to: string | undefined, pathname: string): boolean => {
	if (!to) return false
	return to === '/' ? pathname === '/' : pathname.startsWith(to)
}

const hasActiveChild = (item: MenuListItem, pathname: string): boolean => {
	if (isPathActive(item.to, pathname)) return true
	if (item.children) {
		return item.children.some(child => hasActiveChild(child, pathname))
	}
	return false
}

// Recursive Nav Menu Item Component
interface NavItemProps {
	item: MenuListItem
	level?: number
	onClickLink?: (() => void) | undefined
}

const NavMenuItem: FC<NavItemProps> = ({ item, level = 0, onClickLink }) => {
	const location = useLocation()
	const hasChildren = Boolean(item.children && item.children.length > 0)

	// Defaults to open if specified in config OR if a child route is currently active
	const [isOpen, setIsOpen] = useState<boolean>(() => {
		if (hasActiveChild(item, location.pathname)) return true
		return Boolean(item.defaultOpen)
	})

	const handleToggle = useCallback(() => {
		setIsOpen(prev => !prev)
	}, [])

	const isSelected = item.to ? isPathActive(item.to, location.pathname) : false

	if (hasChildren && item.children) {
		return (
			<>
				<ListItem disablePadding sx={{ display: 'block' }}>
					<ListItemButton
						onClick={handleToggle}
						sx={{
							pl: 1.5 + level * 2,
							py: 0.75,
							borderRadius: 1,
							mx: 0.5,
							mb: 0.25,
						}}
					>
						{item.icon ? (
							<ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
								{item.icon}
							</ListItemIcon>
						) : null}
						<ListItemText
							primary={item.text}
							slotProps={{
								primary: {
									sx: {
										fontSize: '0.875rem',
										fontWeight: 600,
										color: 'text.primary',
									},
								},
							}}
						/>
						{isOpen ? (
							<ExpandLessRoundedIcon
								fontSize='small'
								sx={{ color: 'text.secondary' }}
							/>
						) : (
							<ExpandMoreRoundedIcon
								fontSize='small'
								sx={{ color: 'text.secondary' }}
							/>
						)}
					</ListItemButton>
				</ListItem>

				<Collapse in={isOpen} timeout='auto' unmountOnExit>
					<List component='div' disablePadding dense>
						{item.children.map(child => (
							<NavMenuItem
								key={child.to ?? child.text}
								item={child}
								level={level + 1}
								onClickLink={onClickLink}
							/>
						))}
					</List>
				</Collapse>
			</>
		)
	}

	return (
		<ListItem disablePadding sx={{ display: 'block' }}>
			<ListItemButton
				component={Link}
				to={item.to ?? '#'}
				selected={isSelected}
				onClick={onClickLink}
				sx={{
					pl: 1.5 + level * 2,
					py: 0.75,
					borderRadius: 1,
					mx: 0.5,
					mb: 0.25,
					'&.Mui-selected': {
						backgroundColor: 'action.selected',
						fontWeight: 600,
					},
				}}
			>
				{item.icon ? (
					<ListItemIcon
						sx={{
							minWidth: 36,
							color: isSelected ? 'primary.main' : 'text.secondary',
						}}
					>
						{item.icon}
					</ListItemIcon>
				) : null}
				<ListItemText
					primary={item.text}
					slotProps={{
						primary: {
							sx: {
								fontSize: '0.85rem',
								fontWeight: isSelected ? 600 : 400,
							},
						},
					}}
				/>
			</ListItemButton>
		</ListItem>
	)
}

const MenuContent: FC<{ onClickLink?: () => void }> = ({ onClickLink }) => {
	const { t } = useTranslation()

	const menuTree = useMemo<MenuListItem[]>(
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
				icon: <AccountBalanceRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.journal'),
				to: '/journal',
				icon: <MenuBookRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.categories'),
				to: '/category',
				icon: <CategoryRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.products'),
				to: '/product',
				icon: <Inventory2RoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.stockAdjustments'),
				to: '/stock-adjustment',
				icon: <TuneRoundedIcon fontSize='small' />,
			},
			{
				text: t('navigations.links.orders'),
				to: '/order',
				icon: <ShoppingCartRoundedIcon fontSize='small' />,
			},
			// Collapsible Reports Tree (Defaults to OPEN)
			{
				text: t('navigations.links.reports'),
				icon: <AssessmentRoundedIcon fontSize='small' />,
				defaultOpen: true,
				children: [
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
					{
						text: t('navigations.links.generalLedger'),
						to: '/report/general-ledger',
						icon: <ReceiptRoundedIcon fontSize='small' />,
					},
					{
						text: t('navigations.links.zReport'),
						to: '/report/z-report',
						icon: <PointOfSaleRoundedIcon fontSize='small' />,
					},
					{
						text: t('navigations.links.salesByProduct'),
						to: '/report/sales-by-product',
						icon: <LeaderboardRoundedIcon fontSize='small' />,
					},
					{
						text: t('navigations.links.inventoryValuation'),
						to: '/report/inventory-valuation',
						icon: <WarehouseRoundedIcon fontSize='small' />,
					},
				],
			},
		],
		[t],
	)

	return (
		<Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
			<List dense disablePadding>
				{menuTree.map(item => (
					<NavMenuItem
						key={item.to ?? item.text}
						item={item}
						level={0}
						onClickLink={onClickLink}
					/>
				))}
			</List>
		</Stack>
	)
}

export default MenuContent
