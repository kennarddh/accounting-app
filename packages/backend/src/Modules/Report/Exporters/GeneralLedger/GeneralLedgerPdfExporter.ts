import PDFDocument from 'pdfkit'

import { GeneralLedgerReportData } from '../../ReportService'

export const exportGeneralLedgerPdf = (report: GeneralLedgerReportData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: 'A4' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		// Header
		doc.fontSize(16).text('GENERAL LEDGER REPORT', { align: 'center' })
		doc.fontSize(11)
			.fillColor('#0284c7')
			.text(`${report.account.code} - ${report.account.name} (${report.account.type})`, {
				align: 'center',
			})
		doc.fontSize(9)
			.fillColor('#64748b')
			.text(
				`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
				{ align: 'center' },
			)
		doc.moveDown(1.5)

		// Columns layout
		const startX = 40
		const colWidths = {
			date: 65,
			entryNumber: 95,
			description: 145,
			debit: 70,
			credit: 70,
			balance: 70,
		}

		// Table Header
		doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold')
		doc.text('Date', startX, doc.y, { width: colWidths.date })
		doc.text('Entry #', startX + colWidths.date, doc.y, { width: colWidths.entryNumber })
		doc.text('Description', startX + colWidths.date + colWidths.entryNumber, doc.y, {
			width: colWidths.description,
		})
		doc.text(
			'Debit (IDR)',
			startX + colWidths.date + colWidths.entryNumber + colWidths.description,
			doc.y,
			{
				width: colWidths.debit,
				align: 'right',
			},
		)
		doc.text(
			'Credit (IDR)',
			startX +
				colWidths.date +
				colWidths.entryNumber +
				colWidths.description +
				colWidths.debit,
			doc.y,
			{ width: colWidths.credit, align: 'right' },
		)
		doc.text(
			'Balance',
			startX +
				colWidths.date +
				colWidths.entryNumber +
				colWidths.description +
				colWidths.debit +
				colWidths.credit,
			doc.y,
			{ width: colWidths.balance, align: 'right' },
		)
		doc.moveDown(0.5)

		doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(startX, doc.y).lineTo(555, doc.y).stroke()
		doc.moveDown(0.4)

		// Opening Balance Line
		doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569')
		doc.text('OPENING BALANCE', startX + colWidths.date + colWidths.entryNumber, doc.y, {
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
			doc.y,
			{ width: colWidths.balance, align: 'right' },
		)
		doc.moveDown(0.5)

		// Transaction Lines
		doc.font('Helvetica').fontSize(8).fillColor('#334155')

		if (report.transactions.length === 0) {
			doc.text(
				'(No transactions in this period)',
				startX + colWidths.date + colWidths.entryNumber,
				doc.y,
			)
			doc.moveDown(1)
		} else {
			for (const tx of report.transactions) {
				const currentY = doc.y

				doc.text(new Date(tx.date).toLocaleDateString(), startX, currentY, {
					width: colWidths.date,
				})
				doc.text(tx.entryNumber, startX + colWidths.date, currentY, {
					width: colWidths.entryNumber,
				})
				doc.text(
					tx.description,
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
				doc.moveDown(0.4)
			}
		}

		doc.strokeColor('#0f172a').lineWidth(1).moveTo(startX, doc.y).lineTo(555, doc.y).stroke()
		doc.moveDown(0.5)

		// Ending Totals Row
		const totalY = doc.y
		doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a')
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
