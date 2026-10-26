import ExcelJS from 'exceljs'

import { BalanceSheetReportData } from '../../ReportService'

export const buildBalanceSheetWorkbook = (report: BalanceSheetReportData): ExcelJS.Workbook => {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Balance Sheet')

	sheet.columns = [
		{ key: 'name', width: 44 },
		{ key: 'code', width: 16 },
		{ key: 'amount', width: 24 },
	]

	// 1. Title Block
	const titleRow = sheet.addRow(['BALANCE SHEET'])
	titleRow.font = { name: 'Arial', size: 16, bold: true }
	sheet.mergeCells('A1:C1')

	const dateRow = sheet.addRow([`As of: ${new Date(report.asOfDate).toLocaleDateString()}`])
	dateRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
	sheet.mergeCells('A2:C2')

	sheet.addRow([])

	// 2. Table Column Header
	const headerRow = sheet.addRow(['Account / Category', 'Account Code', 'Amount (IDR)'])
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

	const addTotalRow = (label: string, total: string, isDoubleBottom = false) => {
		const row = sheet.addRow([label, '', parseFloat(total)])
		row.font = { name: 'Arial', bold: true }
		row.getCell(3).numFmt = '#,##0.00'
		row.getCell(3).alignment = { horizontal: 'right' }
		row.getCell(3).border = {
			top: { style: 'thin', color: { argb: 'FF94A3B8' } },
			bottom: { style: isDoubleBottom ? 'double' : 'thin', color: { argb: 'FF94A3B8' } },
		}
		return row
	}

	// SECTION 1: ASSETS
	addSectionHeader('1. ASSETS')
	if (report.assets.items.length === 0) {
		sheet.addRow(['   (No assets recorded)', '', 0])
	} else {
		for (const a of report.assets.items) {
			const row = sheet.addRow([`   ${a.name}`, a.code, parseFloat(a.amount)])
			row.getCell(3).numFmt = '#,##0.00'
			row.getCell(3).alignment = { horizontal: 'right' }
		}
	}
	addTotalRow('TOTAL ASSETS', report.assets.total, true)
	sheet.addRow([])

	// SECTION 2: LIABILITIES
	addSectionHeader('2. LIABILITIES')
	if (report.liabilities.items.length === 0) {
		sheet.addRow(['   (No liabilities recorded)', '', 0])
	} else {
		for (const l of report.liabilities.items) {
			const row = sheet.addRow([`   ${l.name}`, l.code, parseFloat(l.amount)])
			row.getCell(3).numFmt = '#,##0.00'
			row.getCell(3).alignment = { horizontal: 'right' }
		}
	}
	addTotalRow('Total Liabilities', report.liabilities.total)
	sheet.addRow([])

	// SECTION 3: EQUITY
	addSectionHeader('3. EQUITY')
	for (const e of report.equity.items) {
		const row = sheet.addRow([`   ${e.name}`, e.code, parseFloat(e.amount)])
		row.getCell(3).numFmt = '#,##0.00'
		row.getCell(3).alignment = { horizontal: 'right' }
	}
	// Retained Earnings Line
	const retRow = sheet.addRow([
		'   Retained Earnings (Net Profit to Date)',
		'',
		parseFloat(report.equity.retainedEarnings),
	])
	retRow.getCell(3).numFmt = '#,##0.00'
	retRow.getCell(3).alignment = { horizontal: 'right' }

	addTotalRow('Total Equity', report.equity.total)
	sheet.addRow([])

	// GRAND TOTAL: LIABILITIES + EQUITY
	const grandRow = sheet.addRow([
		'TOTAL LIABILITIES & EQUITY',
		report.isBalanced ? 'BALANCED' : 'OUT OF BALANCE',
		parseFloat(report.totalLiabilitiesAndEquity),
	])
	grandRow.font = { name: 'Arial', size: 12, bold: true }
	grandRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: report.isBalanced ? 'FFDCFCE7' : 'FFFEE2E2' },
	}
	grandRow.getCell(3).numFmt = '#,##0.00'
	grandRow.getCell(3).alignment = { horizontal: 'right' }
	grandRow.getCell(3).border = {
		top: { style: 'thin' },
		bottom: { style: 'double' },
	}

	return workbook
}

export const exportBalanceSheetExcel = async (report: BalanceSheetReportData): Promise<Buffer> => {
	const workbook = buildBalanceSheetWorkbook(report)
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
