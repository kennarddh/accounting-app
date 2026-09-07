import argon2 from 'argon2'

import { AccountType } from '@accounting-app/common'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs/promises'

import { PrismaClient } from './generated/client'

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
	adapter,
})

const defaultAccounts = [
	{ code: '101', name: 'Cash', type: AccountType.Asset },
	{ code: '102', name: 'Account Receivable', type: AccountType.Asset },
	{ code: '103', name: 'Supplies', type: AccountType.Asset },
	{ code: '111', name: 'Prepaid Insurance', type: AccountType.Asset },
	{ code: '112', name: 'Prepaid Rent', type: AccountType.Asset },
	{ code: '113', name: 'Prepaid Advertising', type: AccountType.Asset },
	{ code: '114', name: 'Prepaid Expense', type: AccountType.Asset },
	{ code: '115', name: 'Prepaid Salaries', type: AccountType.Asset },
	{ code: '121', name: 'Equipment', type: AccountType.Asset },
	{ code: '122', name: 'Vehicle', type: AccountType.Asset },
	{ code: '123', name: 'Machinery', type: AccountType.Asset },
	{ code: '124', name: 'Land', type: AccountType.Asset },
	{ code: '125', name: 'Building', type: AccountType.Asset },
	{ code: '131', name: 'Accumulated Depreciation of Building', type: AccountType.Asset },
	{ code: '132', name: 'Accumulated Depreciation of Equipment', type: AccountType.Asset },
	{ code: '133', name: 'Accumulated Depreciation of Vehicle', type: AccountType.Asset },
	{ code: '134', name: 'Accumulated Depreciation of Machinery', type: AccountType.Asset },
	{ code: '141', name: 'Patent', type: AccountType.Asset },
	{ code: '142', name: 'Copy Right', type: AccountType.Asset },
	{ code: '143', name: 'Goodwill', type: AccountType.Asset },
	{ code: '144', name: 'Trade Mark', type: AccountType.Asset },
	{ code: '201', name: 'Account Payable', type: AccountType.Liability },
	{ code: '202', name: 'Bank Payable', type: AccountType.Liability },
	{ code: '203', name: 'Rent Payable', type: AccountType.Liability },
	{ code: '204', name: 'Salaries Payable', type: AccountType.Liability },
	{ code: '205', name: 'Expense Payable', type: AccountType.Liability },
	{ code: '210', name: 'Deferred Rent', type: AccountType.Liability },
	{ code: '211', name: 'Deferred Revenue', type: AccountType.Liability },
	{ code: '301', name: 'Equity', type: AccountType.Equity },
	{ code: '302', name: 'Withdrawals', type: AccountType.Equity },
	{ code: '303', name: 'Income Summary', type: AccountType.Equity },
	{ code: '401', name: 'Service Revenue', type: AccountType.Revenue },
	{ code: '41', name: 'Others Income', type: AccountType.Revenue },
	{ code: '411', name: 'Interest Revenue', type: AccountType.Revenue },
	{ code: '412', name: 'Rent Revenue', type: AccountType.Revenue },
	{ code: '511', name: 'Advertising Expense', type: AccountType.Expense },
	{ code: '512', name: 'Rent Expense', type: AccountType.Expense },
	{ code: '513', name: 'Supplies Expense', type: AccountType.Expense },
	{ code: '514', name: 'Depreckation Expense of Building', type: AccountType.Expense },
	{ code: '516', name: 'Depreciation Expense of Machinery', type: AccountType.Expense },
	{ code: '517', name: 'Bad Debt Expense', type: AccountType.Expense },
	{ code: '521', name: 'Salaries Expense', type: AccountType.Expense },
	{ code: '522', name: 'Insurance Expense', type: AccountType.Expense },
	{ code: '523', name: 'Utilities Expense', type: AccountType.Expense },
	{ code: '524', name: 'Sundries Expense', type: AccountType.Expense },
	{ code: '525', name: 'Tax Expense', type: AccountType.Expense },
	{ code: '531', name: 'Interest Expense', type: AccountType.Expense },
	{ code: '532', name: 'Bank Service Charge', type: AccountType.Expense },
]

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

	await prisma.account.createMany({
		data: defaultAccounts,
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
