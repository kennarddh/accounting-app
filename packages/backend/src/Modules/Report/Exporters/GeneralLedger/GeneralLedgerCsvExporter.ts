import { GeneralLedgerReportData } from '../../ReportService'

export const exportGeneralLedgerCsv = async (report: GeneralLedgerReportData): Promise<Buffer> => {
	const rows: string[] = []

	// Standard CSV Header
	rows.push('Date,Entry Number,Description,Debit,Credit,Running Balance')

	const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`

	// Opening Balance Row
	rows.push(`"","","OPENING BALANCE",0,0,${report.openingBalance}`)

	for (const tx of report.transactions) {
		const dateStr = new Date(tx.date).toISOString().slice(0, 10)
		rows.push(
			`"${dateStr}","${tx.entryNumber}",${escapeCsv(tx.description)},${tx.debit},${tx.credit},${tx.runningBalance}`,
		)
	}

	// Totals Row
	rows.push(
		`"TOTALS","","Ending Balance",${report.totalDebit},${report.totalCredit},${report.endingBalance}`,
	)

	const csvContent = '\uFEFF' + rows.join('\r\n')
	return Buffer.from(csvContent, 'utf-8')
}
