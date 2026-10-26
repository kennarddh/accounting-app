import { BalanceSheetReportData } from '../../ReportService'

export const exportBalanceSheetCsv = async (report: BalanceSheetReportData): Promise<Buffer> => {
	const rows: string[] = []

	// Header row
	rows.push('Classification,Account Code,Account Name,Amount')

	const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`

	for (const a of report.assets.items) {
		rows.push(`"Asset","${a.code}",${escapeCsv(a.name)},${a.amount}`)
	}
	rows.push(`"Asset Summary","","TOTAL ASSETS",${report.assets.total}`)

	for (const l of report.liabilities.items) {
		rows.push(`"Liability","${l.code}",${escapeCsv(l.name)},${l.amount}`)
	}
	rows.push(`"Liability Summary","","Total Liabilities",${report.liabilities.total}`)

	for (const e of report.equity.items) {
		rows.push(`"Equity","${e.code}",${escapeCsv(e.name)},${e.amount}`)
	}
	rows.push(`"Equity","","Retained Earnings",${report.equity.retainedEarnings}`)
	rows.push(`"Equity Summary","","Total Equity",${report.equity.total}`)

	rows.push(`"GRAND TOTAL","","Total Liabilities and Equity",${report.totalLiabilitiesAndEquity}`)

	const csvContent = '\uFEFF' + rows.join('\r\n')
	return Buffer.from(csvContent, 'utf-8')
}
