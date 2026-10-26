import { DI, Injectable, Service } from '@celosiajs/core'

import { AccountType } from '@accounting-app/common'

import DatabaseService from 'Modules/Database/DatabaseService'
import PosConfigurationService from 'Modules/PosConfiguration/PosConfigurationService'

import { Prisma } from 'PrismaGenerated/client'

import { exportProfitAndLossCsv } from './Exporters/ProfitAndLoss/ProfitAndLossCsvExporter'
import { exportProfitAndLossExcel } from './Exporters/ProfitAndLoss/ProfitAndLossExcelExporter'
import { exportProfitAndLossPdf } from './Exporters/ProfitAndLoss/ProfitAndLossPdfExporter'

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
}

export default ReportService
