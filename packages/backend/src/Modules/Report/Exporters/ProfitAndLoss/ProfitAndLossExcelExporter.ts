import ExcelJS from 'exceljs'

import { ProfitAndLossReportData } from '../../ReportService'

export const buildProfitAndLossWorkbook = (report: ProfitAndLossReportData): ExcelJS.Workbook => {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Profit & Loss')

	// 1. Column setup (widths without auto-header)
	sheet.columns = [
		{ key: 'name', width: 42 },
		{ key: 'code', width: 16 },
		{ key: 'amount', width: 24 },
	]

	// 2. Title Block (Rows 1 & 2)
	const titleRow = sheet.addRow(['PROFIT & LOSS STATEMENT'])
	titleRow.font = { name: 'Arial', size: 16, bold: true }
	sheet.mergeCells('A1:C1')

	const periodRow = sheet.addRow([
		`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
	])
	periodRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
	sheet.mergeCells('A2:C2')

	// 3. Spacing
	sheet.addRow([])

	// 4. Table Column Header (Row 4)
	const headerRow = sheet.addRow(['Account / Section', 'Account Code', 'Amount (IDR)'])
	headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } }
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFF1F5F9' },
	}
	headerRow.alignment = { vertical: 'middle' }
	headerRow.getCell(3).alignment = { horizontal: 'right' }
	headerRow.height = 24

	sheet.addRow([])

	// Helpers
	const addSectionHeader = (title: string) => {
		const row = sheet.addRow([title, '', ''])
		row.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } }
		row.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFF8FAFC' },
		}
		return row
	}

	const addTotalRow = (label: string, total: string) => {
		const row = sheet.addRow([label, '', parseFloat(total)])
		row.font = { name: 'Arial', bold: true }
		row.getCell(3).numFmt = '#,##0.00'
		row.getCell(3).alignment = { horizontal: 'right' }
		row.getCell(3).border = {
			top: { style: 'thin', color: { argb: 'FF94A3B8' } },
			bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
		}
		return row
	}

	// Section 1: Operating Revenues
	addSectionHeader('1. OPERATING REVENUES')
	if (report.revenues.items.length === 0) {
		sheet.addRow(['   (No revenues recorded)', '', 0])
	} else {
		for (const rev of report.revenues.items) {
			const row = sheet.addRow([`   ${rev.name}`, rev.code, parseFloat(rev.amount)])
			row.getCell(3).numFmt = '#,##0.00'
			row.getCell(3).alignment = { horizontal: 'right' }
		}
	}
	addTotalRow('Total Revenues', report.revenues.total)
	sheet.addRow([])

	// Section 2: COGS
	addSectionHeader('2. COST OF GOODS SOLD (COGS)')
	if (report.cogs.items.length === 0) {
		sheet.addRow(['   (No COGS recorded)', '', 0])
	} else {
		for (const c of report.cogs.items) {
			const row = sheet.addRow([`   ${c.name}`, c.code, parseFloat(c.amount)])
			row.getCell(3).numFmt = '#,##0.00'
			row.getCell(3).alignment = { horizontal: 'right' }
		}
	}
	addTotalRow('Total Cost of Goods Sold', report.cogs.total)
	sheet.addRow([])

	// Highlight: Gross Profit
	const grossRow = sheet.addRow(['GROSS PROFIT', '', parseFloat(report.grossProfit)])
	grossRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0369A1' } }
	grossRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFE2E8F0' },
	}
	grossRow.getCell(3).numFmt = '#,##0.00'
	grossRow.getCell(3).alignment = { horizontal: 'right' }
	sheet.addRow([])

	// Section 3: Operating Expenses
	addSectionHeader('3. OPERATING EXPENSES')
	if (report.expenses.items.length === 0) {
		sheet.addRow(['   (No operating expenses recorded)', '', 0])
	} else {
		for (const exp of report.expenses.items) {
			const row = sheet.addRow([`   ${exp.name}`, exp.code, parseFloat(exp.amount)])
			row.getCell(3).numFmt = '#,##0.00'
			row.getCell(3).alignment = { horizontal: 'right' }
		}
	}
	addTotalRow('Total Operating Expenses', report.expenses.total)
	sheet.addRow([])

	// Highlight: Net Profit / Loss
	const isNetPositive = parseFloat(report.netProfit) >= 0
	const netRow = sheet.addRow([
		isNetPositive ? 'NET PROFIT' : 'NET LOSS',
		'',
		parseFloat(report.netProfit),
	])
	netRow.font = {
		name: 'Arial',
		size: 13,
		bold: true,
		color: { argb: isNetPositive ? 'FF15803D' : 'FFB91C1C' },
	}
	netRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: isNetPositive ? 'FFDCFCE7' : 'FFFEE2E2' },
	}
	netRow.height = 26
	netRow.alignment = { vertical: 'middle' }

	const netAmountCell = netRow.getCell(3)
	netAmountCell.numFmt = '#,##0.00'
	netAmountCell.alignment = { horizontal: 'right', vertical: 'middle' }
	netAmountCell.border = {
		top: { style: 'thin' },
		bottom: { style: 'double' },
	}

	return workbook
}

export const exportProfitAndLossExcel = async (
	report: ProfitAndLossReportData,
): Promise<Buffer> => {
	const workbook = buildProfitAndLossWorkbook(report)
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
