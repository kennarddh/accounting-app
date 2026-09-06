/// <reference types="vite/client" />

declare module '*.css'
declare module '@fontsource/*'
declare module '@fontsource-variable/*'

// Declare env types here
interface ImportMetaEnv {
	readonly APP_API_SERVER_URL: string
}

interface ImportMeta {
	readonly env: Readonly<ImportMetaEnv>
}
