import { defineConfig, loadEnv } from 'vite'

import react from '@vitejs/plugin-react'

import { checker } from 'vite-plugin-checker'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'

import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const relativeAlias: Record<string, string> = {
	Components: './src/Components',
	Contexts: './src/Contexts',
	Utils: './src/Utils',
	Hooks: './src/Hooks',
	Constants: './src/Constants',
	Api: './src/Api',
	Pages: './src/Pages',
	Outlets: './src/Outlets',
	Stores: './src/Stores',
	'@accounting-app/common': '../common',
}

export const resolveAlias = Object.entries(relativeAlias).reduce(
	(prev: Record<string, string>, [key, path]) => {
		prev[key] = resolve(__dirname, path)

		return prev
	},
	{},
)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const envPrefix: string[] = ['APP_']

	const { PORT = '3000', OPEN_BROWSER = 'true' } = {
		...loadEnv(mode, process.cwd(), ''),
	}

	const base = '/'

	return {
		plugins: [
			react(),
			svgr(),
			mode === 'development'
				? checker({
						typescript: true,
						eslint: {
							useFlatConfig: true,
							lintCommand: 'lint:check',
						},
					})
				: null,
			VitePWA({
				devOptions: {
					enabled: false,
					type: 'module',
				},
				registerType: 'prompt',
				injectRegister: 'auto',
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
					sourcemap: true,
					navigateFallback: 'index.html',
				},
				manifest: {
					id: 'accounting-app',
					start_url: `${base}index.html`,
					name: 'Accounting App',
					short_name: 'Accounting App',
					description: 'Accounting App',
					theme_color: '#ffffff',
					background_color: '#ffffff',
					display: 'standalone',
					dir: 'ltr',
					icons: [
						{
							src: '/icons/web-app-manifest-192x192.png',
							sizes: '192x192',
							type: 'image/png',
							purpose: 'maskable',
						},
						{
							src: '/icons/web-app-manifest-512x512.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'maskable',
						},
					],
				},
			}),
		],
		resolve: {
			alias: resolveAlias,
		},
		server: {
			port: parseInt(PORT) || 3000,
			open: OPEN_BROWSER === 'true' ? true : false,
		},
		envPrefix,
		base,
		build: {
			outDir: 'build',
		},
	}
})
