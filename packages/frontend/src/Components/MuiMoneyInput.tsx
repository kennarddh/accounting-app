import React from 'react'

import { TextField } from '@mui/material'

import { NumericFormat } from 'react-number-format'

export interface MuiMoneyInputProps {
	value: string
	onChange?: (value: string) => void
	label?: string
	placeholder?: string
	disabled?: boolean
	required?: boolean
	fullWidth?: boolean
	helperText?: React.ReactNode
	size?: 'small' | 'medium'
	error?: boolean
	align?: 'left' | 'right' // Allows toggling text alignment
	prefix?: string // e.g. "$ " or "Rp "
	name?: string
	id?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NumberInput: React.ComponentType<any> = NumericFormat

export const MuiMoneyInput: React.FC<MuiMoneyInputProps> = ({
	value,
	onChange,
	label,
	placeholder = '0.00',
	disabled = false,
	required = false,
	fullWidth = false,
	helperText,
	size = 'small',
	error = false,
	align = 'right', // Defaults to right, but can be 'left'
	prefix,
	name,
	id,
}) => {
	return (
		<NumberInput
			customInput={TextField}
			id={id}
			name={name}
			label={label}
			required={required}
			fullWidth={fullWidth}
			helperText={helperText}
			value={value}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			onValueChange={(values: any) => onChange?.(values.value)}
			thousandSeparator=','
			decimalSeparator='.'
			decimalScale={4}
			allowNegative={false}
			prefix={prefix}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			isAllowed={(values: any) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				const [integerPart] = values.value.split('.')
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				return (integerPart ?? '').length <= 24
			}}
			placeholder={`${prefix ?? ''}${placeholder}`}
			disabled={disabled}
			size={size}
			error={error}
			slotProps={{
				htmlInput: {
					style: { textAlign: align, fontFamily: 'monospace' },
				},
			}}
		/>
	)
}
