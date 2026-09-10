import React from 'react'

import { TextField } from '@mui/material'

import { NumericFormat } from 'react-number-format'

export interface MuiMoneyInputProps {
	value: string
	onChange?: (value: string) => void
	placeholder?: string
	disabled?: boolean
	size?: 'small' | 'medium'
	error?: boolean
}

const NumberInput: React.ComponentType<any> = NumericFormat

export const MuiMoneyInput: React.FC<MuiMoneyInputProps> = ({
	value,
	onChange,
	placeholder = '0.00',
	disabled = false,
	size = 'small',
	error = false,
}) => {
	return (
		<NumberInput
			customInput={TextField}
			value={value}
			onValueChange={(values: any) => onChange?.(values.value)}
			thousandSeparator=','
			decimalSeparator='.'
			decimalScale={4}
			allowNegative={false}
			isAllowed={(values: any) => {
				const [integerPart] = values.value.split('.')

				return (integerPart || '').length <= 24
			}}
			placeholder={placeholder}
			disabled={disabled}
			size={size}
			error={error}
			slotProps={{
				htmlInput: {
					style: { textAlign: 'right', fontFamily: 'monospace' },
				},
			}}
		/>
	)
}
