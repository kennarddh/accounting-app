import { DI, Injectable, Service } from '@celosiajs/core'

import { AccountType } from '@accounting-app/common'

import DatabaseService from 'Modules/Database/DatabaseService'
import PosConfigurationService from 'Modules/PosConfiguration/PosConfigurationService'

import { Prisma } from 'PrismaGenerated/client'

import { exportBalanceSheetCsv } from './Exporters/BalanceSheet/BalanceSheetCsvExporter'
import { exportBalanceSheetExcel } from './Exporters/BalanceSheet/BalanceSheetExcelExporter'
import { exportBalanceSheetPdf } from './Exporters/BalanceSheet/BalanceSheetPdfExporter'
import { exportGeneralLedgerCsv } from './Exporters/GeneralLedger/GeneralLedgerCsvExporter'
import { exportGeneralLedgerExcel } from './Exporters/GeneralLedger/GeneralLedgerExcelExporter'
import { exportGeneralLedgerPdf } from './Exporters/GeneralLedger/GeneralLedgerPdfExporter'
import { exportInventoryValuationCsv } from './Exporters/InventoryValuation/InventoryValuationCsvExporter'
import { exportInventoryValuationExcel } from './Exporters/InventoryValuation/InventoryValuationExcelExporter'
import { exportInventoryValuationPdf } from './Exporters/InventoryValuation/InventoryValuationPdfExporter'
import { exportProfitAndLossCsv } from './Exporters/ProfitAndLoss/ProfitAndLossCsvExporter'
import { exportProfitAndLossExcel } from './Exporters/ProfitAndLoss/ProfitAndLossExcelExporter'
import { exportProfitAndLossPdf } from './Exporters/ProfitAndLoss/ProfitAndLossPdfExporter'
import { exportSalesByProductCsv } from './Exporters/SalesByProduct/SalesByProductCsvExporter'
import { exportSalesByProductExcel } from './Exporters/SalesByProduct/SalesByProductExcelExporter'
import { exportSalesByProductPdf } from './Exporters/SalesByProduct/SalesByProductPdfExporter'
import { exportStockMovementCsv } from './Exporters/StockMovement/StockMovementCsvExporter'
import { exportStockMovementExcel } from './Exporters/StockMovement/StockMovementExcelExporter'
import { exportStockMovementPdf } from './Exporters/StockMovement/StockMovementPdfExporter'
import { exportTrialBalanceCsv } from './Exporters/TrialBalance/TrialBalanceCsvExporter'
import { exportTrialBalanceExcel } from './Exporters/TrialBalance/TrialBalanceExcelExporter'
import { exportTrialBalancePdf } from './Exporters/TrialBalance/TrialBalancePdfExporter'
import { exportZReportCsv } from './Exporters/ZReport/ZReportCsvExporter'
import { exportZReportExcel } from './Exporters/ZReport/ZReportExcelExporter'
import { exportZReportPdf } from './Exporters/ZReport/ZReportPdfExporter'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type StockMovementLineItem = {
	movementId: string
	date: number
	type: string
	productId: string
	sku: string
	productName: string
	quantity: string
	costPerUnit: string
	totalCost: string
	referenceNumber: string
	createdByName: string
	supplierName?: string | undefined
	runningStock?: string | undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type StockMovementReportData = {
	fromDate: number
	toDate: number
	filteredProduct: {
		id: string
		sku: string
		name: string
	} | null
	openingStock: string | null
	closingStock: string | null
	totalIn: string
	totalOut: string
	netDelta: string
	movements: StockMovementLineItem[]
}

interface RawMovementRow {
	movementId: bigint
	date: Date
	type: string
	productId: bigint
	sku: string
	productName: string
	quantity: string
	costPerUnit: string
	totalCost: string
	orderNumber: string | null
	adjustmentNumber: string | null
	createdByName: string
	supplierName: string | null
}

interface RawOpeningStock {
	openingStock: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type InventoryValuationItem = {
	productId: string
	sku: string
	name: string
	categoryName: string
	currentStock: string
	costPrice: string
	totalValue: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ShrinkageDiscrepancyItem = {
	adjustmentNumber: string
	date: number
	type: string
	sku: string
	productName: string
	quantityAdjusted: string
	unitCost: string
	subtotalCost: string
	reason: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type InventoryValuationReportData = {
	asOfDate: number
	fromDate: number
	toDate: number
	summary: {
		totalValuation: string
		totalUnitsOnHand: string
		totalWasteCost: string
		totalShrinkageCost: string
		totalSurplusCost: string
		netLossCost: string
	}
	valuationItems: InventoryValuationItem[]
	discrepancies: ShrinkageDiscrepancyItem[]
}

interface RawValuationRow {
	productId: bigint
	sku: string
	productName: string
	categoryName: string
	currentStock: string
	costPrice: string
	totalValue: string
}

interface RawShrinkageRow {
	adjustmentNumber: string
	date: Date
	type: string
	sku: string
	productName: string
	quantityAdjusted: string
	unitCost: string
	subtotalCost: string
	reason: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ProductSalesLine = {
	productId: string
	sku: string
	name: string
	categoryId: string
	categoryName: string
	quantitySold: string
	totalRevenue: string
	totalCost: string
	grossProfit: string
	marginPercent: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CategorySalesLine = {
	categoryId: string
	categoryName: string
	productCount: number
	quantitySold: string
	totalRevenue: string
	totalCost: string
	grossProfit: string
	marginPercent: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SalesByProductReportData = {
	fromDate: number
	toDate: number
	categoryFilterName: string
	summary: {
		totalQuantity: string
		totalRevenue: string
		totalCost: string
		totalProfit: string
		overallMarginPercent: string
	}
	categories: CategorySalesLine[]
	products: ProductSalesLine[]
}

interface RawProductSalesAgg {
	productId: bigint
	sku: string
	productName: string
	categoryId: bigint
	categoryName: string
	quantitySold: string
	totalRevenue: string
	totalCost: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ZReportPaymentLine = {
	paymentMethod: string
	orderCount: number
	totalAmount: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ZReportStatusLine = {
	status: string
	count: number
	totalAmount: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ZReportProductLine = {
	productId: string
	sku: string
	name: string
	categoryName: string
	quantity: string
	totalAmount: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ZReportCategoryLine = {
	categoryName: string
	quantity: string
	totalAmount: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ZReportData = {
	date: number
	cashierName: string
	grossSales: string
	totalCost: string
	grossProfit: string
	grossMarginPercent: string
	totalOrders: number
	totalItemsSold: string
	averageTicket: string
	cashCollected: string
	payments: ZReportPaymentLine[]
	statuses: ZReportStatusLine[]
	categories: ZReportCategoryLine[]
	topProducts: ZReportProductLine[]
}

interface RawPaymentAgg {
	paymentMethod: string
	orderCount: number
	totalAmount: string
	totalCost: string
}

interface RawStatusAgg {
	status: string
	count: number
	totalAmount: string
}

interface RawItemAgg {
	productId: bigint
	sku: string
	productName: string
	categoryName: string
	totalQuantity: string
	totalAmount: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GeneralLedgerTransactionLine = {
	journalEntryId: string
	entryNumber: string
	date: number
	description: string
	debit: string
	credit: string
	runningBalance: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GeneralLedgerReportData = {
	account: {
		id: string
		code: string
		name: string
		type: string
		isDebitNormal: boolean
	}
	fromDate: number
	toDate: number
	openingBalance: string
	totalDebit: string
	totalCredit: string
	endingBalance: string
	transactions: GeneralLedgerTransactionLine[]
}

interface RawOpeningBalance {
	openingDebit: string
	openingCredit: string
}

interface RawGeneralLedgerLine {
	journalEntryId: bigint
	entryNumber: string
	date: Date
	lineId: bigint
	description: string
	debit: string
	credit: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type BalanceSheetLine = {
	id: string
	code: string
	name: string
	amount: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type BalanceSheetReportData = {
	asOfDate: number
	assets: {
		items: BalanceSheetLine[]
		total: string
	}
	liabilities: {
		items: BalanceSheetLine[]
		total: string
	}
	equity: {
		items: BalanceSheetLine[]
		retainedEarnings: string
		total: string
	}
	totalLiabilitiesAndEquity: string
	isBalanced: boolean
	difference: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TrialBalanceLine = {
	id: string
	code: string
	name: string
	type: string
	debit: string
	credit: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TrialBalanceReportData = {
	toDate: number
	items: TrialBalanceLine[]
	totalDebit: string
	totalCredit: string
	isBalanced: boolean
	difference: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ProfitAndLossLine = {
	id: string
	code: string
	name: string
	amount: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ProfitAndLossReportData = {
	fromDate: number
	toDate: number
	revenues: {
		items: ProfitAndLossLine[]
		total: string
	}
	cogs: {
		items: ProfitAndLossLine[]
		total: string
	}
	grossProfit: string
	expenses: {
		items: ProfitAndLossLine[]
		total: string
	}
	netProfit: string
}

interface RawAccountAggregation {
	id: bigint
	code: string
	name: string
	type: string
	totalDebit: string
	totalCredit: string
}

@Injectable()
class ReportService extends Service {
	constructor(
		private db = DI.get(DatabaseService),
		private posConfigService = DI.get(PosConfigurationService),
	) {
		super('ReportService')
	}

	async getProfitAndLoss(fromDate: Date, toDate: Date): Promise<ProfitAndLossReportData> {
		const config = await this.posConfigService.get()

		const rows = await this.db.client.$queryRaw<RawAccountAggregation[]>`
			SELECT 
				a.id,
				a.code,
				a.name,
				a.type,
				COALESCE(SUM(jl.debit), 0)::text AS "totalDebit",
				COALESCE(SUM(jl.credit), 0)::text AS "totalCredit"
			FROM accounts a
			JOIN journal_lines jl ON jl."accountId" = a.id
			JOIN journal_entries je ON je.id = jl."journalEntryId"
			WHERE a.type IN ('Revenue', 'Expense')
			  AND je.date >= ${fromDate}
			  AND je.date <= ${toDate}
			GROUP BY a.id, a.code, a.name, a.type
			ORDER BY a.code ASC;
		`

		const revenueItems: ProfitAndLossLine[] = []
		const cogsItems: ProfitAndLossLine[] = []
		const expenseItems: ProfitAndLossLine[] = []

		let totalRevenue = new Prisma.Decimal(0)
		let totalCogs = new Prisma.Decimal(0)
		let totalExpenses = new Prisma.Decimal(0)

		for (const row of rows) {
			const debit = new Prisma.Decimal(row.totalDebit)
			const credit = new Prisma.Decimal(row.totalCredit)

			const type = row.type as AccountType

			if (type === AccountType.Revenue) {
				const balance = credit.minus(debit)
				if (!balance.isZero()) {
					totalRevenue = totalRevenue.add(balance)
					revenueItems.push({
						id: row.id.toString(),
						code: row.code,
						name: row.name,
						amount: balance.toDecimalPlaces(4).toString(),
					})
				}
			} else if (type === AccountType.Expense) {
				const balance = debit.minus(credit)
				if (!balance.isZero()) {
					if (row.id === config.cogsAccountId) {
						totalCogs = totalCogs.add(balance)
						cogsItems.push({
							id: row.id.toString(),
							code: row.code,
							name: row.name,
							amount: balance.toDecimalPlaces(4).toString(),
						})
					} else {
						totalExpenses = totalExpenses.add(balance)
						expenseItems.push({
							id: row.id.toString(),
							code: row.code,
							name: row.name,
							amount: balance.toDecimalPlaces(4).toString(),
						})
					}
				}
			}
		}

		const grossProfit = totalRevenue.minus(totalCogs)
		const netProfit = grossProfit.minus(totalExpenses)

		return {
			fromDate: fromDate.getTime(),
			toDate: toDate.getTime(),
			revenues: {
				items: revenueItems,
				total: totalRevenue.toDecimalPlaces(4).toString(),
			},
			cogs: {
				items: cogsItems,
				total: totalCogs.toDecimalPlaces(4).toString(),
			},
			grossProfit: grossProfit.toDecimalPlaces(4).toString(),
			expenses: {
				items: expenseItems,
				total: totalExpenses.toDecimalPlaces(4).toString(),
			},
			netProfit: netProfit.toDecimalPlaces(4).toString(),
		}
	}

	// Clean single-line delegations to the specialized exporters:
	exportProfitAndLossExcel(report: ProfitAndLossReportData) {
		return exportProfitAndLossExcel(report)
	}

	exportProfitAndLossPdf(report: ProfitAndLossReportData) {
		return exportProfitAndLossPdf(report)
	}

	exportProfitAndLossCsv(report: ProfitAndLossReportData) {
		return exportProfitAndLossCsv(report)
	}

	async getTrialBalance(toDate: Date): Promise<TrialBalanceReportData> {
		// Aggregates all debits & credits for all accounts with transactions in the period
		const rows = await this.db.client.$queryRaw<RawAccountAggregation[]>`
			SELECT 
				a.id,
				a.code,
				a.name,
				a.type,
				COALESCE(SUM(jl.debit), 0)::text AS "totalDebit",
				COALESCE(SUM(jl.credit), 0)::text AS "totalCredit"
			FROM accounts a
			JOIN journal_lines jl ON jl."accountId" = a.id
			JOIN journal_entries je ON je.id = jl."journalEntryId"
			WHERE je.date <= ${toDate}
			GROUP BY a.id, a.code, a.name, a.type
			ORDER BY a.code ASC;
		`

		const items: TrialBalanceLine[] = []
		let totalDebit = new Prisma.Decimal(0)
		let totalCredit = new Prisma.Decimal(0)

		for (const row of rows) {
			const debitSum = new Prisma.Decimal(row.totalDebit)
			const creditSum = new Prisma.Decimal(row.totalCredit)

			// Net balance calculation: an account carries either a net Debit or a net Credit
			let netDebit = new Prisma.Decimal(0)
			let netCredit = new Prisma.Decimal(0)

			if (debitSum.greaterThan(creditSum)) {
				netDebit = debitSum.minus(creditSum)
			} else if (creditSum.greaterThan(debitSum)) {
				netCredit = creditSum.minus(debitSum)
			}

			if (!netDebit.isZero() || !netCredit.isZero()) {
				totalDebit = totalDebit.add(netDebit)
				totalCredit = totalCredit.add(netCredit)

				items.push({
					id: row.id.toString(),
					code: row.code,
					name: row.name,
					type: row.type,
					debit: netDebit.toDecimalPlaces(4).toString(),
					credit: netCredit.toDecimalPlaces(4).toString(),
				})
			}
		}

		const isBalanced = totalDebit.equals(totalCredit)
		const difference = totalDebit.minus(totalCredit).abs()

		return {
			toDate: toDate.getTime(),
			items,
			totalDebit: totalDebit.toDecimalPlaces(4).toString(),
			totalCredit: totalCredit.toDecimalPlaces(4).toString(),
			isBalanced,
			difference: difference.toDecimalPlaces(4).toString(),
		}
	}

	exportTrialBalanceExcel(report: TrialBalanceReportData) {
		return exportTrialBalanceExcel(report)
	}

	exportTrialBalancePdf(report: TrialBalanceReportData) {
		return exportTrialBalancePdf(report)
	}

	exportTrialBalanceCsv(report: TrialBalanceReportData) {
		return exportTrialBalanceCsv(report)
	}

	async getBalanceSheet(asOfDate: Date): Promise<BalanceSheetReportData> {
		// A Balance Sheet is cumulative from inception up to the selected 'asOfDate'
		const rows = await this.db.client.$queryRaw<RawAccountAggregation[]>`
			SELECT 
				a.id,
				a.code,
				a.name,
				a.type,
				COALESCE(SUM(jl.debit), 0)::text AS "totalDebit",
				COALESCE(SUM(jl.credit), 0)::text AS "totalCredit"
			FROM accounts a
			JOIN journal_lines jl ON jl."accountId" = a.id
			JOIN journal_entries je ON je.id = jl."journalEntryId"
			WHERE je.date <= ${asOfDate}
			GROUP BY a.id, a.code, a.name, a.type
			ORDER BY a.code ASC;
		`

		const assetItems: BalanceSheetLine[] = []
		const liabilityItems: BalanceSheetLine[] = []
		const equityItems: BalanceSheetLine[] = []

		let totalAssets = new Prisma.Decimal(0)
		let totalLiabilities = new Prisma.Decimal(0)
		let totalBaseEquity = new Prisma.Decimal(0)

		// Retained earnings = Cumulative Revenues - Cumulative Expenses
		let cumulativeRevenues = new Prisma.Decimal(0)
		let cumulativeExpenses = new Prisma.Decimal(0)

		for (const row of rows) {
			const debit = new Prisma.Decimal(row.totalDebit)
			const credit = new Prisma.Decimal(row.totalCredit)

			const type = row.type as AccountType

			if (type === AccountType.Asset) {
				// Assets normal balance is Debit (Debit - Credit)
				const balance = debit.minus(credit)
				if (!balance.isZero()) {
					totalAssets = totalAssets.add(balance)
					assetItems.push({
						id: row.id.toString(),
						code: row.code,
						name: row.name,
						amount: balance.toDecimalPlaces(4).toString(),
					})
				}
			} else if (type === AccountType.Liability) {
				// Liabilities normal balance is Credit (Credit - Debit)
				const balance = credit.minus(debit)
				if (!balance.isZero()) {
					totalLiabilities = totalLiabilities.add(balance)
					liabilityItems.push({
						id: row.id.toString(),
						code: row.code,
						name: row.name,
						amount: balance.toDecimalPlaces(4).toString(),
					})
				}
			} else if (type === AccountType.Equity) {
				// Equity normal balance is Credit (Credit - Debit)
				const balance = credit.minus(debit)
				if (!balance.isZero()) {
					totalBaseEquity = totalBaseEquity.add(balance)
					equityItems.push({
						id: row.id.toString(),
						code: row.code,
						name: row.name,
						amount: balance.toDecimalPlaces(4).toString(),
					})
				}
			} else if (type === AccountType.Revenue) {
				cumulativeRevenues = cumulativeRevenues.add(credit.minus(debit))
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			} else if (type === AccountType.Expense) {
				cumulativeExpenses = cumulativeExpenses.add(debit.minus(credit))
			}
		}

		// Retained Earnings connects the P&L with the Balance Sheet
		const retainedEarnings = cumulativeRevenues.minus(cumulativeExpenses)
		const totalEquity = totalBaseEquity.add(retainedEarnings)
		const totalLiabilitiesAndEquity = totalLiabilities.add(totalEquity)

		const isBalanced = totalAssets.equals(totalLiabilitiesAndEquity)
		const difference = totalAssets.minus(totalLiabilitiesAndEquity).abs()

		return {
			asOfDate: asOfDate.getTime(),
			assets: {
				items: assetItems,
				total: totalAssets.toDecimalPlaces(4).toString(),
			},
			liabilities: {
				items: liabilityItems,
				total: totalLiabilities.toDecimalPlaces(4).toString(),
			},
			equity: {
				items: equityItems,
				retainedEarnings: retainedEarnings.toDecimalPlaces(4).toString(),
				total: totalEquity.toDecimalPlaces(4).toString(),
			},
			totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toDecimalPlaces(4).toString(),
			isBalanced,
			difference: difference.toDecimalPlaces(4).toString(),
		}
	}

	exportBalanceSheetExcel(report: BalanceSheetReportData) {
		return exportBalanceSheetExcel(report)
	}

	exportBalanceSheetPdf(report: BalanceSheetReportData) {
		return exportBalanceSheetPdf(report)
	}

	exportBalanceSheetCsv(report: BalanceSheetReportData) {
		return exportBalanceSheetCsv(report)
	}

	async getGeneralLedger(
		accountId: bigint,
		fromDate: Date,
		toDate: Date,
	): Promise<GeneralLedgerReportData> {
		const account = await this.db.client.account.findUniqueOrThrow({
			where: { id: accountId },
		})

		const accountType = account.type as AccountType

		// Normal balance: Asset & Expense = Debit; Liability, Equity & Revenue = Credit
		const isDebitNormal =
			accountType === AccountType.Asset || accountType === AccountType.Expense

		// 1. Calculate Opening Balance before fromDate (je.date < fromDate)
		const openingBalanceResult = await this.db.client.$queryRaw<RawOpeningBalance[]>`
			SELECT 
				COALESCE(SUM(jl.debit), 0)::text AS "openingDebit",
				COALESCE(SUM(jl.credit), 0)::text AS "openingCredit"
			FROM journal_lines jl
			JOIN journal_entries je ON je.id = jl."journalEntryId"
			WHERE jl."accountId" = ${accountId}
			  AND je.date < ${fromDate};
		`

		const rawOpening = openingBalanceResult[0] ?? { openingDebit: '0', openingCredit: '0' }
		const openingDebit = new Prisma.Decimal(rawOpening.openingDebit)
		const openingCredit = new Prisma.Decimal(rawOpening.openingCredit)

		let currentBalance = isDebitNormal
			? openingDebit.minus(openingCredit)
			: openingCredit.minus(openingDebit)

		const openingBalanceString = currentBalance.toDecimalPlaces(4).toString()

		// 2. Fetch all journal transaction lines within the date range in chronological order
		const lines = await this.db.client.$queryRaw<RawGeneralLedgerLine[]>`
			SELECT 
				je.id AS "journalEntryId",
				je."entryNumber",
				je.date,
				jl.id AS "lineId",
				COALESCE(jl.description, je.description) AS "description",
				jl.debit::text AS "debit",
				jl.credit::text AS "credit"
			FROM journal_lines jl
			JOIN journal_entries je ON je.id = jl."journalEntryId"
			WHERE jl."accountId" = ${accountId}
			  AND je.date >= ${fromDate}
			  AND je.date <= ${toDate}
			ORDER BY je.date ASC, je.id ASC, jl.id ASC;
		`

		let totalDebit = new Prisma.Decimal(0)
		let totalCredit = new Prisma.Decimal(0)

		const transactions: GeneralLedgerTransactionLine[] = []

		for (const line of lines) {
			const debit = new Prisma.Decimal(line.debit)
			const credit = new Prisma.Decimal(line.credit)

			totalDebit = totalDebit.add(debit)
			totalCredit = totalCredit.add(credit)

			// Update running balance after each journal line
			if (isDebitNormal) {
				currentBalance = currentBalance.add(debit).minus(credit)
			} else {
				currentBalance = currentBalance.add(credit).minus(debit)
			}

			transactions.push({
				journalEntryId: line.journalEntryId.toString(),
				entryNumber: line.entryNumber,
				date: line.date.getTime(),
				description: line.description,
				debit: debit.toDecimalPlaces(4).toString(),
				credit: credit.toDecimalPlaces(4).toString(),
				runningBalance: currentBalance.toDecimalPlaces(4).toString(),
			})
		}

		return {
			account: {
				id: account.id.toString(),
				code: account.code,
				name: account.name,
				type: account.type,
				isDebitNormal,
			},
			fromDate: fromDate.getTime(),
			toDate: toDate.getTime(),
			openingBalance: openingBalanceString,
			totalDebit: totalDebit.toDecimalPlaces(4).toString(),
			totalCredit: totalCredit.toDecimalPlaces(4).toString(),
			endingBalance: currentBalance.toDecimalPlaces(4).toString(),
			transactions,
		}
	}

	exportGeneralLedgerExcel(report: GeneralLedgerReportData) {
		return exportGeneralLedgerExcel(report)
	}

	exportGeneralLedgerPdf(report: GeneralLedgerReportData) {
		return exportGeneralLedgerPdf(report)
	}

	exportGeneralLedgerCsv(report: GeneralLedgerReportData) {
		return exportGeneralLedgerCsv(report)
	}

	async getZReport(date: Date, cashierId?: bigint): Promise<ZReportData> {
		const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
		const endOfDay = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			23,
			59,
			59,
			999,
		)

		let cashierName = 'All Cashiers'
		if (cashierId) {
			const user = await this.db.client.user.findUnique({
				where: { id: cashierId },
				select: { name: true },
			})
			if (user) cashierName = user.name
		}

		// 1. Payment Methods breakdown for completed orders
		// Ensure explicit null instead of undefined:
		const cashierFilter = cashierId ?? null

		const paymentRows = await this.db.client.$queryRaw<RawPaymentAgg[]>`
			SELECT 
				o."paymentMethod",
				COUNT(o.id)::int AS "orderCount",
				COALESCE(SUM(o."totalAmount"), 0)::text AS "totalAmount",
				COALESCE(SUM(o."totalCost"), 0)::text AS "totalCost"
			FROM orders o
			WHERE o.date >= ${startOfDay}
			AND o.date <= ${endOfDay}
			AND o.status = 'Completed'
			AND (${cashierFilter}::bigint IS NULL OR o."createdById" = ${cashierFilter})
			GROUP BY o."paymentMethod"
			ORDER BY o."paymentMethod" ASC;
		`

		// 2. Order Status Breakdown
		const statusRows = await this.db.client.$queryRaw<RawStatusAgg[]>`
			SELECT 
				o.status,
				COUNT(o.id)::int AS "count",
				COALESCE(SUM(o."totalAmount"), 0)::text AS "totalAmount"
			FROM orders o
			WHERE o.date >= ${startOfDay}
			  AND o.date <= ${endOfDay}
			  AND (${cashierFilter}::bigint IS NULL OR o."createdById" = ${cashierFilter})
			GROUP BY o.status
			ORDER BY o.status ASC;
		`

		// 3. Item Level Aggregation (Quantities, Categories, Top Selling Products)
		const itemRows = await this.db.client.$queryRaw<RawItemAgg[]>`
			SELECT 
				p.id AS "productId",
				p.sku,
				p.name AS "productName",
				c.name AS "categoryName",
				COALESCE(SUM(oi.quantity), 0)::text AS "totalQuantity",
				COALESCE(SUM(oi.subtotal), 0)::text AS "totalAmount"
			FROM order_items oi
			JOIN orders o ON o.id = oi."orderId"
			JOIN products p ON p.id = oi."productId"
			JOIN categories c ON c.id = p."categoryId"
			WHERE o.date >= ${startOfDay}
			  AND o.date <= ${endOfDay}
			  AND o.status = 'Completed'
			  AND (${cashierFilter}::bigint IS NULL OR o."createdById" = ${cashierFilter})
			GROUP BY p.id, p.sku, p.name, c.name
			ORDER BY SUM(oi.subtotal) DESC;
		`

		let grossSales = new Prisma.Decimal(0)
		let totalCost = new Prisma.Decimal(0)
		let totalOrders = 0
		let cashCollected = new Prisma.Decimal(0)

		const payments: ZReportPaymentLine[] = []
		for (const p of paymentRows) {
			const amt = new Prisma.Decimal(p.totalAmount)
			const cost = new Prisma.Decimal(p.totalCost)

			grossSales = grossSales.add(amt)
			totalCost = totalCost.add(cost)
			totalOrders += p.orderCount

			if (p.paymentMethod === 'Cash') {
				cashCollected = amt
			}

			payments.push({
				paymentMethod: p.paymentMethod,
				orderCount: p.orderCount,
				totalAmount: amt.toDecimalPlaces(4).toString(),
			})
		}

		// Calculate Profit & Margin
		const grossProfit = grossSales.minus(totalCost)
		const grossMarginPercent = grossSales.isZero()
			? new Prisma.Decimal(0)
			: grossProfit.div(grossSales).mul(100)

		const averageTicket =
			totalOrders === 0 ? new Prisma.Decimal(0) : grossSales.div(totalOrders)

		// Aggregate Categories
		let totalItemsSold = new Prisma.Decimal(0)
		const categoryMap = new Map<string, { qty: Prisma.Decimal; amount: Prisma.Decimal }>()

		for (const item of itemRows) {
			const qty = new Prisma.Decimal(item.totalQuantity)
			const amt = new Prisma.Decimal(item.totalAmount)

			totalItemsSold = totalItemsSold.add(qty)

			const existing = categoryMap.get(item.categoryName) ?? {
				qty: new Prisma.Decimal(0),
				amount: new Prisma.Decimal(0),
			}
			existing.qty = existing.qty.add(qty)
			existing.amount = existing.amount.add(amt)
			categoryMap.set(item.categoryName, existing)
		}

		const categories: ZReportCategoryLine[] = Array.from(categoryMap.entries()).map(
			([name, val]) => ({
				categoryName: name,
				quantity: val.qty.toDecimalPlaces(4).toString(),
				totalAmount: val.amount.toDecimalPlaces(4).toString(),
			}),
		)

		const topProducts: ZReportProductLine[] = itemRows.slice(0, 10).map(i => ({
			productId: i.productId.toString(),
			sku: i.sku,
			name: i.productName,
			categoryName: i.categoryName,
			quantity: new Prisma.Decimal(i.totalQuantity).toDecimalPlaces(4).toString(),
			totalAmount: new Prisma.Decimal(i.totalAmount).toDecimalPlaces(4).toString(),
		}))

		const statuses: ZReportStatusLine[] = statusRows.map(s => ({
			status: s.status,
			count: s.count,
			totalAmount: new Prisma.Decimal(s.totalAmount).toDecimalPlaces(4).toString(),
		}))

		return {
			date: startOfDay.getTime(),
			cashierName,
			grossSales: grossSales.toDecimalPlaces(4).toString(),
			totalCost: totalCost.toDecimalPlaces(4).toString(),
			grossProfit: grossProfit.toDecimalPlaces(4).toString(),
			grossMarginPercent: grossMarginPercent.toFixed(2),
			totalOrders,
			totalItemsSold: totalItemsSold.toDecimalPlaces(4).toString(),
			averageTicket: averageTicket.toDecimalPlaces(4).toString(),
			cashCollected: cashCollected.toDecimalPlaces(4).toString(),
			payments,
			statuses,
			categories,
			topProducts,
		}
	}

	exportZReportExcel(report: ZReportData) {
		return exportZReportExcel(report)
	}

	exportZReportPdf(report: ZReportData) {
		return exportZReportPdf(report)
	}

	exportZReportCsv(report: ZReportData) {
		return exportZReportCsv(report)
	}

	async getSalesByProduct(
		fromDate: Date,
		toDate: Date,
		categoryId?: bigint,
	): Promise<SalesByProductReportData> {
		let categoryFilterName = 'All Categories'
		if (categoryId) {
			const cat = await this.db.client.category.findUnique({
				where: { id: categoryId },
				select: { name: true },
			})
			if (cat) categoryFilterName = cat.name
		}

		// SQL aggregation grouping historical sales and line-item costs by product
		const categoryFilter = categoryId ?? null

		const rows = await this.db.client.$queryRaw<RawProductSalesAgg[]>`
			SELECT 
				p.id AS "productId",
				p.sku,
				p.name AS "productName",
				c.id AS "categoryId",
				c.name AS "categoryName",
				COALESCE(SUM(oi.quantity), 0)::text AS "quantitySold",
				COALESCE(SUM(oi.subtotal), 0)::text AS "totalRevenue",
				COALESCE(SUM(oi.quantity * oi."unitCost"), 0)::text AS "totalCost"
			FROM order_items oi
			JOIN orders o ON o.id = oi."orderId"
			JOIN products p ON p.id = oi."productId"
			JOIN categories c ON c.id = p."categoryId"
			WHERE o.date >= ${fromDate}
			AND o.date <= ${toDate}
			AND o.status = 'Completed'
			AND (${categoryFilter}::bigint IS NULL OR c.id = ${categoryFilter})
			GROUP BY p.id, p.sku, p.name, c.id, c.name
			ORDER BY SUM(oi.subtotal) DESC;
		`

		let totalQty = new Prisma.Decimal(0)
		let totalRev = new Prisma.Decimal(0)
		let totalCost = new Prisma.Decimal(0)

		const products: ProductSalesLine[] = []
		const categoryMap = new Map<
			string,
			{
				categoryId: string
				categoryName: string
				productCount: number
				qty: Prisma.Decimal
				rev: Prisma.Decimal
				cost: Prisma.Decimal
			}
		>()

		for (const row of rows) {
			const qty = new Prisma.Decimal(row.quantitySold)
			const rev = new Prisma.Decimal(row.totalRevenue)
			const cost = new Prisma.Decimal(row.totalCost)
			const profit = rev.minus(cost)
			const margin = rev.isZero() ? new Prisma.Decimal(0) : profit.div(rev).mul(100)

			totalQty = totalQty.add(qty)
			totalRev = totalRev.add(rev)
			totalCost = totalCost.add(cost)

			products.push({
				productId: row.productId.toString(),
				sku: row.sku,
				name: row.productName,
				categoryId: row.categoryId.toString(),
				categoryName: row.categoryName,
				quantitySold: qty.toDecimalPlaces(4).toString(),
				totalRevenue: rev.toDecimalPlaces(4).toString(),
				totalCost: cost.toDecimalPlaces(4).toString(),
				grossProfit: profit.toDecimalPlaces(4).toString(),
				marginPercent: margin.toFixed(2),
			})

			// Group into Category Summary
			const catKey = row.categoryId.toString()
			const existingCat = categoryMap.get(catKey) ?? {
				categoryId: catKey,
				categoryName: row.categoryName,
				productCount: 0,
				qty: new Prisma.Decimal(0),
				rev: new Prisma.Decimal(0),
				cost: new Prisma.Decimal(0),
			}

			existingCat.productCount += 1
			existingCat.qty = existingCat.qty.add(qty)
			existingCat.rev = existingCat.rev.add(rev)
			existingCat.cost = existingCat.cost.add(cost)
			categoryMap.set(catKey, existingCat)
		}

		const overallProfit = totalRev.minus(totalCost)
		const overallMarginPercent = totalRev.isZero()
			? new Prisma.Decimal(0)
			: overallProfit.div(totalRev).mul(100)

		const categories: CategorySalesLine[] = Array.from(categoryMap.values()).map(c => {
			const catProfit = c.rev.minus(c.cost)
			const catMargin = c.rev.isZero() ? new Prisma.Decimal(0) : catProfit.div(c.rev).mul(100)

			return {
				categoryId: c.categoryId,
				categoryName: c.categoryName,
				productCount: c.productCount,
				quantitySold: c.qty.toDecimalPlaces(4).toString(),
				totalRevenue: c.rev.toDecimalPlaces(4).toString(),
				totalCost: c.cost.toDecimalPlaces(4).toString(),
				grossProfit: catProfit.toDecimalPlaces(4).toString(),
				marginPercent: catMargin.toFixed(2),
			}
		})

		return {
			fromDate: fromDate.getTime(),
			toDate: toDate.getTime(),
			categoryFilterName,
			summary: {
				totalQuantity: totalQty.toDecimalPlaces(4).toString(),
				totalRevenue: totalRev.toDecimalPlaces(4).toString(),
				totalCost: totalCost.toDecimalPlaces(4).toString(),
				totalProfit: overallProfit.toDecimalPlaces(4).toString(),
				overallMarginPercent: overallMarginPercent.toFixed(2),
			},
			categories,
			products,
		}
	}

	exportSalesByProductExcel(report: SalesByProductReportData) {
		return exportSalesByProductExcel(report)
	}

	exportSalesByProductPdf(report: SalesByProductReportData) {
		return exportSalesByProductPdf(report)
	}

	exportSalesByProductCsv(report: SalesByProductReportData) {
		return exportSalesByProductCsv(report)
	}

	async getInventoryValuation(
		fromDate: Date,
		toDate: Date,
	): Promise<InventoryValuationReportData> {
		// 1. Current on-hand valuation for all active catalog products
		const valuationRows = await this.db.client.$queryRaw<RawValuationRow[]>`
			SELECT 
				p.id AS "productId",
				p.sku,
				p.name AS "productName",
				c.name AS "categoryName",
				p."currentStock"::text AS "currentStock",
				p."costPrice"::text AS "costPrice",
				(p."currentStock" * p."costPrice")::text AS "totalValue"
			FROM products p
			JOIN categories c ON c.id = p."categoryId"
			WHERE p."disabledAt" IS NULL
			ORDER BY (p."currentStock" * p."costPrice") DESC;
		`

		// 2. Shrinkage, waste & correction lines within the period
		const shrinkageRows = await this.db.client.$queryRaw<RawShrinkageRow[]>`
			SELECT 
				sa."adjustmentNumber",
				sa.date,
				sa.type,
				p.sku,
				p.name AS "productName",
				sai.quantity::text AS "quantityAdjusted",
				sai."unitCost"::text AS "unitCost",
				sai."subtotalCost"::text AS "subtotalCost",
				sa.reason
			FROM stock_adjustment_items sai
			JOIN stock_adjustments sa ON sa.id = sai."stockAdjustmentId"
			JOIN products p ON p.id = sai."productId"
			WHERE sa.date >= ${fromDate}
			  AND sa.date <= ${toDate}
			ORDER BY sa.date DESC, sa.id DESC;
		`

		let totalValuation = new Prisma.Decimal(0)
		let totalUnits = new Prisma.Decimal(0)

		const valuationItems: InventoryValuationItem[] = valuationRows.map(r => {
			const stock = new Prisma.Decimal(r.currentStock)
			const val = new Prisma.Decimal(r.totalValue)

			totalUnits = totalUnits.add(stock)
			totalValuation = totalValuation.add(val)

			return {
				productId: r.productId.toString(),
				sku: r.sku,
				name: r.productName,
				categoryName: r.categoryName,
				currentStock: stock.toDecimalPlaces(4).toString(),
				costPrice: new Prisma.Decimal(r.costPrice).toDecimalPlaces(4).toString(),
				totalValue: val.toDecimalPlaces(4).toString(),
			}
		})

		let totalWasteCost = new Prisma.Decimal(0)
		let totalShrinkageCost = new Prisma.Decimal(0)
		let totalSurplusCost = new Prisma.Decimal(0)

		const discrepancies: ShrinkageDiscrepancyItem[] = shrinkageRows.map(s => {
			const qty = new Prisma.Decimal(s.quantityAdjusted)
			const sub = new Prisma.Decimal(s.subtotalCost)

			if (s.type === 'Waste') {
				totalWasteCost = totalWasteCost.add(sub)
			} else if (s.type === 'Correction') {
				if (qty.isNegative()) {
					totalShrinkageCost = totalShrinkageCost.add(sub)
				} else {
					totalSurplusCost = totalSurplusCost.add(sub)
				}
			}

			return {
				adjustmentNumber: s.adjustmentNumber,
				date: s.date.getTime(),
				type: s.type,
				sku: s.sku,
				productName: s.productName,
				quantityAdjusted: qty.toDecimalPlaces(4).toString(),
				unitCost: new Prisma.Decimal(s.unitCost).toDecimalPlaces(4).toString(),
				subtotalCost: sub.toDecimalPlaces(4).toString(),
				reason: s.reason,
			}
		})

		const netLossCost = totalWasteCost.add(totalShrinkageCost).minus(totalSurplusCost)

		return {
			asOfDate: Date.now(),
			fromDate: fromDate.getTime(),
			toDate: toDate.getTime(),
			summary: {
				totalValuation: totalValuation.toDecimalPlaces(4).toString(),
				totalUnitsOnHand: totalUnits.toDecimalPlaces(4).toString(),
				totalWasteCost: totalWasteCost.toDecimalPlaces(4).toString(),
				totalShrinkageCost: totalShrinkageCost.toDecimalPlaces(4).toString(),
				totalSurplusCost: totalSurplusCost.toDecimalPlaces(4).toString(),
				netLossCost: netLossCost.toDecimalPlaces(4).toString(),
			},
			valuationItems,
			discrepancies,
		}
	}

	exportInventoryValuationExcel(
		report: InventoryValuationReportData,
		view: 'valuation' | 'shrinkage' = 'valuation',
	) {
		return exportInventoryValuationExcel(report, view)
	}

	exportInventoryValuationPdf(
		report: InventoryValuationReportData,
		view: 'valuation' | 'shrinkage' = 'valuation',
	) {
		return exportInventoryValuationPdf(report, view)
	}

	exportInventoryValuationCsv(
		report: InventoryValuationReportData,
		view: 'valuation' | 'shrinkage' = 'valuation',
	) {
		return exportInventoryValuationCsv(report, view)
	}

	async getStockMovementReport(
		fromDate: Date,
		toDate: Date,
		productId?: bigint,
		movementType?: string,
	): Promise<StockMovementReportData> {
		let filteredProduct: { id: string; sku: string; name: string } | null = null
		let openingStockDec = new Prisma.Decimal(0)
		let hasSpecificProduct = false

		if (productId) {
			const p = await this.db.client.product.findUnique({
				where: { id: productId },
				select: { id: true, sku: true, name: true },
			})
			if (p) {
				hasSpecificProduct = true
				filteredProduct = { id: p.id.toString(), sku: p.sku, name: p.name }

				// Cumulative opening stock before fromDate
				const openingRes = await this.db.client.$queryRaw<RawOpeningStock[]>`
					SELECT 
						COALESCE(SUM(sm.quantity), 0)::text AS "openingStock"
					FROM stock_movements sm
					WHERE sm."productId" = ${productId}
					  AND sm."createdAt" < ${fromDate};
				`
				if (openingRes[0]) {
					openingStockDec = new Prisma.Decimal(openingRes[0].openingStock)
				}
			}
		}

		// Chronological stock movement trail
		const productFilter = productId ?? null
		const typeFilter = movementType ?? null

		const rows = await this.db.client.$queryRaw<RawMovementRow[]>`
			SELECT 
				sm.id AS "movementId",
				sm."createdAt" AS "date",
				sm.type,
				p.id AS "productId",
				p.sku,
				p.name AS "productName",
				sm.quantity::text AS "quantity",
				sm."costPerUnit"::text AS "costPerUnit",
				(ABS(sm.quantity) * sm."costPerUnit")::text AS "totalCost",
				o."orderNumber",
				sa."adjustmentNumber",
				sup.name AS "supplierName",
				u.name AS "createdByName"
			FROM stock_movements sm
			JOIN products p ON p.id = sm."productId"
			JOIN users u ON u.id = sm."createdById"
			LEFT JOIN orders o ON o.id = sm."orderId"
			LEFT JOIN stock_adjustments sa ON sa.id = sm."stockAdjustmentId"
			LEFT JOIN suppliers sup ON sup.id = sa."supplierId"
			WHERE sm."createdAt" >= ${fromDate}
			AND sm."createdAt" <= ${toDate}
			AND (${productFilter}::bigint IS NULL OR sm."productId" = ${productFilter})
			AND (${typeFilter}::text IS NULL OR sm.type = ${typeFilter})
			ORDER BY sm."createdAt" ASC, sm.id ASC;
		`

		let totalIn = new Prisma.Decimal(0)
		let totalOut = new Prisma.Decimal(0)
		let runningStock = openingStockDec

		const movements: StockMovementLineItem[] = []

		for (const row of rows) {
			const qty = new Prisma.Decimal(row.quantity)

			if (qty.isPositive()) {
				totalIn = totalIn.add(qty)
			} else {
				totalOut = totalOut.add(qty.abs())
			}

			if (hasSpecificProduct) {
				runningStock = runningStock.add(qty)
			}

			movements.push({
				movementId: row.movementId.toString(),
				date: row.date.getTime(),
				type: row.type,
				productId: row.productId.toString(),
				sku: row.sku,
				productName: row.productName,
				quantity: qty.toDecimalPlaces(4).toString(),
				costPerUnit: new Prisma.Decimal(row.costPerUnit).toDecimalPlaces(4).toString(),
				totalCost: new Prisma.Decimal(row.totalCost).toDecimalPlaces(4).toString(),
				referenceNumber: row.orderNumber ?? row.adjustmentNumber ?? '-',
				createdByName: row.createdByName,
				supplierName: row.supplierName ?? undefined,
				runningStock: hasSpecificProduct
					? runningStock.toDecimalPlaces(4).toString()
					: undefined,
			})
		}

		const netDelta = totalIn.minus(totalOut)

		return {
			fromDate: fromDate.getTime(),
			toDate: toDate.getTime(),
			filteredProduct,
			openingStock: hasSpecificProduct ? openingStockDec.toDecimalPlaces(4).toString() : null,
			closingStock: hasSpecificProduct ? runningStock.toDecimalPlaces(4).toString() : null,
			totalIn: totalIn.toDecimalPlaces(4).toString(),
			totalOut: totalOut.toDecimalPlaces(4).toString(),
			netDelta: netDelta.toDecimalPlaces(4).toString(),
			movements,
		}
	}

	exportStockMovementExcel(report: StockMovementReportData) {
		return exportStockMovementExcel(report)
	}

	exportStockMovementPdf(report: StockMovementReportData) {
		return exportStockMovementPdf(report)
	}

	exportStockMovementCsv(report: StockMovementReportData) {
		return exportStockMovementCsv(report)
	}
}

export default ReportService
