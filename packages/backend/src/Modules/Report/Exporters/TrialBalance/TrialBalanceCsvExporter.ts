import { TrialBalanceReportData } from '../../ReportService'

export const exportTrialBalanceCsv = async (report: TrialBalanceReportData): Promise<Buffer> => {
	const rows: string[] = []

	// Header row
	rows.push('Account Code,Account Name,Account Type,Debit,Credit')

	const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`

	for (const item of report.items) {
		rows.push(
			`"${item.code}",${escapeCsv(item.name)},"${item.type}",${item.debit},${item.credit}`,
		)
	}

	// Totals
	rows.push(
		`"TOTALS","Summary","${report.isBalanced ? 'Balanced' : 'Out of Balance'}",${report.totalDebit},${report.totalCredit}`,
	)

	const csvContent = '\uFEFF' + rows.join('\r\n')
	return Buffer.from(csvContent, 'utf-8')
}
