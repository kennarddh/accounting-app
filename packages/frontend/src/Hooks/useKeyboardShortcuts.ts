import { useEffect } from 'react'

export interface ShortcutMap {
	/** e.g. 'ctrl+s' or 'cmd+s' */
	onSave?: () => void
	/** e.g. 'ctrl+n' or 'cmd+n' */
	onNew?: () => void
	/** e.g. 'Escape' */
	onCancel?: () => void
}

const useKeyboardShortcuts = (shortcuts: ShortcutMap) => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isMac = navigator.platform.toUpperCase().includes('MAC')
			const modifier = isMac ? event.metaKey : event.ctrlKey

			// Ctrl / Cmd + S -> Save/Submit
			if (modifier && (event.key === 's' || event.key === 'S')) {
				if (shortcuts.onSave) {
					event.preventDefault()
					shortcuts.onSave()
				}
			}

			// Ctrl / Cmd + N -> New
			if (modifier && (event.key === 'n' || event.key === 'N')) {
				if (shortcuts.onNew) {
					event.preventDefault()
					shortcuts.onNew()
				}
			}

			// Escape -> Cancel / Close
			if (event.key === 'Escape') {
				if (shortcuts.onCancel) {
					event.preventDefault()
					shortcuts.onCancel()
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [shortcuts])
}

export default useKeyboardShortcuts
