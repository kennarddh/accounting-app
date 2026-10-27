import ExcelJS from 'exceljs'

import { StockMovementReportData } from '../../ReportService'

export const buildStockMovementWorkbook = (report: StockMovementReportData): ExcelJS.Workbook => {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Stock Movements')

	sheet.columns = [
		{ key: 'date', width: 14 },
		{ key: 'ref', width: 22 },
		{ key: 'type', width: 14 },
		{ key: 'sku', width: 14 },
		{ key: 'name', width: 30 },
		{ key: 'qty', width: 16 },
		{ key: 'cost', width: 16 },
		{ key: 'total', width: 18 },
		{ key: 'balance', width: 16 },
		{ key: 'user', width: 20 },
	]

	// 1. Title Block
	const titleRow = sheet.addRow(['STOCK MOVEMENT AUDIT REPORT (STOCK CARD)'])
	titleRow.font = { name: 'Arial', size: 15, bold: true }
	sheet.mergeCells('A1:J1')

	const subTitle = report.filteredProduct
		? `Product: ${report.filteredProduct.sku} - ${report.filteredProduct.name} | Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`
		: `All Products | Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`

	const subRow = sheet.addRow([subTitle])
	subRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
	sheet.mergeCells('A2:J2')

	sheet.addRow([])

	// 2. Column Headers
	const headerRow = sheet.addRow([
		'Date',
		'Reference #',
		'Type',
		'SKU',
		'Product Name',
		'Quantity',
		'Cost / Unit',
		'Total Value',
		'Balance',
		'Created By',
	])
	headerRow.font = { bold: true }
	headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }

	// 3. Opening Stock (if single product)
	if (report.filteredProduct && report.openingStock !== null) {
		const openRow = sheet.addRow([
			'',
			'',
			'OPENING',
			report.filteredProduct.sku,
			'Opening Inventory Balance',
			'',
			'',
			'',
			parseFloat(report.openingStock),
			'System',
		])
		openRow.font = { italic: true, bold: true, color: { argb: 'FF475569' } }
		openRow.getCell(9).numFmt = '#,##0.00'
	}

	// 4. Data Rows
	for (const m of report.movements) {
		const row = sheet.addRow([
			new Date(m.date).toLocaleDateString(),
			m.referenceNumber,
			m.type,
			m.sku,
			m.productName,
			parseFloat(m.quantity),
			parseFloat(m.costPerUnit),
			parseFloat(m.totalCost),
			m.runningStock !== undefined ? parseFloat(m.runningStock) : '',
			m.createdByName,
		])

		row.getCell(6).numFmt = '#,##0.00'
		row.getCell(7).numFmt = '#,##0.00'
		row.getCell(8).numFmt = '#,##0.00'
		if (m.runningStock !== undefined) {
			row.getCell(9).numFmt = '#,##0.00'
		}
	}

	sheet.addRow([])

	// 5. Summary Row
	const summaryRow = sheet.addRow([
		'TOTALS',
		'',
		'',
		'',
		`Net Change: ${report.netDelta}`,
		`+${report.totalIn} / -${report.totalOut}`,
		'',
		'',
		report.closingStock !== null ? parseFloat(report.closingStock) : '',
		'',
	])
	summaryRow.font = { bold: true }
	summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }

	return workbook
}

export const exportStockMovementExcel = async (
	report: StockMovementReportData,
): Promise<Buffer> => {
	const workbook = buildStockMovementWorkbook(report)
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
