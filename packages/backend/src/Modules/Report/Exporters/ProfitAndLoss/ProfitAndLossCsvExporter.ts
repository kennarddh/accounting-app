import { ProfitAndLossReportData } from '../../ReportService'

export const exportProfitAndLossCsv = async (report: ProfitAndLossReportData): Promise<Buffer> => {
	const rows: string[] = []

	// 1. Strict, standardized CSV Header at Row 1
	rows.push('Section,Account Code,Account Name,Amount')

	// Helper to escape values containing commas or quotes
	const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`

	// 2. Revenues
	for (const item of report.revenues.items) {
		rows.push(`"Revenue","${item.code}",${escapeCsv(item.name)},${item.amount}`)
	}

	// 3. Cost of Goods Sold
	for (const item of report.cogs.items) {
		rows.push(`"Cost of Goods Sold","${item.code}",${escapeCsv(item.name)},${item.amount}`)
	}

	// 4. Operating Expenses
	for (const item of report.expenses.items) {
		rows.push(`"Operating Expense","${item.code}",${escapeCsv(item.name)},${item.amount}`)
	}

	// 5. Optional: Summary rows at the bottom (clearly marked)
	rows.push(`"Summary - Total Revenues","","Total Revenues",${report.revenues.total}`)
	rows.push(`"Summary - Total COGS","","Total Cost of Goods Sold",${report.cogs.total}`)
	rows.push(`"Summary - Gross Profit","","Gross Profit",${report.grossProfit}`)
	rows.push(`"Summary - Total Expenses","","Total Operating Expenses",${report.expenses.total}`)
	rows.push(`"Summary - Net Profit","","Net Profit",${report.netProfit}`)

	// Return as UTF-8 Buffer with BOM (\uFEFF) so Excel opens UTF-8 text without corrupted characters
	const csvContent = '\uFEFF' + rows.join('\r\n')

	return Buffer.from(csvContent, 'utf-8')
}
