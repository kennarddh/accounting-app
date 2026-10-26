import { InventoryValuationReportData } from '../../ReportService'

export const exportInventoryValuationCsv = async (
	report: InventoryValuationReportData,
	view: 'valuation' | 'shrinkage' = 'valuation',
): Promise<Buffer> => {
	const rows: string[] = []
	const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`

	if (view === 'valuation') {
		rows.push('SKU,Product Name,Category,Units on Hand,Cost Price,Total Asset Value')
		for (const v of report.valuationItems) {
			rows.push(
				`"${v.sku}",${escapeCsv(v.name)},${escapeCsv(v.categoryName)},${v.currentStock},${v.costPrice},${v.totalValue}`,
			)
		}
		rows.push(
			`"TOTAL","All Inventory","Assets",${report.summary.totalUnitsOnHand},0,${report.summary.totalValuation}`,
		)
	} else {
		rows.push(
			'Date,Adjustment Number,Type,SKU,Product Name,Quantity Delta,Unit Cost,Value Impact,Reason',
		)
		for (const d of report.discrepancies) {
			const dateStr = new Date(d.date).toISOString().slice(0, 10)
			rows.push(
				`"${dateStr}","${d.adjustmentNumber}","${d.type}","${d.sku}",${escapeCsv(d.productName)},${d.quantityAdjusted},${d.unitCost},${d.subtotalCost},${escapeCsv(d.reason)}`,
			)
		}
	}

	const csvContent = '\uFEFF' + rows.join('\r\n')
	return Buffer.from(csvContent, 'utf-8')
}
