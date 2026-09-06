import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const Config = defineConfig({
	schema: './prisma/',
	migrations: {
		path: './prisma/migrations',
		seed: 'tsx --env-file=.env ./prisma/seed.ts',
	},
	datasource: {
		url: env('DATABASE_URL'),
	},
	typedSql: {
		path: './prisma/sql',
	},
})

export default Config
