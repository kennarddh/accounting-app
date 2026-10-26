import PDFDocument from 'pdfkit'

import { InventoryValuationReportData } from '../../ReportService'

export const exportInventoryValuationPdf = (
	report: InventoryValuationReportData,
	view: 'valuation' | 'shrinkage' = 'valuation',
): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		const startX = 40
		const usableWidth = 762

		if (view === 'valuation') {
			const colWidths = {
				sku: 80,
				name: 242,
				category: 140,
				stock: 100,
				cost: 100,
				total: 100,
			}

			doc.fontSize(16)
				.font('Helvetica-Bold')
				.fillColor('#0f172a')
				.text('ON-HAND INVENTORY VALUATION REPORT', { align: 'center' })
			doc.fontSize(9)
				.font('Helvetica')
				.fillColor('#64748b')
				.text(`As of Date: ${new Date(report.asOfDate).toLocaleDateString()}`, {
					align: 'center',
				})
			doc.moveDown(1.5)

			const renderHeader = () => {
				doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a')
				const hy = doc.y
				doc.text('SKU', startX, hy, { width: colWidths.sku })
				doc.text('Product Name', startX + colWidths.sku, hy, { width: colWidths.name })
				doc.text('Category', startX + colWidths.sku + colWidths.name, hy, {
					width: colWidths.category,
				})
				doc.text(
					'Units on Hand',
					startX + colWidths.sku + colWidths.name + colWidths.category,
					hy,
					{ width: colWidths.stock, align: 'right' },
				)
				doc.text(
					'Cost Price (IDR)',
					startX + colWidths.sku + colWidths.name + colWidths.category + colWidths.stock,
					hy,
					{ width: colWidths.cost, align: 'right' },
				)
				doc.text(
					'Total Value (IDR)',
					startX +
						colWidths.sku +
						colWidths.name +
						colWidths.category +
						colWidths.stock +
						colWidths.cost,
					hy,
					{ width: colWidths.total, align: 'right' },
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

			for (const v of report.valuationItems) {
				const rowHeight = Math.max(
					14,
					doc.heightOfString(v.name, { width: colWidths.name }),
				)
				if (doc.y + rowHeight > doc.page.height - 50) {
					doc.addPage()
					renderHeader()
					doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
				}

				const cy = doc.y
				doc.text(v.sku, startX, cy, { width: colWidths.sku })
				doc.text(v.name, startX + colWidths.sku, cy, { width: colWidths.name })
				doc.text(v.categoryName, startX + colWidths.sku + colWidths.name, cy, {
					width: colWidths.category,
				})
				doc.text(
					parseFloat(v.currentStock).toLocaleString('id-ID'),
					startX + colWidths.sku + colWidths.name + colWidths.category,
					cy,
					{ width: colWidths.stock, align: 'right' },
				)
				doc.text(
					parseFloat(v.costPrice).toLocaleString('id-ID'),
					startX + colWidths.sku + colWidths.name + colWidths.category + colWidths.stock,
					cy,
					{ width: colWidths.cost, align: 'right' },
				)
				doc.text(
					parseFloat(v.totalValue).toLocaleString('id-ID'),
					startX +
						colWidths.sku +
						colWidths.name +
						colWidths.category +
						colWidths.stock +
						colWidths.cost,
					cy,
					{ width: colWidths.total, align: 'right' },
				)
				doc.y = cy + rowHeight + 4
			}
		} else {
			// Shrinkage & Waste Log View
			const colWidths = {
				date: 75,
				adj: 110,
				type: 75,
				product: 212,
				qty: 65,
				cost: 80,
				subtotal: 80,
				reason: 65,
			}

			doc.fontSize(16)
				.font('Helvetica-Bold')
				.fillColor('#0f172a')
				.text('SHRINKAGE & WASTE AUDIT REPORT', { align: 'center' })
			doc.fontSize(9)
				.font('Helvetica')
				.fillColor('#64748b')
				.text(
					`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()}`,
					{ align: 'center' },
				)
			doc.moveDown(1.5)

			const renderHeader = () => {
				doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a')
				const hy = doc.y
				doc.text('Date', startX, hy, { width: colWidths.date })
				doc.text('Adj #', startX + colWidths.date, hy, { width: colWidths.adj })
				doc.text('Type', startX + colWidths.date + colWidths.adj, hy, {
					width: colWidths.type,
				})
				doc.text('Product', startX + colWidths.date + colWidths.adj + colWidths.type, hy, {
					width: colWidths.product,
				})
				doc.text(
					'Qty Delta',
					startX + colWidths.date + colWidths.adj + colWidths.type + colWidths.product,
					hy,
					{ width: colWidths.qty, align: 'right' },
				)
				doc.text(
					'Value (IDR)',
					startX +
						colWidths.date +
						colWidths.adj +
						colWidths.type +
						colWidths.product +
						colWidths.qty,
					hy,
					{ width: colWidths.subtotal, align: 'right' },
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

			for (const d of report.discrepancies) {
				const rowHeight = Math.max(
					14,
					doc.heightOfString(d.productName, { width: colWidths.product }),
				)
				if (doc.y + rowHeight > doc.page.height - 50) {
					doc.addPage()
					renderHeader()
					doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
				}

				const cy = doc.y
				doc.text(new Date(d.date).toLocaleDateString(), startX, cy, {
					width: colWidths.date,
				})
				doc.text(d.adjustmentNumber, startX + colWidths.date, cy, { width: colWidths.adj })
				doc.text(d.type, startX + colWidths.date + colWidths.adj, cy, {
					width: colWidths.type,
				})
				doc.text(
					`${d.sku} - ${d.productName}`,
					startX + colWidths.date + colWidths.adj + colWidths.type,
					cy,
					{ width: colWidths.product },
				)
				doc.text(
					parseFloat(d.quantityAdjusted).toLocaleString('id-ID'),
					startX + colWidths.date + colWidths.adj + colWidths.type + colWidths.product,
					cy,
					{ width: colWidths.qty, align: 'right' },
				)
				doc.text(
					parseFloat(d.subtotalCost).toLocaleString('id-ID'),
					startX +
						colWidths.date +
						colWidths.adj +
						colWidths.type +
						colWidths.product +
						colWidths.qty,
					cy,
					{ width: colWidths.subtotal, align: 'right' },
				)
				doc.y = cy + rowHeight + 4
			}
		}

		doc.end()
	})
}
