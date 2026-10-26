import { ZReportData } from '../../ReportService'

export const exportZReportCsv = async (report: ZReportData): Promise<Buffer> => {
	const rows: string[] = []

	rows.push('Section,Item,Count,Amount')

	// Summary KPIs
	rows.push(`"Summary","Gross Sales",${report.totalOrders},${report.grossSales}`)
	rows.push(`"Summary","Cost of Goods Sold",0,${report.totalCost}`)
	rows.push(`"Summary","Gross Margin (Profit)",0,${report.grossProfit}`)
	rows.push(`"Summary","Total Items Sold",${report.totalItemsSold},0`)
	rows.push(`"Summary","Average Ticket Size",0,${report.averageTicket}`)
	rows.push(`"Summary","Cash Collected",0,${report.cashCollected}`)

	// Payments
	for (const p of report.payments) {
		rows.push(`"Payment Method","${p.paymentMethod}",${p.orderCount},${p.totalAmount}`)
	}

	// Categories
	for (const c of report.categories) {
		rows.push(`"Category","${c.categoryName}",${c.quantity},${c.totalAmount}`)
	}

	// Top Products
	for (const p of report.topProducts) {
		rows.push(
			`"Product","${p.sku} - ${p.name.replace(/"/g, '""')}",${p.quantity},${p.totalAmount}`,
		)
	}

	const csvContent = '\uFEFF' + rows.join('\r\n')
	return Buffer.from(csvContent, 'utf-8')
}
