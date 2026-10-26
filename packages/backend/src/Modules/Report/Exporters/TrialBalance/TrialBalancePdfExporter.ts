import PDFDocument from 'pdfkit'

import { TrialBalanceReportData } from '../../ReportService'

export const exportTrialBalancePdf = (report: TrialBalanceReportData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: 'A4' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		// Header
		doc.fontSize(18).text('TRIAL BALANCE', { align: 'center' })
		doc.fontSize(10)
			.fillColor('#64748b')
			.text(
				`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
				{ align: 'center' },
			)
		doc.moveDown(1.5)

		// Table Columns
		const startX = 40
		const colWidths = { code: 60, name: 195, type: 80, debit: 90, credit: 90 }

		// Column Headers
		doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold')
		doc.text('Code', startX, doc.y, { width: colWidths.code })
		doc.text('Account Name', startX + colWidths.code, doc.y, { width: colWidths.name })
		doc.text('Type', startX + colWidths.code + colWidths.name, doc.y, { width: colWidths.type })
		doc.text('Debit (IDR)', startX + colWidths.code + colWidths.name + colWidths.type, doc.y, {
			width: colWidths.debit,
			align: 'right',
		})
		doc.text(
			'Credit (IDR)',
			startX + colWidths.code + colWidths.name + colWidths.type + colWidths.debit,
			doc.y,
			{
				width: colWidths.credit,
				align: 'right',
			},
		)
		doc.moveDown(0.5)

		doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(startX, doc.y).lineTo(555, doc.y).stroke()
		doc.moveDown(0.5)

		// Line items
		doc.font('Helvetica').fontSize(9).fillColor('#334155')

		if (report.items.length === 0) {
			doc.text('(No transactions found in this period)', startX, doc.y)
			doc.moveDown(1)
		} else {
			for (const item of report.items) {
				// Calculate dynamic row height based on account name length
				const nameHeight = doc.heightOfString(item.name || '', { width: colWidths.name })
				const rowHeight = Math.max(14, nameHeight)

				if (doc.y + rowHeight > doc.page.height - 50) {
					doc.addPage()
					doc.font('Helvetica').fontSize(9).fillColor('#334155')
				}

				const currentY = doc.y

				doc.text(item.code, startX, currentY, { width: colWidths.code })
				doc.text(item.name, startX + colWidths.code, currentY, { width: colWidths.name })
				doc.text(item.type, startX + colWidths.code + colWidths.name, currentY, {
					width: colWidths.type,
				})
				doc.text(
					parseFloat(item.debit) > 0
						? parseFloat(item.debit).toLocaleString('id-ID')
						: '-',
					startX + colWidths.code + colWidths.name + colWidths.type,
					currentY,
					{ width: colWidths.debit, align: 'right' },
				)
				doc.text(
					parseFloat(item.credit) > 0
						? parseFloat(item.credit).toLocaleString('id-ID')
						: '-',
					startX + colWidths.code + colWidths.name + colWidths.type + colWidths.debit,
					currentY,
					{ width: colWidths.credit, align: 'right' },
				)

				// Advance by actual row height
				doc.y = currentY + rowHeight + 3
			}
		}

		doc.strokeColor('#0f172a').lineWidth(1).moveTo(startX, doc.y).lineTo(555, doc.y).stroke()
		doc.moveDown(0.5)

		// Totals Row
		const totalY = doc.y
		doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a')
		doc.text('TOTALS', startX, totalY, {
			width: colWidths.code + colWidths.name + colWidths.type,
		})
		doc.text(
			parseFloat(report.totalDebit).toLocaleString('id-ID'),
			startX + colWidths.code + colWidths.name + colWidths.type,
			totalY,
			{ width: colWidths.debit, align: 'right' },
		)
		doc.text(
			parseFloat(report.totalCredit).toLocaleString('id-ID'),
			startX + colWidths.code + colWidths.name + colWidths.type + colWidths.debit,
			totalY,
			{ width: colWidths.credit, align: 'right' },
		)
		doc.moveDown(1.5)

		// Balanced Banner
		doc.rect(startX, doc.y, 515, 24).fill(report.isBalanced ? '#dcfce7' : '#fee2e2')
		doc.fontSize(10)
			.fillColor(report.isBalanced ? '#15803d' : '#b91c1c')
			.text(
				report.isBalanced
					? 'STATUS: LEDGER IS FULLY BALANCED (DEBITS = CREDITS)'
					: `STATUS: OUT OF BALANCE (DIFFERENCE: Rp ${parseFloat(report.difference).toLocaleString('id-ID')})`,
				startX + 10,
				doc.y + 7,
			)

		doc.end()
	})
}
