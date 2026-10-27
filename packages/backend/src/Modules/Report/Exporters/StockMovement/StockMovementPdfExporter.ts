import PDFDocument from 'pdfkit'

import { StockMovementReportData } from '../../ReportService'

export const exportStockMovementPdf = (report: StockMovementReportData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		const startX = 40
		const usableWidth = 762
		const colWidths = {
			date: 65,
			ref: 110,
			type: 70,
			sku: 65,
			product: 182,
			qty: 65,
			cost: 75,
			balance: 65,
			user: 65,
		}

		// Title Block
		doc.fontSize(16)
			.font('Helvetica-Bold')
			.fillColor('#0f172a')
			.text('STOCK MOVEMENT AUDIT TRAIL', { align: 'center' })
		const subTitle = report.filteredProduct
			? `Product: ${report.filteredProduct.sku} - ${report.filteredProduct.name} | Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`
			: `All Products | Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`

		doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(subTitle, { align: 'center' })
		doc.moveDown(1.2)

		const renderHeader = () => {
			doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a')
			const hy = doc.y

			doc.text('Date', startX, hy, { width: colWidths.date })
			doc.text('Reference #', startX + colWidths.date, hy, { width: colWidths.ref })
			doc.text('Type', startX + colWidths.date + colWidths.ref, hy, { width: colWidths.type })
			doc.text('SKU', startX + colWidths.date + colWidths.ref + colWidths.type, hy, {
				width: colWidths.sku,
			})
			doc.text(
				'Product Name',
				startX + colWidths.date + colWidths.ref + colWidths.type + colWidths.sku,
				hy,
				{
					width: colWidths.product,
				},
			)
			doc.text(
				'Qty Delta',
				startX +
					colWidths.date +
					colWidths.ref +
					colWidths.type +
					colWidths.sku +
					colWidths.product,
				hy,
				{ width: colWidths.qty, align: 'right' },
			)
			doc.text(
				'Cost/Unit',
				startX +
					colWidths.date +
					colWidths.ref +
					colWidths.type +
					colWidths.sku +
					colWidths.product +
					colWidths.qty,
				hy,
				{ width: colWidths.cost, align: 'right' },
			)
			doc.text(
				'Balance',
				startX +
					colWidths.date +
					colWidths.ref +
					colWidths.type +
					colWidths.sku +
					colWidths.product +
					colWidths.qty +
					colWidths.cost,
				hy,
				{ width: colWidths.balance, align: 'right' },
			)

			doc.y = hy + 14
			doc.strokeColor('#cbd5e1')
				.lineWidth(1)
				.moveTo(startX, doc.y)
				.lineTo(startX + usableWidth, doc.y)
				.stroke()
			doc.y += 6
		}

		renderHeader()
		doc.font('Helvetica').fontSize(8.5).fillColor('#334155')

		if (report.movements.length === 0) {
			doc.text('(No stock movements recorded for this period)', startX, doc.y)
			doc.y += 18
		} else {
			for (const m of report.movements) {
				const rowHeight = Math.max(
					14,
					doc.heightOfString(m.productName, { width: colWidths.product }),
				)

				if (doc.y + rowHeight > doc.page.height - 50) {
					doc.addPage()
					renderHeader()
					doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
				}

				const cy = doc.y

				doc.text(new Date(m.date).toLocaleDateString(), startX, cy, {
					width: colWidths.date,
				})
				doc.text(m.referenceNumber, startX + colWidths.date, cy, { width: colWidths.ref })
				doc.text(m.type, startX + colWidths.date + colWidths.ref, cy, {
					width: colWidths.type,
				})
				doc.text(m.sku, startX + colWidths.date + colWidths.ref + colWidths.type, cy, {
					width: colWidths.sku,
				})
				doc.text(
					m.productName,
					startX + colWidths.date + colWidths.ref + colWidths.type + colWidths.sku,
					cy,
					{
						width: colWidths.product,
					},
				)
				doc.text(
					parseFloat(m.quantity) > 0 ? `+${m.quantity}` : m.quantity,
					startX +
						colWidths.date +
						colWidths.ref +
						colWidths.type +
						colWidths.sku +
						colWidths.product,
					cy,
					{ width: colWidths.qty, align: 'right' },
				)
				doc.text(
					parseFloat(m.costPerUnit).toLocaleString('id-ID'),
					startX +
						colWidths.date +
						colWidths.ref +
						colWidths.type +
						colWidths.sku +
						colWidths.product +
						colWidths.qty,
					cy,
					{ width: colWidths.cost, align: 'right' },
				)
				doc.text(
					m.runningStock !== undefined
						? parseFloat(m.runningStock).toLocaleString('id-ID')
						: '-',
					startX +
						colWidths.date +
						colWidths.ref +
						colWidths.type +
						colWidths.sku +
						colWidths.product +
						colWidths.qty +
						colWidths.cost,
					cy,
					{ width: colWidths.balance, align: 'right' },
				)

				doc.y = cy + rowHeight + 4
			}
		}

		doc.end()
	})
}
