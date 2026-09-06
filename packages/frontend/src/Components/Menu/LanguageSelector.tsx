import { FC, useCallback, useState } from 'react'

import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'

import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material'

import { useTranslation } from 'react-i18next'

import Languages from 'Constants/Languages'

const LanguageSelector: FC = () => {
	const [IsOpen, SetIsOpen] = useState(false)

	const [AnchorEl, SetAnchorEl] = useState<HTMLElement | null>(null)

	const { i18n, t } = useTranslation()

	const OnLanguageChange = useCallback(
		async (lang: (typeof Languages)[number]) => {
			await i18n.changeLanguage(lang.code)

			SetIsOpen(false)
		},
		[i18n],
	)

	return (
		<>
			<Tooltip title={t('languages.changeLanguage.tooltip')}>
				<IconButton
					onClick={event => {
						SetIsOpen(true)
						SetAnchorEl(event.currentTarget)
					}}
					size='small'
					sx={{ ml: 2 }}
				>
					<LanguageRoundedIcon />
				</IconButton>
			</Tooltip>
			<Menu anchorEl={AnchorEl} open={IsOpen} onClose={() => SetIsOpen(false)}>
				{Languages.map(language => (
					<MenuItem
						key={language.code}
						selected={i18n.language === language.code}
						onClick={() => OnLanguageChange(language)}
					>
						{t(`languages.languages.${language.code}`)}
					</MenuItem>
				))}
			</Menu>
		</>
	)
}

export default LanguageSelector
