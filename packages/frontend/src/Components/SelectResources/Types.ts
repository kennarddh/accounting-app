import { RefObject } from 'react'

import { ButtonProps } from '@mui/material'

export interface SelectResourceHandle {
	selectedLabel: string | null
}

export interface ActiveSelectResourceProps {
	disabled?: never
	value: string | null
	onChange: (value: string | null) => void
	onError: (error: string) => void
	slotProps?: {
		button?: ButtonProps
	}
	ref?: RefObject<SelectResourceHandle | null>
	shrinkedText?: string
}

export interface DisabledSelectResourceProps {
	disabled: true
	value: string | null
	onError: (error: string) => void
	shrinkedText?: string
	onChange?: never
	slotProps?: never
	ref?: never
}

export type SelectResourceProps = ActiveSelectResourceProps | DisabledSelectResourceProps
