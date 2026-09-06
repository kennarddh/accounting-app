import { FC, useCallback, useEffect, useState } from 'react'

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material'

import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'

enum ModalType {
	Error = 'Error',
	OfflineReady = 'OfflineReady',
	UpdateAvailable = 'UpdateAvailable',
}

const PWAManager: FC = () => {
	const [HasOfflineReadyModalShown, SetHasOfflineReadyModalShown] = useState<boolean>(
		() => localStorage.getItem('hasOfflineReadyModalShown') === '1',
	)

	const [CurrentModalType, SetCurrentModalType] = useState<ModalType | null>(null)

	const { t } = useTranslation()

	const {
		offlineReady: [OfflineReady, SetOfflineReady],
		needRefresh: [NeedRefresh, SetNeedRefresh],
		updateServiceWorker: UpdateServiceWorker,
	} = useRegisterSW({
		onRegistered(registration) {
			console.log('Service worker registered', registration)
		},
		onRegisteredSW(swUrl, registration) {
			if (registration !== undefined) {
				setInterval(
					async () => {
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
						if (registration.installing || !navigator) return

						if ('connection' in navigator && !navigator.onLine) return

						const resp = await fetch(swUrl, {
							cache: 'no-store',
							headers: {
								cache: 'no-store',
								'cache-control': 'no-cache',
							},
						})

						if (resp.status === 200) await registration.update()
					},
					60 * 60 * 1000,
				)
			}
		},
		onRegisterError(error) {
			console.log('Service worker registration error', error)

			SetCurrentModalType(ModalType.Error)
		},
	})

	const Close = useCallback(() => {
		SetOfflineReady(false)
		SetNeedRefresh(false)
		SetCurrentModalType(null)
	}, [SetOfflineReady, SetNeedRefresh])

	useEffect(() => {
		if (!OfflineReady) return
		if (CurrentModalType !== null) return
		if (HasOfflineReadyModalShown) return

		// eslint-disable-next-line react-hooks/set-state-in-effect
		SetHasOfflineReadyModalShown(true)

		SetCurrentModalType(ModalType.OfflineReady)
	}, [OfflineReady, CurrentModalType, HasOfflineReadyModalShown])

	useEffect(() => {
		if (!NeedRefresh) return
		if (CurrentModalType !== null) return

		// eslint-disable-next-line react-hooks/set-state-in-effect
		SetCurrentModalType(ModalType.UpdateAvailable)
	}, [NeedRefresh, CurrentModalType])

	useEffect(() => {
		localStorage.setItem('hasOfflineReadyModalShown', HasOfflineReadyModalShown ? '1' : '0')
	}, [HasOfflineReadyModalShown])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (!OfflineReady) SetHasOfflineReadyModalShown(false)
	}, [OfflineReady])

	return (
		<Dialog open={CurrentModalType !== null} onClose={Close}>
			<DialogTitle>
				{CurrentModalType !== null ? t(`pwa.manager.modal.${CurrentModalType}.title`) : ''}
			</DialogTitle>
			<DialogContent>
				<DialogContentText>
					{CurrentModalType !== null
						? t(`pwa.manager.modal.${CurrentModalType}.description`)
						: ''}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={Close}>{t('common.close')}</Button>
				{CurrentModalType === ModalType.UpdateAvailable ? (
					<Button onClick={() => UpdateServiceWorker(true)}>
						{t('pwa.manager.modal.UpdateAvailable.update')}
					</Button>
				) : null}
			</DialogActions>
		</Dialog>
	)
}

export default PWAManager
