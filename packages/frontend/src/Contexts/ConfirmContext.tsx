import { FC, ReactNode, createContext, useCallback, useState } from 'react'

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material'

import { useTranslation } from 'react-i18next'

export interface ConfirmOptions {
	title: string
	content: string
	confirmText?: string
	cancelText?: string
	confirmColor?: 'primary' | 'error' | 'warning' | 'info' | 'success'
}

interface ConfirmContextValue {
	confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextValue>({
	confirm: async () => false,
})

export const ConfirmProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const { t } = useTranslation()
	const [options, setOptions] = useState<ConfirmOptions | null>(null)
	const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

	const confirm = useCallback((opts: ConfirmOptions) => {
		return new Promise<boolean>(resolve => {
			setOptions(opts)
			setResolveRef(() => resolve)
		})
	}, [])

	const handleClose = (result: boolean) => {
		if (resolveRef) resolveRef(result)
		setOptions(null)
		setResolveRef(null)
	}

	return (
		<ConfirmContext.Provider value={{ confirm }}>
			{children}
			<Dialog
				open={options !== null}
				onClose={() => handleClose(false)}
				maxWidth='xs'
				fullWidth
			>
				<DialogTitle>{options?.title}</DialogTitle>
				<DialogContent>
					<DialogContentText>{options?.content}</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => handleClose(false)}>
						{options?.cancelText ?? t('common.cancel')}
					</Button>
					<Button
						variant='contained'
						color={options?.confirmColor ?? 'error'}
						onClick={() => handleClose(true)}
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus
					>
						{options?.confirmText ?? t('common.yes')}
					</Button>
				</DialogActions>
			</Dialog>
		</ConfirmContext.Provider>
	)
}
