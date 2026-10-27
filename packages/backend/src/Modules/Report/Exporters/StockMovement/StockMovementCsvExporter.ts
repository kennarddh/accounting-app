import { StockMovementReportData } from '../../ReportService'

export const exportStockMovementCsv = async (report: StockMovementReportData): Promise<Buffer> => {
	const rows: string[] = []

	rows.push(
		'Date,Reference,Type,SKU,Product Name,Quantity,Unit Cost,Total Value,Running Stock,User',
	)

	const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`

	for (const m of report.movements) {
		const dateStr = new Date(m.date).toISOString().slice(0, 10)
		rows.push(
			`"${dateStr}","${m.referenceNumber}","${m.type}","${m.sku}",${escapeCsv(m.productName)},${m.quantity},${m.costPerUnit},${m.totalCost},"${m.runningStock ?? ''}",${escapeCsv(m.createdByName)}`,
		)
	}

	const csvContent = '\uFEFF' + rows.join('\r\n')
	return Buffer.from(csvContent, 'utf-8')
}
