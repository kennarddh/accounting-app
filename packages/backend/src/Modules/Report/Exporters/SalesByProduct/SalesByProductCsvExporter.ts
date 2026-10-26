import { SalesByProductReportData } from '../../ReportService'

export const exportSalesByProductCsv = async (
	report: SalesByProductReportData,
): Promise<Buffer> => {
	const rows: string[] = []

	// CSV Header
	rows.push('Category,SKU,Product Name,Quantity Sold,Revenue,Cost,Gross Profit,Margin Percent')

	const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`

	for (const p of report.products) {
		rows.push(
			`${escapeCsv(p.categoryName)},"${p.sku}",${escapeCsv(p.name)},${p.quantitySold},${p.totalRevenue},${p.totalCost},${p.grossProfit},${p.marginPercent}`,
		)
	}

	// Grand Totals Summary Row
	rows.push(
		`"TOTALS","Summary","All Products",${report.summary.totalQuantity},${report.summary.totalRevenue},${report.summary.totalCost},${report.summary.totalProfit},${report.summary.overallMarginPercent}`,
	)

	const csvContent = '\uFEFF' + rows.join('\r\n')
	return Buffer.from(csvContent, 'utf-8')
}
