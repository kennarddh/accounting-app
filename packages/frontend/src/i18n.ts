// eslint-disable-next-line import-x/no-named-as-default
import i18n from 'i18next'
import detector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'

import { FormatDuration } from 'Utils/FormatDuration'

const locales = import.meta.glob('./Locales/**/*.json')

await i18n
	.use(detector)
	.use(initReactI18next)
	.use(
		resourcesToBackend(async (language: string, namespace: string) => {
			const path = `./Locales/${language}/${namespace}.json`

			if (!locales[path]) {
				throw new Error(`Localization file not found: ${path}`)
			}

			const module = (await locales[path]()) as { default: Record<string, unknown> }
			return module.default
		}),
	)
	.init({
		supportedLngs: ['en'],
		lng: 'en',
		fallbackLng: 'en',
		ns: ['translations'],
		defaultNS: 'translations',
		fallbackNS: 'translations',
		interpolation: {
			escapeValue: false,
		},
		debug: import.meta.env.DEV,
	})

i18n.services.formatter?.add('duration', (value: number) => {
	return FormatDuration(value)
})

export default i18n
