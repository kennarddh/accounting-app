import ExcelJS from 'exceljs'

import { ZReportData } from '../../ReportService'

export const buildZReportWorkbook = (report: ZReportData): ExcelJS.Workbook => {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Z-Report')

	sheet.columns = [
		{ key: 'col1', width: 36 },
		{ key: 'col2', width: 22 },
		{ key: 'col3', width: 22 },
	]

	// 1. Title Block
	const titleRow = sheet.addRow(['DAILY REGISTER CLOSEOUT (Z-REPORT)'])
	titleRow.font = { name: 'Arial', size: 15, bold: true }
	sheet.mergeCells('A1:C1')

	const subRow = sheet.addRow([
		`Register Date: ${new Date(report.date).toLocaleDateString()} | Cashier: ${report.cashierName}`,
	])
	subRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
	sheet.mergeCells('A2:C2')

	sheet.addRow([])

	// 2. Summary KPI Block
	const addSectionHeader = (title: string) => {
		const row = sheet.addRow([title, '', ''])
		row.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } }
		row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
		return row
	}

	addSectionHeader('1. EXECUTIVE SALES SUMMARY')
	sheet.addRow(['Gross Sales Revenue', '', parseFloat(report.grossSales)]).getCell(3).numFmt =
		'#,##0.00'
	sheet
		.addRow(['Cost of Goods Sold (COGS)', '', parseFloat(report.totalCost)])
		.getCell(3).numFmt = '#,##0.00'
	sheet.addRow(['Gross Margin (Profit)', '', parseFloat(report.grossProfit)]).getCell(3).numFmt =
		'#,##0.00'
	sheet.addRow(['Gross Margin %', '', `${report.grossMarginPercent}%`])
	sheet.addRow(['Completed Orders Count', '', report.totalOrders])
	sheet.addRow(['Total Items Sold', '', parseFloat(report.totalItemsSold)])
	sheet.addRow(['Average Ticket Size', '', parseFloat(report.averageTicket)]).getCell(3).numFmt =
		'#,##0.00'

	sheet.addRow([])

	// 3. Payment Reconciliation (Drawer Cash vs Non-Cash)
	addSectionHeader('2. PAYMENT METHOD TILL RECONCILIATION')
	sheet.addRow(['Payment Method', 'Transactions', 'Amount (IDR)']).font = { bold: true }

	for (const p of report.payments) {
		const row = sheet.addRow([p.paymentMethod, p.orderCount, parseFloat(p.totalAmount)])
		row.getCell(3).numFmt = '#,##0.00'
		row.getCell(3).alignment = { horizontal: 'right' }
	}

	sheet.addRow([])

	// 4. Sales by Category
	addSectionHeader('3. CATEGORY PERFORMANCE')
	sheet.addRow(['Category', 'Quantity Sold', 'Revenue (IDR)']).font = { bold: true }
	for (const c of report.categories) {
		const row = sheet.addRow([
			c.categoryName,
			parseFloat(c.quantity),
			parseFloat(c.totalAmount),
		])
		row.getCell(3).numFmt = '#,##0.00'
		row.getCell(3).alignment = { horizontal: 'right' }
	}

	sheet.addRow([])

	// 5. Top Products
	addSectionHeader('4. TOP SELLING PRODUCTS')
	sheet.addRow(['SKU - Product Name', 'Quantity Sold', 'Revenue (IDR)']).font = { bold: true }
	for (const p of report.topProducts) {
		const row = sheet.addRow([
			`${p.sku} - ${p.name}`,
			parseFloat(p.quantity),
			parseFloat(p.totalAmount),
		])
		row.getCell(3).numFmt = '#,##0.00'
		row.getCell(3).alignment = { horizontal: 'right' }
	}

	return workbook
}

export const exportZReportExcel = async (report: ZReportData): Promise<Buffer> => {
	const workbook = buildZReportWorkbook(report)
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
