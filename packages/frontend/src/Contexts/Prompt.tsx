import { FC, SubmitEvent, createContext, useCallback, useId, useState } from 'react'

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	TextField,
} from '@mui/material'

import { useTranslation } from 'react-i18next'

export interface PromptProviderProps {
	children: React.ReactNode
}

export interface PromptConfig {
	title: string
	contentText: string
	inputLabel: string
	buttonLabel: string
}

export interface PromptConfigInternal {
	title: string
	contentText: string
	inputLabel: string
	buttonLabel: string
	resolve: (value: string | null) => void
}

export interface PromptContextValue {
	ShowPrompt: (config: PromptConfig) => Promise<string | null>
}

export const PromptContext = createContext<PromptContextValue>({
	ShowPrompt: async () => null,
})

const PromptProvider: FC<PromptProviderProps> = ({ children }) => {
	const { t } = useTranslation()

	const [PromptConfigInternal, SetPromptConfigInternal] = useState<PromptConfigInternal | null>(
		null,
	)

	const [Value, SetValue] = useState('')

	const ShowPrompt = useCallback((config: PromptConfig) => {
		SetValue('')

		return new Promise<string | null>(resolve => {
			SetPromptConfigInternal({ ...config, resolve })
		})
	}, [])

	const HandleClose = useCallback(
		(event: SubmitEvent<HTMLFormElement> | null, value: string | null) => {
			if (event) {
				event.preventDefault()
			}

			PromptConfigInternal?.resolve(value)

			SetPromptConfigInternal(null)
			SetValue('')
		},
		[PromptConfigInternal],
	)

	const Id = useId()

	return (
		<PromptContext.Provider value={{ ShowPrompt }}>
			{children}
			<Dialog open={PromptConfigInternal !== null} onClose={() => HandleClose(null, null)}>
				<DialogTitle>{PromptConfigInternal?.title}</DialogTitle>
				<DialogContent>
					<DialogContentText>{PromptConfigInternal?.contentText}</DialogContentText>
					<form onSubmit={event => HandleClose(event, Value)} id={Id}>
						<TextField
							required
							label={PromptConfigInternal?.inputLabel}
							fullWidth
							variant='standard'
							value={Value}
							onChange={e => SetValue(e.target.value)}
						/>
					</form>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => HandleClose(null, null)}>{t('common.cancel')}</Button>
					<Button type='submit' form={Id}>
						{PromptConfigInternal?.buttonLabel}
					</Button>
				</DialogActions>
			</Dialog>
		</PromptContext.Provider>
	)
}

export default PromptProvider
