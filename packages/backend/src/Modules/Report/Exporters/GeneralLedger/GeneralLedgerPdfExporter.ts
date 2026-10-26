import PDFDocument from 'pdfkit'

import { GeneralLedgerReportData } from '../../ReportService'

export const exportGeneralLedgerPdf = (report: GeneralLedgerReportData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		// General Ledger with 6 columns is best formatted in Landscape
		const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		// Page dimensions (A4 Landscape: ~842 x 595, usable width = 762)
		const startX = 40
		const usableWidth = 762
		const colWidths = {
			date: 75,
			entryNumber: 130,
			description: 257,
			debit: 100,
			credit: 100,
			balance: 100,
		}

		// Helper to render table headers
		const renderTableHeader = () => {
			doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold')
			const headerY = doc.y

			doc.text('Date', startX, headerY, { width: colWidths.date })
			doc.text('Entry #', startX + colWidths.date, headerY, { width: colWidths.entryNumber })
			doc.text('Description', startX + colWidths.date + colWidths.entryNumber, headerY, {
				width: colWidths.description,
			})
			doc.text(
				'Debit (IDR)',
				startX + colWidths.date + colWidths.entryNumber + colWidths.description,
				headerY,
				{ width: colWidths.debit, align: 'right' },
			)
			doc.text(
				'Credit (IDR)',
				startX +
					colWidths.date +
					colWidths.entryNumber +
					colWidths.description +
					colWidths.debit,
				headerY,
				{ width: colWidths.credit, align: 'right' },
			)
			doc.text(
				'Balance (IDR)',
				startX +
					colWidths.date +
					colWidths.entryNumber +
					colWidths.description +
					colWidths.debit +
					colWidths.credit,
				headerY,
				{ width: colWidths.balance, align: 'right' },
			)

			doc.y = headerY + 14
			doc.strokeColor('#cbd5e1')
				.lineWidth(1)
				.moveTo(startX, doc.y)
				.lineTo(startX + usableWidth, doc.y)
				.stroke()
			doc.y += 6
		}

		// Document Header
		doc.fontSize(16)
			.font('Helvetica-Bold')
			.fillColor('#0f172a')
			.text('GENERAL LEDGER REPORT', { align: 'center' })
		doc.fontSize(11)
			.fillColor('#0284c7')
			.text(`${report.account.code} - ${report.account.name} (${report.account.type})`, {
				align: 'center',
			})
		doc.fontSize(9)
			.fillColor('#64748b')
			.font('Helvetica')
			.text(
				`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
				{ align: 'center' },
			)
		doc.moveDown(1.5)

		renderTableHeader()

		// Opening Balance Row
		doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569')
		const openY = doc.y
		doc.text('OPENING BALANCE', startX + colWidths.date + colWidths.entryNumber, openY, {
			width: colWidths.description,
		})
		doc.text(
			parseFloat(report.openingBalance).toLocaleString('id-ID'),
			startX +
				colWidths.date +
				colWidths.entryNumber +
				colWidths.description +
				colWidths.debit +
				colWidths.credit,
			openY,
			{ width: colWidths.balance, align: 'right' },
		)
		doc.y = openY + 16

		// Transaction Rows with dynamic row height
		doc.font('Helvetica').fontSize(8.5).fillColor('#334155')

		if (report.transactions.length === 0) {
			doc.text(
				'(No transactions in this period)',
				startX + colWidths.date + colWidths.entryNumber,
				doc.y,
			)
			doc.y += 18
		} else {
			for (const tx of report.transactions) {
				// 1. Calculate dynamic height based on text wrapping of the description
				const descHeight = doc.heightOfString(tx.description || '', {
					width: colWidths.description,
				})
				const rowHeight = Math.max(14, descHeight)

				// 2. Page break check: if row doesn't fit on page, add page and re-draw header
				if (doc.y + rowHeight > doc.page.height - 50) {
					doc.addPage()
					renderTableHeader()
					doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
				}

				const currentY = doc.y

				doc.text(new Date(tx.date).toLocaleDateString(), startX, currentY, {
					width: colWidths.date,
				})
				doc.text(tx.entryNumber, startX + colWidths.date, currentY, {
					width: colWidths.entryNumber,
				})
				doc.text(
					tx.description || '',
					startX + colWidths.date + colWidths.entryNumber,
					currentY,
					{
						width: colWidths.description,
					},
				)
				doc.text(
					parseFloat(tx.debit) > 0 ? parseFloat(tx.debit).toLocaleString('id-ID') : '-',
					startX + colWidths.date + colWidths.entryNumber + colWidths.description,
					currentY,
					{ width: colWidths.debit, align: 'right' },
				)
				doc.text(
					parseFloat(tx.credit) > 0 ? parseFloat(tx.credit).toLocaleString('id-ID') : '-',
					startX +
						colWidths.date +
						colWidths.entryNumber +
						colWidths.description +
						colWidths.debit,
					currentY,
					{ width: colWidths.credit, align: 'right' },
				)
				doc.text(
					parseFloat(tx.runningBalance).toLocaleString('id-ID'),
					startX +
						colWidths.date +
						colWidths.entryNumber +
						colWidths.description +
						colWidths.debit +
						colWidths.credit,
					currentY,
					{ width: colWidths.balance, align: 'right' },
				)

				// 3. Move Y strictly below the longest cell + 4pt padding
				doc.y = currentY + rowHeight + 4
			}
		}

		// Divider
		doc.strokeColor('#0f172a')
			.lineWidth(1)
			.moveTo(startX, doc.y)
			.lineTo(startX + usableWidth, doc.y)
			.stroke()
		doc.y += 6

		// Totals Row
		const totalY = doc.y
		doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a')
		doc.text('TOTALS', startX, totalY, { width: colWidths.date + colWidths.entryNumber })
		doc.text(
			parseFloat(report.totalDebit).toLocaleString('id-ID'),
			startX + colWidths.date + colWidths.entryNumber + colWidths.description,
			totalY,
			{ width: colWidths.debit, align: 'right' },
		)
		doc.text(
			parseFloat(report.totalCredit).toLocaleString('id-ID'),
			startX +
				colWidths.date +
				colWidths.entryNumber +
				colWidths.description +
				colWidths.debit,
			totalY,
			{ width: colWidths.credit, align: 'right' },
		)
		doc.text(
			parseFloat(report.endingBalance).toLocaleString('id-ID'),
			startX +
				colWidths.date +
				colWidths.entryNumber +
				colWidths.description +
				colWidths.debit +
				colWidths.credit,
			totalY,
			{ width: colWidths.balance, align: 'right' },
		)

		doc.end()
	})
}
