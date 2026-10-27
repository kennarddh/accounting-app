/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
	{ code: '104', name: 'Cash in Bank', type: AccountType.Asset },
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
	{ code: '514', name: 'Depreciation Expense of Building', type: AccountType.Expense },
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
	// 1. Guard check: only seed if no users exist
	if ((await prisma.user.count()) > 0) return

	// 2. Read password secret
	let passwordHashSecret: string | undefined

	if (process.env.PASSWORD_HASH_SECRET_FILE) {
		// eslint-disable-next-line security/detect-non-literal-fs-filename
		passwordHashSecret = await fs.readFile(process.env.PASSWORD_HASH_SECRET_FILE, 'utf-8')
	} else {
		passwordHashSecret = process.env.PASSWORD_HASH_SECRET
	}

	if (!passwordHashSecret) {
		throw new Error('PASSWORD_HASH_SECRET is not set.')
	}

	// 3. Create Admin User
	const password = await argon2.hash('password', {
		hashLength: 64,
		secret: Buffer.from(passwordHashSecret.trim()),
	})

	await prisma.user.create({
		data: {
			name: 'Admin',
			username: 'admin',
			password,
		},
	})

	// 4. Create Default Chart of Accounts
	await prisma.account.createMany({
		data: defaultAccounts,
	})

	// 5. Fetch seeded accounts by their unique code to get their generated IDs
	const requiredCodes = [
		'101',
		'103',
		'104',
		'134',
		'201',
		'41',
		'401',
		'511',
		'512',
		'513',
		'516',
		'517',
		'523',
		'524',
	]

	const accounts = await prisma.account.findMany({
		where: {
			code: { in: requiredCodes },
		},
		select: {
			id: true,
			code: true,
		},
	})

	const getAccountId = (code: string): bigint => {
		const account = accounts.find(a => a.code === code)
		if (!account) {
			throw new Error(`Missing required default account with code: ${code}`)
		}
		return account.id
	}

	// 6. Create POS Configuration Singleton (Row ID 1)
	await prisma.posConfiguration.create({
		data: {
			id: 1,

			// A. Cash & Bank
			cashAccountId: getAccountId('101'), // 101 - Cash
			bankAccountId: getAccountId('104'), // 104 - Cash in Bank

			// B. Sales & Revenue
			salesRevenueAccountId: getAccountId('401'), // 401 - Service Revenue

			// C. Inventory & COGS
			inventoryAssetAccountId: getAccountId('103'), // 103 - Supplies / Inventory Asset
			cogsAccountId: getAccountId('513'), // 513 - Supplies Expense / COGS

			// D. Stock Adjustments
			spoilageExpenseAccountId: getAccountId('524'), // 524 - Sundries / Spoilage Expense
			shrinkageExpenseAccountId: getAccountId('517'), // 517 - Bad Debt / Shrinkage Expense
			inventoryGainAccountId: getAccountId('41'), // 41 - Others Income / Gain

			// E. Payables & Rounding
			accountsPayableAccountId: getAccountId('201'), // 201 - Account Payable
			roundingAccountId: getAccountId('524'), // 524 - Sundries / Rounding Difference
		},
	})

	const adminUser = await prisma.user.findUniqueOrThrow({ where: { username: 'admin' } })

	// =========================================================================
	// 7. SEED SUPPLIERS (5 Suppliers)
	// =========================================================================
	const supplierDefinitions = [
		{
			code: 'SUP-001',
			name: 'Dairy Fresh Farms Ltd',
			contact: 'Robert Johnson',
			email: 'orders@dairyfresh.com',
			phone: '+62 811-2345-6789',
			address: 'Jl. Agro Industri No. 12, Bandung',
			terms: 'Net 30',
		},
		{
			code: 'SUP-002',
			name: 'Golden Grain Flour & Bakery Supplies',
			contact: 'Maria Santos',
			email: 'sales@goldengrain.id',
			phone: '+62 812-9876-5432',
			address: 'Kawasan Industri Cikarang Blok B-4, Bekasi',
			terms: 'Net 15',
		},
		{
			code: 'SUP-003',
			name: 'Artisan Coffee Roasters Co',
			contact: 'David Tan',
			email: 'wholesale@artisancoffee.co',
			phone: '+62 813-5555-1234',
			address: 'Jl. Senopati No. 45, Jakarta Selatan',
			terms: 'Due upon receipt',
		},
		{
			code: 'SUP-004',
			name: 'EcoPack Packaging Solutions',
			contact: 'Linda Wijaya',
			email: 'support@ecopack.co.id',
			phone: '+62 819-8888-9999',
			address: 'Jl. Rungkut Industri III No. 8, Surabaya',
			terms: 'Net 30',
		},
		{
			code: 'SUP-005',
			name: 'Global Tableware & Merchandise Inc',
			contact: 'Kenji Sato',
			email: 'orders@globaltableware.com',
			phone: '+62 817-4444-7777',
			address: 'Gedung Wisma Niaga Lt. 5, Jakarta Pusat',
			terms: 'Net 60',
		},
	]

	await prisma.supplier.createMany({ data: supplierDefinitions })
	const suppliers = await prisma.supplier.findMany({ orderBy: { code: 'asc' } })

	// =========================================================================
	// 8. SEED CATEGORIES (5 Categories)
	// =========================================================================
	const categoryData = [
		{ name: 'Beverages' },
		{ name: 'Bakery & Pastries' },
		{ name: 'Main Course' },
		{ name: 'Snacks & Sides' },
		{ name: 'Merchandise' },
	]

	await prisma.category.createMany({ data: categoryData })
	const categories = await prisma.category.findMany()
	const getCatId = (name: string) => categories.find(c => c.name === name)!.id

	// =========================================================================
	// 9. SEED PRODUCTS (20 Products)
	// =========================================================================
	const productDefinitions = [
		// Beverages
		{ sku: 'BEV-001', name: 'Espresso', price: '25000', costPrice: '8000', cat: 'Beverages' },
		{
			sku: 'BEV-002',
			name: 'Caffe Latte',
			price: '35000',
			costPrice: '12000',
			cat: 'Beverages',
		},
		{
			sku: 'BEV-003',
			name: 'Caramel Macchiato',
			price: '42000',
			costPrice: '15000',
			cat: 'Beverages',
		},
		{
			sku: 'BEV-004',
			name: 'Matcha Green Tea',
			price: '38000',
			costPrice: '14000',
			cat: 'Beverages',
		},
		{
			sku: 'BEV-005',
			name: 'Iced Lemon Tea',
			price: '22000',
			costPrice: '6000',
			cat: 'Beverages',
		},

		// Bakery & Pastries
		{
			sku: 'BAK-001',
			name: 'Butter Croissant',
			price: '28000',
			costPrice: '11000',
			cat: 'Bakery & Pastries',
		},
		{
			sku: 'BAK-002',
			name: 'Pain au Chocolat',
			price: '32000',
			costPrice: '13000',
			cat: 'Bakery & Pastries',
		},
		{
			sku: 'BAK-003',
			name: 'Cinnamon Roll',
			price: '30000',
			costPrice: '10000',
			cat: 'Bakery & Pastries',
		},
		{
			sku: 'BAK-004',
			name: 'Blueberry Muffin',
			price: '27000',
			costPrice: '9000',
			cat: 'Bakery & Pastries',
		},

		// Main Course
		{
			sku: 'MNC-001',
			name: 'Truffle Pasta',
			price: '65000',
			costPrice: '28000',
			cat: 'Main Course',
		},
		{
			sku: 'MNC-002',
			name: 'Club Sandwich',
			price: '48000',
			costPrice: '19000',
			cat: 'Main Course',
		},
		{
			sku: 'MNC-003',
			name: 'Wagyu Beef Burger',
			price: '85000',
			costPrice: '38000',
			cat: 'Main Course',
		},
		{
			sku: 'MNC-004',
			name: 'Grilled Chicken Salad',
			price: '52000',
			costPrice: '21000',
			cat: 'Main Course',
		},

		// Snacks & Sides
		{
			sku: 'SNK-001',
			name: 'French Fries',
			price: '26000',
			costPrice: '8000',
			cat: 'Snacks & Sides',
		},
		{
			sku: 'SNK-002',
			name: 'Truffle Parmesan Fries',
			price: '36000',
			costPrice: '12000',
			cat: 'Snacks & Sides',
		},
		{
			sku: 'SNK-003',
			name: 'Fried Calamari',
			price: '45000',
			costPrice: '18000',
			cat: 'Snacks & Sides',
		},
		{
			sku: 'SNK-004',
			name: 'Garlic Bread',
			price: '24000',
			costPrice: '7000',
			cat: 'Snacks & Sides',
		},

		// Merchandise
		{
			sku: 'MRC-001',
			name: 'Ceramic Mug 350ml',
			price: '85000',
			costPrice: '35000',
			cat: 'Merchandise',
		},
		{
			sku: 'MRC-002',
			name: 'Thermal Tumbler 500ml',
			price: '175000',
			costPrice: '75000',
			cat: 'Merchandise',
		},
		{
			sku: 'MRC-003',
			name: 'Canvas Tote Bag',
			price: '65000',
			costPrice: '22000',
			cat: 'Merchandise',
		},
	]

	// Initial stock starting point is 500 for each item
	await prisma.product.createMany({
		data: productDefinitions.map(p => ({
			sku: p.sku,
			name: p.name,
			price: p.price,
			costPrice: p.costPrice,
			currentStock: '500',
			categoryId: getCatId(p.cat),
		})),
	})

	const products = await prisma.product.findMany()

	// =========================================================================
	// 10. SEED 6 MANUAL GENERAL JOURNALS
	// =========================================================================
	const manualJournalsData = [
		{
			entryNumber: 'JE-2026-0001',
			date: new Date('2026-08-01T08:00:00Z'),
			description: 'Paid Monthly Building Rental for August',
			lines: [
				{
					accountId: getAccountId('512'),
					debit: '15000000',
					credit: '0',
					description: 'Office/Store Rent Expense',
				},
				{
					accountId: getAccountId('104'),
					debit: '0',
					credit: '15000000',
					description: 'Bank Wire for Rent',
				},
			],
		},
		{
			entryNumber: 'JE-2026-0002',
			date: new Date('2026-08-05T09:30:00Z'),
			description: 'Paid High-Speed Internet & Phone Bill',
			lines: [
				{
					accountId: getAccountId('523'),
					debit: '1850000',
					credit: '0',
					description: 'Internet and Telecom Expense',
				},
				{
					accountId: getAccountId('104'),
					debit: '0',
					credit: '1850000',
					description: 'Bank Autodebit',
				},
			],
		},
		{
			entryNumber: 'JE-2026-0003',
			date: new Date('2026-08-10T11:00:00Z'),
			description: 'Social Media Ad Campaign (Instagram & Google Ads)',
			lines: [
				{
					accountId: getAccountId('511'),
					debit: '3500000',
					credit: '0',
					description: 'Digital Marketing Expense',
				},
				{
					accountId: getAccountId('104'),
					debit: '0',
					credit: '3500000',
					description: 'Bank Card Payment',
				},
			],
		},
		{
			entryNumber: 'JE-2026-0004',
			date: new Date('2026-08-15T14:00:00Z'),
			description: 'Purchased Coffee Filters, Napkins, and Cups',
			lines: [
				{
					accountId: getAccountId('103'),
					debit: '2400000',
					credit: '0',
					description: 'Operational Supplies Stock',
				},
				{
					accountId: getAccountId('101'),
					debit: '0',
					credit: '2400000',
					description: 'Paid via Cash',
				},
			],
		},
		{
			entryNumber: 'JE-2026-0005',
			date: new Date('2026-08-20T10:15:00Z'),
			description: 'Electricity & Water Utilities Bill',
			lines: [
				{
					accountId: getAccountId('523'),
					debit: '4200000',
					credit: '0',
					description: 'Electricity & Water Utility',
				},
				{
					accountId: getAccountId('104'),
					debit: '0',
					credit: '4200000',
					description: 'Bank Payment',
				},
			],
		},
		{
			entryNumber: 'JE-2026-0006',
			date: new Date('2026-08-31T17:00:00Z'),
			description: 'Monthly Depreciation of Espresso Machinery',
			lines: [
				{
					accountId: getAccountId('516'),
					debit: '1250000',
					credit: '0',
					description: 'Monthly Depreciation Expense',
				},
				{
					accountId: getAccountId('134'),
					debit: '0',
					credit: '1250000',
					description: 'Accumulated Depreciation',
				},
			],
		},
	]

	for (const jData of manualJournalsData) {
		await prisma.journalEntry.create({
			data: {
				entryNumber: jData.entryNumber,
				date: jData.date,
				description: jData.description,
				createdById: adminUser.id,
				lines: {
					create: jData.lines.map(l => ({
						accountId: l.accountId,
						debit: l.debit,
						credit: l.credit,
						description: l.description,
					})),
				},
			},
		})
	}

	// =========================================================================
	// 11. SEED 15 STOCK ADJUSTMENTS (Restocks, Waste, Corrections)
	// Some Restocks linked to suppliers, one restock ad-hoc without supplier!
	// =========================================================================
	const adjustmentDefinitions = [
		// 5 Restocks: 4 with suppliers, 1 ad-hoc (null supplier)
		{ type: 'Restock', reason: 'Dairy delivery shipment', supplierCode: 'SUP-001' },
		{
			type: 'Restock',
			reason: 'Bakery flour and yeast bulk delivery',
			supplierCode: 'SUP-002',
		},
		{ type: 'Restock', reason: 'Specialty coffee beans shipment', supplierCode: 'SUP-003' },
		{ type: 'Restock', reason: 'Takeaway cup and sleeve delivery', supplierCode: 'SUP-004' },
		{
			type: 'Restock',
			reason: 'Emergency supermarket run for lemons & sugar',
			supplierCode: null,
		}, // No supplier!

		// 5 Waste Adjustments (No supplier)
		{ type: 'Waste', reason: 'Dropped and shattered ceramic mug', supplierCode: null },
		{ type: 'Waste', reason: 'Milk cartons spoiled due to fridge outage', supplierCode: null },
		{ type: 'Waste', reason: 'Expired muffins and pastries discarded', supplierCode: null },
		{ type: 'Waste', reason: 'Burned bakery batch during morning prep', supplierCode: null },
		{ type: 'Waste', reason: 'Defective tumbler lid return to trash', supplierCode: null },

		// 5 Correction Adjustments (No supplier)
		{
			type: 'Correction',
			reason: 'Monthly physical inventory audit count',
			supplierCode: null,
		},
		{
			type: 'Correction',
			reason: 'Discrepancy adjustment after shift transition',
			supplierCode: null,
		},
		{
			type: 'Correction',
			reason: 'Barista recount surplus found in stockroom',
			supplierCode: null,
		},
		{ type: 'Correction', reason: 'Quarterly inventory shrinkage audit', supplierCode: null },
		{
			type: 'Correction',
			reason: 'Stock reconciliation after system sync',
			supplierCode: null,
		},
	]

	for (let i = 0; i < adjustmentDefinitions.length; i++) {
		const adjDef = adjustmentDefinitions[i]!
		const adjNumber = `ADJ-202608-${(i + 1).toString().padStart(3, '0')}`
		const date = new Date(Date.now() - (15 - i) * 86400000)

		const linkedSupplier = adjDef.supplierCode
			? (suppliers.find(s => s.code === adjDef.supplierCode) ?? null)
			: null

		const p1 = products[i % products.length]!
		const p2 = products[(i + 3) % products.length]!

		let q1: string
		let q2: string

		if (adjDef.type === 'Waste') {
			q1 = '-2'
			q2 = '-3'
		} else if (adjDef.type === 'Restock') {
			q1 = '50'
			q2 = '30'
		} else {
			// Correction: one surplus (+), one shortage (-)
			q1 = '5'
			q2 = '-2'
		}

		const cost1 = (Math.abs(Number(q1)) * Number(p1.costPrice)).toString()
		const cost2 = (Math.abs(Number(q2)) * Number(p2.costPrice)).toString()
		const totalCost = (Number(cost1) + Number(cost2)).toString()

		// Determine GL mapping based on adjustment type
		const debitAccount =
			adjDef.type === 'Waste'
				? getAccountId('524') // Spoilage / Sundries Expense
				: getAccountId('103') // Supplies / Inventory Asset

		const creditAccount =
			adjDef.type === 'Restock'
				? getAccountId('201') // Accounts Payable
				: adjDef.type === 'Waste'
					? getAccountId('103') // Inventory Asset Reduction
					: getAccountId('41') // Others Income / Gain

		const creditDescription =
			adjDef.type === 'Restock'
				? linkedSupplier
					? `Accounts Payable to ${linkedSupplier.name} for ${adjNumber}`
					: `Accounts Payable for Ad-hoc Restock ${adjNumber}`
				: adjDef.type === 'Waste'
					? `Inventory Asset Reduction for ${adjNumber}`
					: `Adjustment Credit for ${adjNumber}`

		const je = await prisma.journalEntry.create({
			data: {
				entryNumber: `JE-${adjNumber}`,
				date,
				description: `Stock Adjustment (${adjDef.type}): ${adjDef.reason}`,
				createdById: adminUser.id,
				lines: {
					create: [
						{
							accountId: debitAccount,
							debit: totalCost,
							credit: '0',
							description: `Adjustment Debit for ${adjNumber}`,
						},
						{
							accountId: creditAccount,
							debit: '0',
							credit: totalCost,
							description: creditDescription,
						},
					],
				},
			},
		})

		await prisma.stockAdjustment.create({
			data: {
				adjustmentNumber: adjNumber,
				date,
				type: adjDef.type,
				reason: adjDef.reason,
				totalCost,
				supplierId: linkedSupplier ? linkedSupplier.id : null,
				createdById: adminUser.id,
				journalEntryId: je.id,
				items: {
					create: [
						{
							productId: p1.id,
							quantity: q1,
							unitCost: p1.costPrice,
							subtotalCost: cost1,
						},
						{
							productId: p2.id,
							quantity: q2,
							unitCost: p2.costPrice,
							subtotalCost: cost2,
						},
					],
				},
				stockMovements: {
					create: [
						{
							productId: p1.id,
							type: adjDef.type,
							quantity: q1,
							costPerUnit: p1.costPrice,
							createdById: adminUser.id,
						},
						{
							productId: p2.id,
							type: adjDef.type,
							quantity: q2,
							costPerUnit: p2.costPrice,
							createdById: adminUser.id,
						},
					],
				},
			},
		})

		// Apply delta to product stock
		await prisma.product.update({
			where: { id: p1.id },
			data: { currentStock: { increment: q1 } },
		})
		await prisma.product.update({
			where: { id: p2.id },
			data: { currentStock: { increment: q2 } },
		})
	}

	// =========================================================================
	// 12. SEED 50 POS ORDERS (With Balanced Sales & COGS Journal Entries)
	// =========================================================================
	const paymentMethods = ['Cash', 'Card', 'BankTransfer', 'QRIS']

	for (let i = 1; i <= 50; i++) {
		const orderNumber = `ORD-202609-${i.toString().padStart(4, '0')}`
		const date = new Date(Date.now() - Math.floor(Math.random() * 10 * 86400000))
		const paymentMethod = paymentMethods[i % paymentMethods.length]!

		const itemCount = 1 + (i % 3)
		const orderProducts = [
			products[(i * 2) % products.length]!,
			products[(i * 3 + 1) % products.length]!,
			products[(i * 5 + 2) % products.length]!,
		].slice(0, itemCount)

		let totalAmount = 0
		let totalCost = 0

		const lineItems = orderProducts.map((p, idx) => {
			const qty = (idx + 1).toString()
			const subtotal = Number(qty) * Number(p.price)
			const subtotalCost = Number(qty) * Number(p.costPrice)

			totalAmount += subtotal
			totalCost += subtotalCost

			return {
				productId: p.id,
				quantity: qty,
				unitPrice: p.price,
				unitCost: p.costPrice,
				subtotal: subtotal.toString(),
			}
		})

		const paymentAccountId =
			paymentMethod === 'Cash' ? getAccountId('101') : getAccountId('104')

		const je = await prisma.journalEntry.create({
			data: {
				entryNumber: `JE-${orderNumber}`,
				date,
				description: `POS Order ${orderNumber} (${paymentMethod})`,
				createdById: adminUser.id,
				lines: {
					create: [
						{
							accountId: paymentAccountId,
							debit: totalAmount.toString(),
							credit: '0',
							description: `Payment received (${paymentMethod})`,
						},
						{
							accountId: getAccountId('401'),
							debit: '0',
							credit: totalAmount.toString(),
							description: `Sales Revenue for ${orderNumber}`,
						},
						{
							accountId: getAccountId('513'),
							debit: totalCost.toString(),
							credit: '0',
							description: `COGS for ${orderNumber}`,
						},
						{
							accountId: getAccountId('103'),
							debit: '0',
							credit: totalCost.toString(),
							description: `Inventory reduction for ${orderNumber}`,
						},
					],
				},
			},
		})

		await prisma.order.create({
			data: {
				orderNumber,
				date,
				status: 'Completed',
				paymentMethod,
				totalAmount: totalAmount.toString(),
				totalCost: totalCost.toString(),
				createdById: adminUser.id,
				journalEntryId: je.id,
				items: {
					create: lineItems,
				},
				stockMovements: {
					create: lineItems.map(item => ({
						productId: item.productId,
						type: 'Sale',
						quantity: (-Number(item.quantity)).toString(),
						costPerUnit: item.unitCost,
						createdById: adminUser.id,
					})),
				},
			},
		})

		for (const item of lineItems) {
			await prisma.product.update({
				where: { id: item.productId },
				data: { currentStock: { decrement: item.quantity } },
			})
		}
	}
}

try {
	await main()
	await prisma.$disconnect()
} catch (error) {
	console.error(error)
	await prisma.$disconnect()
	process.exit(1)
}
