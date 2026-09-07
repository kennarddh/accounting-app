import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const databaseUrl = process.env.DATABASE_URL ?? env('DATABASE_URL')

const Config = defineConfig({
	schema: './prisma/',
	migrations: {
		path: './prisma/migrations',
		seed: 'tsx --env-file=.env ./prisma/seed.ts',
	},
	datasource: {
		url: databaseUrl,
	},
	typedSql: {
		path: './prisma/sql',
	},
})

export default Config
