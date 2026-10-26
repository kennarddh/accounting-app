import PDFDocument from 'pdfkit'

import { BalanceSheetLine, BalanceSheetReportData } from '../../ReportService'

export const exportBalanceSheetPdf = (report: BalanceSheetReportData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: 'A4' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		// Header
		doc.fontSize(18).text('BALANCE SHEET', { align: 'center' })
		doc.fontSize(10)
			.fillColor('#64748b')
			.text(`As of Date: ${new Date(report.asOfDate).toLocaleDateString()}`, {
				align: 'center',
			})
		doc.moveDown(1.5)

		const writeSection = (title: string, items: BalanceSheetLine[], total: string) => {
			doc.fontSize(12).fillColor('#0f172a').text(title, { underline: true })
			doc.moveDown(0.5)

			if (items.length === 0) {
				doc.fontSize(10).fillColor('#94a3b8').text('   (No accounts in this section)')
			} else {
				for (const item of items) {
					doc.fontSize(10)
						.fillColor('#334155')
						.text(`   ${item.code} - ${item.name}`, { continued: true })
					doc.text(`Rp ${parseFloat(item.amount).toLocaleString('id-ID')}`, {
						align: 'right',
					})
				}
			}

			doc.moveDown(0.3)
			doc.fontSize(10).fillColor('#000').text(`   Total ${title}`, { continued: true })
			doc.text(`Rp ${parseFloat(total).toLocaleString('id-ID')}`, { align: 'right' })
			doc.moveDown(1)
		}

		writeSection('Assets', report.assets.items, report.assets.total)
		writeSection('Liabilities', report.liabilities.items, report.liabilities.total)

		// Equity section with Retained Earnings
		doc.fontSize(12).fillColor('#0f172a').text('Equity', { underline: true })
		doc.moveDown(0.5)
		for (const item of report.equity.items) {
			doc.fontSize(10)
				.fillColor('#334155')
				.text(`   ${item.code} - ${item.name}`, { continued: true })
			doc.text(`Rp ${parseFloat(item.amount).toLocaleString('id-ID')}`, { align: 'right' })
		}
		doc.fontSize(10)
			.fillColor('#334155')
			.text('   Retained Earnings (Net Income to Date)', { continued: true })
		doc.text(`Rp ${parseFloat(report.equity.retainedEarnings).toLocaleString('id-ID')}`, {
			align: 'right',
		})
		doc.moveDown(0.3)
		doc.fontSize(10).fillColor('#000').text('   Total Equity', { continued: true })
		doc.text(`Rp ${parseFloat(report.equity.total).toLocaleString('id-ID')}`, {
			align: 'right',
		})
		doc.moveDown(1.5)

		// Balance Verification Banner
		const startX = 40
		doc.rect(startX, doc.y, 515, 26).fill(report.isBalanced ? '#dcfce7' : '#fee2e2')
		doc.fontSize(10)
			.fillColor(report.isBalanced ? '#15803d' : '#b91c1c')
			.text(
				report.isBalanced
					? `BALANCED: Assets (Rp ${parseFloat(report.assets.total).toLocaleString('id-ID')}) = Liab + Equity (Rp ${parseFloat(report.totalLiabilitiesAndEquity).toLocaleString('id-ID')})`
					: `OUT OF BALANCE: Difference of Rp ${parseFloat(report.difference).toLocaleString('id-ID')}`,
				startX + 10,
				doc.y + 8,
			)

		doc.end()
	})
}
