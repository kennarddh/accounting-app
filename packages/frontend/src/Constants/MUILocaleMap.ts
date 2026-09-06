import { Localization, enUS } from '@mui/material/locale'
import { enUS as dataGridEnUS } from '@mui/x-data-grid/locales'
import { enUS as datePickerEnUS } from '@mui/x-date-pickers/locales'

export type LocaleMap = Record<
	string,
	{
		material: Localization
		dataGrid: Localization
	}
>

const MUILocaleMap = {
	en: {
		material: enUS,
		dataGrid: dataGridEnUS,
		datePicker: datePickerEnUS,
	},
} as const

export const DefaultMUILocale = MUILocaleMap.en

export default MUILocaleMap
