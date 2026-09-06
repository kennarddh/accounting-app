import argon2 from 'argon2'

import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs/promises'

import { PrismaClient } from 'PrismaGenerated/client'

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

const main = async () => {
	if ((await prisma.user.count()) > 0) return

	let passwordHashSecret

	if (process.env.PASSWORD_HASH_SECRET_FILE) {
		// eslint-disable-next-line security/detect-non-literal-fs-filename
		passwordHashSecret = await fs.readFile(process.env.PASSWORD_HASH_SECRET_FILE, 'utf-8')
	} else {
		passwordHashSecret = process.env.PASSWORD_HASH_SECRET
	}

	if (!passwordHashSecret) {
		throw new Error('PASSWORD_HASH_SECRET is not set.')
	}

	const password = await argon2.hash('password', {
		hashLength: 64,
		secret: Buffer.from(passwordHashSecret),
	})

	await prisma.user.create({
		data: {
			name: 'Admin',
			username: 'admin',
			password,
		},
	})
}

try {
	await main()

	await prisma.$disconnect()
} catch (error) {
	console.error(error)

	await prisma.$disconnect()

	process.exit(1)
}
