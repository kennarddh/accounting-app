import { BuildOptions, Plugin } from 'esbuild'

// https://github.com/evanw/esbuild/issues/2811#issuecomment-1377669894
const externalizeAllPackagesExceptPlugin = (noExternals: string[]): Plugin => {
	return {
		name: 'noExternal-plugin',
		setup(build) {
			if (noExternals.length > 0) {
				build.onResolve({ filter: /(.*)/ }, args => {
					if (args.path.startsWith('./') || args.path.startsWith('../')) return

					if (!['import-statement', 'dynamic-import'].includes(args.kind)) return

					for (const noExternal of noExternals) {
						if (args.path.startsWith(noExternal)) return
					}

					return { path: args.path, external: true }
				})
			}
		},
	}
}

const esbuildOptions = {
	entryPoints: ['./src/index.ts'],
	outdir: './build/',
	bundle: true,
	sourcemap: true,
	format: 'esm',
	platform: 'node',
	minify: true,
	target: 'esnext',
	tsconfig: './tsconfig.json',
	define: {
		'process.env.NODE_ENV': "'production'",
	},
	plugins: [
		externalizeAllPackagesExceptPlugin([
			'Controllers',
			'Middlewares',
			'Modules',
			'Repositories',
			'Types',
			'Utils',
			'Validations',
			'@accounting-app/common',
			'PrismaGenerated',
			'App',
			'Errors',
			'Routes',
		]),
	],
} satisfies BuildOptions as BuildOptions

export default esbuildOptions
