import { DI, Injectable, Service } from '@celosiajs/core'

import { AccountType } from '@accounting-app/common'

import DatabaseService from 'Modules/Database/DatabaseService'
import PosConfigurationService from 'Modules/PosConfiguration/PosConfigurationService'

import { Prisma } from 'PrismaGenerated/client'

import { exportBalanceSheetCsv } from './Exporters/BalanceSheet/BalanceSheetCsvExporter'
import { exportBalanceSheetExcel } from './Exporters/BalanceSheet/BalanceSheetExcelExporter'
import { exportBalanceSheetPdf } from './Exporters/BalanceSheet/BalanceSheetPdfExporter'
import { exportProfitAndLossCsv } from './Exporters/ProfitAndLoss/ProfitAndLossCsvExporter'
import { exportProfitAndLossExcel } from './Exporters/ProfitAndLoss/ProfitAndLossExcelExporter'
import { exportProfitAndLossPdf } from './Exporters/ProfitAndLoss/ProfitAndLossPdfExporter'
import { exportTrialBalanceCsv } from './Exporters/TrialBalance/TrialBalanceCsvExporter'
import { exportTrialBalanceExcel } from './Exporters/TrialBalance/TrialBalanceExcelExporter'
import { exportTrialBalancePdf } from './Exporters/TrialBalance/TrialBalancePdfExporter'

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
	fromDate: number
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

	async getTrialBalance(fromDate: Date, toDate: Date): Promise<TrialBalanceReportData> {
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
			WHERE je.date >= ${fromDate}
			  AND je.date <= ${toDate}
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
			fromDate: fromDate.getTime(),
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
}

export default ReportService
