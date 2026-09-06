import { FC } from 'react'

import { useMediaQuery } from '@mui/material'

import DesktopHeader from './DesktopHeader'
import MobileHeader from './MobileHeader'
import SideMenu from './SideMenu'

const Header: FC = () => {
	const IsDesktop = useMediaQuery(theme => theme.breakpoints.up('md'))

	return IsDesktop ? (
		<>
			<DesktopHeader />
			<SideMenu />
		</>
	) : (
		<MobileHeader />
	)
}

export default Header
