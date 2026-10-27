import { Localization, enUS, idID } from '@mui/material/locale'
import { enUS as dataGridEnUS, idID as dataGridIdID } from '@mui/x-data-grid/locales'
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
	id: {
		material: idID,
		dataGrid: dataGridIdID,
		datePicker: datePickerEnUS,
	},
} as const

export const DefaultMUILocale = MUILocaleMap.en

export default MUILocaleMap
