import PDFDocument from 'pdfkit'

import { ProfitAndLossLine, ProfitAndLossReportData } from '../../ReportService'

export const exportProfitAndLossPdf = (report: ProfitAndLossReportData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: 'A4' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		// Header
		doc.fontSize(18).text('PROFIT & LOSS STATEMENT', { align: 'center' })
		doc.fontSize(10)
			.fillColor('#64748b')
			.text(
				`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
				{ align: 'center' },
			)
		doc.moveDown(1.5)

		const writeSection = (title: string, items: ProfitAndLossLine[], total: string) => {
			doc.fontSize(12).fillColor('#0f172a').text(title, { underline: true })
			doc.moveDown(0.5)

			if (items.length === 0) {
				doc.fontSize(10).fillColor('#94a3b8').text('   (No transactions in this period)')
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

		writeSection('Operating Revenues', report.revenues.items, report.revenues.total)
		writeSection('Cost of Goods Sold', report.cogs.items, report.cogs.total)

		// Gross Profit
		doc.fontSize(12).fillColor('#0284c7').text('GROSS PROFIT', { continued: true })
		doc.text(`Rp ${parseFloat(report.grossProfit).toLocaleString('id-ID')}`, {
			align: 'right',
		})
		doc.moveDown(1.5)

		writeSection('Operating Expenses', report.expenses.items, report.expenses.total)

		// Net Profit / Loss Highlight
		const isPositive = parseFloat(report.netProfit) >= 0
		doc.rect(40, doc.y, 515, 30).fill(isPositive ? '#dcfce7' : '#fee2e2')
		doc.fontSize(13)
			.fillColor(isPositive ? '#15803d' : '#b91c1c')
			.text(isPositive ? 'NET PROFIT' : 'NET LOSS', 50, doc.y + 8, { continued: true })
		doc.text(`Rp ${parseFloat(report.netProfit).toLocaleString('id-ID')}`, { align: 'right' })

		doc.end()
	})
}
