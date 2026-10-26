import ExcelJS from 'exceljs'

import { SalesByProductReportData } from '../../ReportService'

export const buildSalesByProductWorkbook = (report: SalesByProductReportData): ExcelJS.Workbook => {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Sales by Product')

	sheet.columns = [
		{ key: 'col1', width: 14 },
		{ key: 'col2', width: 34 },
		{ key: 'col3', width: 22 },
		{ key: 'col4', width: 14 },
		{ key: 'col5', width: 18 },
		{ key: 'col6', width: 18 },
		{ key: 'col7', width: 18 },
		{ key: 'col8', width: 14 },
	]

	// 1. Title Block
	const titleRow = sheet.addRow(['SALES BY PRODUCT & CATEGORY REPORT'])
	titleRow.font = { name: 'Arial', size: 15, bold: true }
	sheet.mergeCells('A1:H1')

	const subRow = sheet.addRow([
		`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()} | Filter: ${report.categoryFilterName}`,
	])
	subRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
	sheet.mergeCells('A2:H2')

	sheet.addRow([])

	// 2. Category Performance Summary Table
	const catHeader = sheet.addRow(['CATEGORY PERFORMANCE SUMMARY', '', '', '', '', '', '', ''])
	catHeader.font = { name: 'Arial', size: 11, bold: true }
	catHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }

	const catCols = sheet.addRow([
		'Category',
		'Products Sold',
		'Units Sold',
		'Revenue (IDR)',
		'COGS (IDR)',
		'Gross Profit',
		'Margin %',
		'',
	])
	catCols.font = { bold: true }

	for (const c of report.categories) {
		const row = sheet.addRow([
			c.categoryName,
			c.productCount,
			parseFloat(c.quantitySold),
			parseFloat(c.totalRevenue),
			parseFloat(c.totalCost),
			parseFloat(c.grossProfit),
			`${c.marginPercent}%`,
			'',
		])
		row.getCell(3).numFmt = '#,##0.00'
		row.getCell(4).numFmt = '#,##0.00'
		row.getCell(5).numFmt = '#,##0.00'
		row.getCell(6).numFmt = '#,##0.00'
	}

	sheet.addRow([])

	// 3. Detailed Product Performance Table
	const prodHeader = sheet.addRow(['PRODUCT PERFORMANCE BREAKDOWN', '', '', '', '', '', '', ''])
	prodHeader.font = { name: 'Arial', size: 11, bold: true }
	prodHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }

	const prodCols = sheet.addRow([
		'SKU',
		'Product Name',
		'Category',
		'Units Sold',
		'Revenue (IDR)',
		'COGS (IDR)',
		'Gross Profit',
		'Margin %',
	])
	prodCols.font = { bold: true }

	for (const p of report.products) {
		const row = sheet.addRow([
			p.sku,
			p.name,
			p.categoryName,
			parseFloat(p.quantitySold),
			parseFloat(p.totalRevenue),
			parseFloat(p.totalCost),
			parseFloat(p.grossProfit),
			`${p.marginPercent}%`,
		])
		row.getCell(4).numFmt = '#,##0.00'
		row.getCell(5).numFmt = '#,##0.00'
		row.getCell(6).numFmt = '#,##0.00'
		row.getCell(7).numFmt = '#,##0.00'
	}

	sheet.addRow([])

	// 4. Grand Totals
	const totalRow = sheet.addRow([
		'TOTALS',
		'',
		'',
		parseFloat(report.summary.totalQuantity),
		parseFloat(report.summary.totalRevenue),
		parseFloat(report.summary.totalCost),
		parseFloat(report.summary.totalProfit),
		`${report.summary.overallMarginPercent}%`,
	])
	totalRow.font = { bold: true, size: 11 }
	totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
	totalRow.getCell(4).numFmt = '#,##0.00'
	totalRow.getCell(5).numFmt = '#,##0.00'
	totalRow.getCell(6).numFmt = '#,##0.00'
	totalRow.getCell(7).numFmt = '#,##0.00'

	return workbook
}

export const exportSalesByProductExcel = async (
	report: SalesByProductReportData,
): Promise<Buffer> => {
	const workbook = buildSalesByProductWorkbook(report)
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
