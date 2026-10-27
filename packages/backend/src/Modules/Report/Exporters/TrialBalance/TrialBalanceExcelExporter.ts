import ExcelJS from 'exceljs'

import { TrialBalanceReportData } from '../../ReportService'

export const buildTrialBalanceWorkbook = (report: TrialBalanceReportData): ExcelJS.Workbook => {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Trial Balance')

	sheet.columns = [
		{ key: 'code', width: 14 },
		{ key: 'name', width: 38 },
		{ key: 'type', width: 16 },
		{ key: 'debit', width: 22 },
		{ key: 'credit', width: 22 },
	]

	// 1. Title Block
	const titleRow = sheet.addRow(['TRIAL BALANCE'])
	titleRow.font = { name: 'Arial', size: 16, bold: true }
	sheet.mergeCells('A1:E1')

	const periodRow = sheet.addRow([
		`Period: until ${new Date(report.toDate).toLocaleDateString()}`,
	])
	periodRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
	sheet.mergeCells('A2:E2')

	sheet.addRow([])

	// 2. Table Column Headers
	const headerRow = sheet.addRow(['Code', 'Account Name', 'Type', 'Debit (IDR)', 'Credit (IDR)'])
	headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } }
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFF1F5F9' },
	}
	headerRow.alignment = { vertical: 'middle' }
	headerRow.getCell(4).alignment = { horizontal: 'right' }
	headerRow.getCell(5).alignment = { horizontal: 'right' }
	headerRow.height = 24

	// 3. Data Rows
	if (report.items.length === 0) {
		sheet.addRow(['', '(No transactions found for this period)', '', 0, 0])
	} else {
		for (const item of report.items) {
			const row = sheet.addRow([
				item.code,
				item.name,
				item.type,
				parseFloat(item.debit) || 0,
				parseFloat(item.credit) || 0,
			])

			row.getCell(4).numFmt = '#,##0.00'
			row.getCell(4).alignment = { horizontal: 'right' }
			row.getCell(5).numFmt = '#,##0.00'
			row.getCell(5).alignment = { horizontal: 'right' }
		}
	}

	sheet.addRow([])

	// 4. Totals Row
	const totalRow = sheet.addRow([
		'TOTALS',
		'',
		report.isBalanced ? 'BALANCED' : 'OUT OF BALANCE',
		parseFloat(report.totalDebit),
		parseFloat(report.totalCredit),
	])

	totalRow.font = { name: 'Arial', size: 11, bold: true }
	totalRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: report.isBalanced ? 'FFDCFCE7' : 'FFFEE2E2' },
	}

	totalRow.getCell(4).numFmt = '#,##0.00'
	totalRow.getCell(4).alignment = { horizontal: 'right' }
	totalRow.getCell(5).numFmt = '#,##0.00'
	totalRow.getCell(5).alignment = { horizontal: 'right' }

	totalRow.getCell(4).border = { top: { style: 'thin' }, bottom: { style: 'double' } }
	totalRow.getCell(5).border = { top: { style: 'thin' }, bottom: { style: 'double' } }

	return workbook
}

export const exportTrialBalanceExcel = async (report: TrialBalanceReportData): Promise<Buffer> => {
	const workbook = buildTrialBalanceWorkbook(report)
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
