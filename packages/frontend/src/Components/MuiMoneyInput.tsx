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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			onValueChange={(values: any) => onChange?.(values.value)}
			thousandSeparator=','
			decimalSeparator='.'
			decimalScale={4}
			allowNegative={false}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			isAllowed={(values: any) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				const [integerPart] = values.value.split('.')

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				return (integerPart ?? '').length <= 24
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
