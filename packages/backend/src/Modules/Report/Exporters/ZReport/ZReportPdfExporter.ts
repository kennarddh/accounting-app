import PDFDocument from 'pdfkit'

import { ZReportData } from '../../ReportService'

export const exportZReportPdf = (report: ZReportData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: 'A4' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		const startX = 40
		const usableWidth = 515

		// 1. Header
		doc.fontSize(16)
			.font('Helvetica-Bold')
			.fillColor('#0f172a')
			.text('DAILY REGISTER CLOSEOUT (Z-REPORT)', { align: 'center' })
		doc.fontSize(10)
			.font('Helvetica')
			.fillColor('#64748b')
			.text(
				`Register Date: ${new Date(report.date).toLocaleDateString()} | Cashier: ${report.cashierName}`,
				{
					align: 'center',
				},
			)
		doc.moveDown(1.5)

		// 2. Key Sales Metrics Box
		doc.rect(startX, doc.y, usableWidth, 45).fill('#f8fafc').strokeColor('#cbd5e1').stroke()
		const boxY = doc.y + 8

		doc.fontSize(8.5).font('Helvetica').fillColor('#64748b')
		doc.text('GROSS SALES', startX + 15, boxY)
		doc.text('COMPLETED ORDERS', startX + 150, boxY)
		doc.text('ITEMS SOLD', startX + 295, boxY)
		doc.text('CASH IN TILL', startX + 410, boxY)

		doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a')
		doc.text(
			`Rp ${parseFloat(report.grossSales).toLocaleString('id-ID')}`,
			startX + 15,
			boxY + 14,
		)
		doc.text(`${report.totalOrders}`, startX + 150, boxY + 14)
		doc.text(`${parseFloat(report.totalItemsSold)}`, startX + 295, boxY + 14)
		doc.text(
			`Rp ${parseFloat(report.cashCollected).toLocaleString('id-ID')}`,
			startX + 410,
			boxY + 14,
		)

		doc.y = boxY + 45
		doc.moveDown(1)

		// 3. Payment Method Till Reconciliation Table
		doc.fontSize(11)
			.font('Helvetica-Bold')
			.fillColor('#0f172a')
			.text('Payment Method Till Reconciliation', startX)
		doc.moveDown(0.5)

		doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569')
		const pHeadY = doc.y
		doc.text('Payment Method', startX, pHeadY)
		doc.text('Transactions', startX + 220, pHeadY, { width: 90, align: 'right' })
		doc.text('Total Amount (IDR)', startX + 325, pHeadY, { width: 190, align: 'right' })
		doc.y = pHeadY + 14
		doc.strokeColor('#cbd5e1')
			.lineWidth(1)
			.moveTo(startX, doc.y)
			.lineTo(startX + usableWidth, doc.y)
			.stroke()
		doc.y += 6

		doc.font('Helvetica').fontSize(9).fillColor('#334155')
		for (const p of report.payments) {
			const py = doc.y
			doc.text(p.paymentMethod, startX, py)
			doc.text(`${p.orderCount}`, startX + 220, py, { width: 90, align: 'right' })
			doc.text(`Rp ${parseFloat(p.totalAmount).toLocaleString('id-ID')}`, startX + 325, py, {
				width: 190,
				align: 'right',
			})
			doc.y = py + 16
		}

		doc.moveDown(1.5)

		// 4. Category Performance Table
		doc.fontSize(11)
			.font('Helvetica-Bold')
			.fillColor('#0f172a')
			.text('Category Performance', startX)
		doc.moveDown(0.5)

		doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569')
		const cHeadY = doc.y
		doc.text('Category', startX, cHeadY)
		doc.text('Qty Sold', startX + 220, cHeadY, { width: 90, align: 'right' })
		doc.text('Revenue (IDR)', startX + 325, cHeadY, { width: 190, align: 'right' })
		doc.y = cHeadY + 14
		doc.strokeColor('#cbd5e1')
			.lineWidth(1)
			.moveTo(startX, doc.y)
			.lineTo(startX + usableWidth, doc.y)
			.stroke()
		doc.y += 6

		doc.font('Helvetica').fontSize(9).fillColor('#334155')
		for (const c of report.categories) {
			const cy = doc.y
			doc.text(c.categoryName, startX, cy)
			doc.text(`${parseFloat(c.quantity)}`, startX + 220, cy, { width: 90, align: 'right' })
			doc.text(`Rp ${parseFloat(c.totalAmount).toLocaleString('id-ID')}`, startX + 325, cy, {
				width: 190,
				align: 'right',
			})
			doc.y = cy + 16
		}

		doc.moveDown(2)

		// 5. Signature Authorization Lines
		const signY = doc.y
		doc.fontSize(9).font('Helvetica').fillColor('#475569')
		doc.text('Cashier Signature: _______________________', startX, signY)
		doc.text('Manager Verification: _______________________', startX + 260, signY)

		doc.end()
	})
}
