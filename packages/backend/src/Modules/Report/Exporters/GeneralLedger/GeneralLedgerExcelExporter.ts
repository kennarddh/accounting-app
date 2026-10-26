import ExcelJS from 'exceljs'

import { GeneralLedgerReportData } from '../../ReportService'

export const buildGeneralLedgerWorkbook = (report: GeneralLedgerReportData): ExcelJS.Workbook => {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('General Ledger')

	sheet.columns = [
		{ key: 'date', width: 14 },
		{ key: 'entryNumber', width: 22 },
		{ key: 'description', width: 40 },
		{ key: 'debit', width: 20 },
		{ key: 'credit', width: 20 },
		{ key: 'balance', width: 22 },
	]

	// 1. Title & Account Info Block
	const titleRow = sheet.addRow(['GENERAL LEDGER REPORT'])
	titleRow.font = { name: 'Arial', size: 16, bold: true }
	sheet.mergeCells('A1:F1')

	const accountRow = sheet.addRow([
		`Account: ${report.account.code} - ${report.account.name} (${report.account.type})`,
	])
	accountRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0284C7' } }
	sheet.mergeCells('A2:F2')

	const periodRow = sheet.addRow([
		`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
	])
	periodRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
	sheet.mergeCells('A3:F3')

	sheet.addRow([])

	// 2. Table Header
	const headerRow = sheet.addRow([
		'Date',
		'Entry #',
		'Description',
		'Debit (IDR)',
		'Credit (IDR)',
		'Running Balance',
	])
	headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } }
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFF1F5F9' },
	}
	headerRow.alignment = { vertical: 'middle' }
	headerRow.getCell(4).alignment = { horizontal: 'right' }
	headerRow.getCell(5).alignment = { horizontal: 'right' }
	headerRow.getCell(6).alignment = { horizontal: 'right' }
	headerRow.height = 24

	// 3. Opening Balance Row
	const openRow = sheet.addRow([
		'',
		'',
		'OPENING BALANCE',
		'',
		'',
		parseFloat(report.openingBalance),
	])
	openRow.font = { name: 'Arial', bold: true, italic: true, color: { argb: 'FF475569' } }
	openRow.getCell(6).numFmt = '#,##0.00'
	openRow.getCell(6).alignment = { horizontal: 'right' }

	// 4. Transaction Rows
	if (report.transactions.length === 0) {
		sheet.addRow([
			'',
			'',
			'(No transactions in this period)',
			0,
			0,
			parseFloat(report.openingBalance),
		])
	} else {
		for (const tx of report.transactions) {
			const row = sheet.addRow([
				new Date(tx.date).toLocaleDateString(),
				tx.entryNumber,
				tx.description,
				parseFloat(tx.debit) || 0,
				parseFloat(tx.credit) || 0,
				parseFloat(tx.runningBalance),
			])

			row.getCell(4).numFmt = '#,##0.00'
			row.getCell(4).alignment = { horizontal: 'right' }
			row.getCell(5).numFmt = '#,##0.00'
			row.getCell(5).alignment = { horizontal: 'right' }
			row.getCell(6).numFmt = '#,##0.00'
			row.getCell(6).alignment = { horizontal: 'right' }
		}
	}

	sheet.addRow([])

	// 5. Summary / Totals Row
	const totalRow = sheet.addRow([
		'TOTALS',
		'',
		'Period Activity & Ending Balance',
		parseFloat(report.totalDebit),
		parseFloat(report.totalCredit),
		parseFloat(report.endingBalance),
	])

	totalRow.font = { name: 'Arial', size: 11, bold: true }
	totalRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFF8FAFC' },
	}

	totalRow.getCell(4).numFmt = '#,##0.00'
	totalRow.getCell(4).alignment = { horizontal: 'right' }
	totalRow.getCell(5).numFmt = '#,##0.00'
	totalRow.getCell(5).alignment = { horizontal: 'right' }
	totalRow.getCell(6).numFmt = '#,##0.00'
	totalRow.getCell(6).alignment = { horizontal: 'right' }

	totalRow.getCell(4).border = { top: { style: 'thin' }, bottom: { style: 'thin' } }
	totalRow.getCell(5).border = { top: { style: 'thin' }, bottom: { style: 'thin' } }
	totalRow.getCell(6).border = { top: { style: 'thin' }, bottom: { style: 'double' } }

	return workbook
}

export const exportGeneralLedgerExcel = async (
	report: GeneralLedgerReportData,
): Promise<Buffer> => {
	const workbook = buildGeneralLedgerWorkbook(report)
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
