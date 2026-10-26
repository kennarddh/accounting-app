import { DI, Injectable, Service } from '@celosiajs/core'

import { AccountType } from '@accounting-app/common'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

import DatabaseService from 'Modules/Database/DatabaseService'
import PosConfigurationService from 'Modules/PosConfiguration/PosConfigurationService'

import { Prisma } from 'PrismaGenerated/client'

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

		// 1. High-performance SQL aggregation of revenues & expenses within date range
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

			// Normal balance for Revenue is Credit (Credit - Debit)
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
				// Normal balance for Expense is Debit (Debit - Credit)
				const balance = debit.minus(credit)

				if (!balance.isZero()) {
					// Check if account is configured as Cost of Goods Sold (COGS)
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

		// Gross Profit = Total Revenue - Total COGS
		const grossProfit = totalRevenue.minus(totalCogs)

		// Net Profit / (Loss) = Gross Profit - Operating Expenses
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

	/**
	 * Generates a styled Excel workbook buffer (.xlsx) with proper title hierarchy
	 */
	async generateProfitAndLossExcel(report: ProfitAndLossReportData): Promise<Buffer> {
		const workbook = new ExcelJS.Workbook()
		const sheet = workbook.addWorksheet('Profit & Loss')

		// 1. Set column widths & keys WITHOUT the auto-header
		sheet.columns = [
			{ key: 'name', width: 42 },
			{ key: 'code', width: 16 },
			{ key: 'amount', width: 24 },
		]

		// 2. Title Block (Rows 1 & 2)
		const titleRow = sheet.addRow(['PROFIT & LOSS STATEMENT'])
		titleRow.font = { name: 'Arial', size: 16, bold: true }
		sheet.mergeCells('A1:C1')

		const periodRow = sheet.addRow([
			`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
		])
		periodRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
		sheet.mergeCells('A2:C2')

		// 3. Spacing (Row 3)
		sheet.addRow([])

		// 4. Actual Table Column Header (Row 4)
		const headerRow = sheet.addRow(['Account / Section', 'Account Code', 'Amount (IDR)'])
		headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } }
		headerRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFF1F5F9' }, // Light slate header background
		}
		headerRow.alignment = { vertical: 'middle' }
		headerRow.getCell(3).alignment = { horizontal: 'right' }
		headerRow.height = 24

		sheet.addRow([])

		// Helper to style section headers
		const addSectionHeader = (title: string) => {
			const row = sheet.addRow([title, '', ''])
			row.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } }
			row.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF8FAFC' },
			}
			return row
		}

		// Helper to format total rows (Accounting style: bold + thin top border)
		const addTotalRow = (label: string, total: string) => {
			const row = sheet.addRow([label, '', parseFloat(total)])
			row.font = { name: 'Arial', bold: true }
			row.getCell(3).numFmt = '#,##0.00'
			row.getCell(3).alignment = { horizontal: 'right' }
			row.getCell(3).border = {
				top: { style: 'thin', color: { argb: 'FF94A3B8' } },
				bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
			}
			return row
		}

		// Section 1: Operating Revenues
		addSectionHeader('1. OPERATING REVENUES')
		if (report.revenues.items.length === 0) {
			sheet.addRow(['   (No revenues recorded)', '', 0])
		} else {
			for (const rev of report.revenues.items) {
				const row = sheet.addRow([`   ${rev.name}`, rev.code, parseFloat(rev.amount)])
				row.getCell(3).numFmt = '#,##0.00'
				row.getCell(3).alignment = { horizontal: 'right' }
			}
		}
		addTotalRow('Total Revenues', report.revenues.total)
		sheet.addRow([])

		// Section 2: COGS
		addSectionHeader('2. COST OF GOODS SOLD (COGS)')
		if (report.cogs.items.length === 0) {
			sheet.addRow(['   (No COGS recorded)', '', 0])
		} else {
			for (const c of report.cogs.items) {
				const row = sheet.addRow([`   ${c.name}`, c.code, parseFloat(c.amount)])
				row.getCell(3).numFmt = '#,##0.00'
				row.getCell(3).alignment = { horizontal: 'right' }
			}
		}
		addTotalRow('Total Cost of Goods Sold', report.cogs.total)
		sheet.addRow([])

		// Highlight: Gross Profit
		const grossRow = sheet.addRow(['GROSS PROFIT', '', parseFloat(report.grossProfit)])
		grossRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0369A1' } }
		grossRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFE2E8F0' },
		}
		grossRow.getCell(3).numFmt = '#,##0.00'
		grossRow.getCell(3).alignment = { horizontal: 'right' }
		sheet.addRow([])

		// Section 3: Operating Expenses
		addSectionHeader('3. OPERATING EXPENSES')
		if (report.expenses.items.length === 0) {
			sheet.addRow(['   (No operating expenses recorded)', '', 0])
		} else {
			for (const exp of report.expenses.items) {
				const row = sheet.addRow([`   ${exp.name}`, exp.code, parseFloat(exp.amount)])
				row.getCell(3).numFmt = '#,##0.00'
				row.getCell(3).alignment = { horizontal: 'right' }
			}
		}
		addTotalRow('Total Operating Expenses', report.expenses.total)
		sheet.addRow([])

		// Highlight: Net Profit / Loss (Accounting Double-underline)
		const isNetPositive = parseFloat(report.netProfit) >= 0
		const netRow = sheet.addRow([
			isNetPositive ? 'NET PROFIT' : 'NET LOSS',
			'',
			parseFloat(report.netProfit),
		])
		netRow.font = {
			name: 'Arial',
			size: 13,
			bold: true,
			color: { argb: isNetPositive ? 'FF15803D' : 'FFB91C1C' },
		}
		netRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: isNetPositive ? 'FFDCFCE7' : 'FFFEE2E2' },
		}
		netRow.height = 26
		netRow.alignment = { vertical: 'middle' }

		const netAmountCell = netRow.getCell(3)
		netAmountCell.numFmt = '#,##0.00'
		netAmountCell.alignment = { horizontal: 'right', vertical: 'middle' }
		netAmountCell.border = {
			top: { style: 'thin' },
			bottom: { style: 'double' }, // Standard accounting bottom double line
		}

		return Buffer.from(await workbook.xlsx.writeBuffer())
	}

	/**
	 * Generates a clean tabular CSV string
	 */
	generateProfitAndLossCSV(report: ProfitAndLossReportData): string {
		const lines: string[] = []
		lines.push('"Section / Account","Code","Amount"')

		// Revenues
		lines.push('"--- OPERATING REVENUES ---","",""')
		for (const rev of report.revenues.items) {
			lines.push(`"${rev.name.replace(/"/g, '""')}","${rev.code}","${rev.amount}"`)
		}
		lines.push(`"Total Revenues","","${report.revenues.total}"`)

		// COGS
		lines.push('"--- COST OF GOODS SOLD ---","",""')
		for (const c of report.cogs.items) {
			lines.push(`"${c.name.replace(/"/g, '""')}","${c.code}","${c.amount}"`)
		}
		lines.push(`"Total Cost of Goods Sold","","${report.cogs.total}"`)

		// Gross Profit
		lines.push(`"GROSS PROFIT","","${report.grossProfit}"`)

		// Expenses
		lines.push('"--- OPERATING EXPENSES ---","",""')
		for (const exp of report.expenses.items) {
			lines.push(`"${exp.name.replace(/"/g, '""')}","${exp.code}","${exp.amount}"`)
		}
		lines.push(`"Total Operating Expenses","","${report.expenses.total}"`)

		// Net Profit
		lines.push(`"NET PROFIT / (LOSS)","","${report.netProfit}"`)

		return lines.join('\n')
	}

	/**
	 * Generates a vector PDF buffer
	 */
	generateProfitAndLossPDF(report: ProfitAndLossReportData): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const doc = new PDFDocument({ margin: 40, size: 'A4' })
			const buffers: Buffer[] = []

			doc.on('data', (b: Buffer) => buffers.push(b))
			doc.on('end', () => resolve(Buffer.concat(buffers)))
			doc.on('error', reject)

			// Header
			doc.fontSize(18).text('PROFIT & LOSS STATEMENT', { align: 'center' })
			doc.fontSize(10)
				.fillColor('#64748b')
				.text(
					`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
					{ align: 'center' },
				)
			doc.moveDown(1.5)

			const writeSection = (title: string, items: ProfitAndLossLine[], total: string) => {
				doc.fontSize(12).fillColor('#0f172a').text(title, { underline: true })
				doc.moveDown(0.5)

				if (items.length === 0) {
					doc.fontSize(10)
						.fillColor('#94a3b8')
						.text('   (No transactions in this period)')
				} else {
					for (const item of items) {
						doc.fontSize(10)
							.fillColor('#334155')
							.text(`   ${item.code} - ${item.name}`, { continued: true })
						doc.text(`Rp ${parseFloat(item.amount).toLocaleString('id-ID')}`, {
							align: 'right',
						})
					}
				}

				doc.moveDown(0.3)
				doc.fontSize(10).fillColor('#000').text(`   Total ${title}`, { continued: true })
				doc.text(`Rp ${parseFloat(total).toLocaleString('id-ID')}`, { align: 'right' })
				doc.moveDown(1)
			}

			writeSection('Operating Revenues', report.revenues.items, report.revenues.total)
			writeSection('Cost of Goods Sold', report.cogs.items, report.cogs.total)

			// Gross Profit
			doc.fontSize(12).fillColor('#0284c7').text('GROSS PROFIT', { continued: true })
			doc.text(`Rp ${parseFloat(report.grossProfit).toLocaleString('id-ID')}`, {
				align: 'right',
			})
			doc.moveDown(1.5)

			writeSection('Operating Expenses', report.expenses.items, report.expenses.total)

			// Net Profit / Loss Highlight
			const isPositive = parseFloat(report.netProfit) >= 0
			doc.rect(40, doc.y, 515, 30).fill(isPositive ? '#dcfce7' : '#fee2e2')
			doc.fontSize(13)
				.fillColor(isPositive ? '#15803d' : '#b91c1c')
				.text(isPositive ? 'NET PROFIT' : 'NET LOSS', 50, doc.y + 8, { continued: true })
			doc.text(`Rp ${parseFloat(report.netProfit).toLocaleString('id-ID')}`, {
				align: 'right',
			})

			doc.end()
		})
	}
}

export default ReportService
