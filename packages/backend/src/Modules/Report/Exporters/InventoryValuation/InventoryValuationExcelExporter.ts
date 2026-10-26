import ExcelJS from 'exceljs'

import { InventoryValuationReportData } from '../../ReportService'

export const buildInventoryValuationWorkbook = (
	report: InventoryValuationReportData,
	view: 'valuation' | 'shrinkage' = 'valuation',
): ExcelJS.Workbook => {
	const workbook = new ExcelJS.Workbook()

	if (view === 'valuation') {
		const sheet = workbook.addWorksheet('Inventory Valuation')
		sheet.columns = [
			{ key: 'sku', width: 14 },
			{ key: 'name', width: 36 },
			{ key: 'category', width: 22 },
			{ key: 'stock', width: 16 },
			{ key: 'cost', width: 18 },
			{ key: 'total', width: 22 },
		]

		const titleRow = sheet.addRow(['ON-HAND INVENTORY VALUATION'])
		titleRow.font = { name: 'Arial', size: 15, bold: true }
		sheet.mergeCells('A1:F1')

		const subRow = sheet.addRow([
			`As of Date: ${new Date(report.asOfDate).toLocaleDateString()}`,
		])
		subRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
		sheet.mergeCells('A2:F2')
		sheet.addRow([])

		const header = sheet.addRow([
			'SKU',
			'Product Name',
			'Category',
			'Units on Hand',
			'Cost Price (IDR)',
			'Total Value (IDR)',
		])
		header.font = { bold: true }
		header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }

		for (const v of report.valuationItems) {
			const row = sheet.addRow([
				v.sku,
				v.name,
				v.categoryName,
				parseFloat(v.currentStock),
				parseFloat(v.costPrice),
				parseFloat(v.totalValue),
			])
			row.getCell(4).numFmt = '#,##0.00'
			row.getCell(5).numFmt = '#,##0.00'
			row.getCell(6).numFmt = '#,##0.00'
		}

		sheet.addRow([])
		const totalRow = sheet.addRow([
			'TOTAL VALUATION',
			'',
			'',
			parseFloat(report.summary.totalUnitsOnHand),
			'',
			parseFloat(report.summary.totalValuation),
		])
		totalRow.font = { bold: true }
		totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
		totalRow.getCell(4).numFmt = '#,##0.00'
		totalRow.getCell(6).numFmt = '#,##0.00'
	} else {
		// Shrinkage & Waste Log View
		const sheet = workbook.addWorksheet('Shrinkage & Waste Log')
		sheet.columns = [
			{ key: 'date', width: 14 },
			{ key: 'adj', width: 18 },
			{ key: 'type', width: 14 },
			{ key: 'sku', width: 14 },
			{ key: 'name', width: 30 },
			{ key: 'qty', width: 14 },
			{ key: 'cost', width: 16 },
			{ key: 'subtotal', width: 18 },
			{ key: 'reason', width: 34 },
		]

		const titleRow = sheet.addRow(['INVENTORY SHRINKAGE & WASTE AUDIT LOG'])
		titleRow.font = { name: 'Arial', size: 15, bold: true }
		sheet.mergeCells('A1:I1')

		const subRow = sheet.addRow([
			`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
		])
		subRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
		sheet.mergeCells('A2:I2')
		sheet.addRow([])

		const header = sheet.addRow([
			'Date',
			'Adj #',
			'Type',
			'SKU',
			'Product',
			'Qty Delta',
			'Unit Cost',
			'Value Impact (IDR)',
			'Reason',
		])
		header.font = { bold: true }
		header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }

		for (const d of report.discrepancies) {
			const row = sheet.addRow([
				new Date(d.date).toLocaleDateString(),
				d.adjustmentNumber,
				d.type,
				d.sku,
				d.productName,
				parseFloat(d.quantityAdjusted),
				parseFloat(d.unitCost),
				parseFloat(d.subtotalCost),
				d.reason,
			])
			row.getCell(6).numFmt = '#,##0.00'
			row.getCell(7).numFmt = '#,##0.00'
			row.getCell(8).numFmt = '#,##0.00'
		}
	}

	return workbook
}

export const exportInventoryValuationExcel = async (
	report: InventoryValuationReportData,
	view: 'valuation' | 'shrinkage' = 'valuation',
): Promise<Buffer> => {
	const workbook = buildInventoryValuationWorkbook(report, view)
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
