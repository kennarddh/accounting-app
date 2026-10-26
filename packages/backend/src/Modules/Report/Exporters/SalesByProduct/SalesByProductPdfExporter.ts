import PDFDocument from 'pdfkit'

import { SalesByProductReportData } from '../../ReportService'

export const exportSalesByProductPdf = (report: SalesByProductReportData): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		// Use A4 Landscape for clean multi-column layout
		const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })
		const buffers: Buffer[] = []

		doc.on('data', (b: Buffer) => buffers.push(b))
		doc.on('end', () => resolve(Buffer.concat(buffers)))
		doc.on('error', reject)

		const startX = 40
		const usableWidth = 762
		const colWidths = {
			sku: 75,
			name: 180,
			category: 110,
			qty: 70,
			revenue: 95,
			cost: 95,
			profit: 85,
			margin: 52,
		}

		const renderHeader = () => {
			doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a')
			const hy = doc.y

			doc.text('SKU', startX, hy, { width: colWidths.sku })
			doc.text('Product Name', startX + colWidths.sku, hy, { width: colWidths.name })
			doc.text('Category', startX + colWidths.sku + colWidths.name, hy, {
				width: colWidths.category,
			})
			doc.text(
				'Units Sold',
				startX + colWidths.sku + colWidths.name + colWidths.category,
				hy,
				{
					width: colWidths.qty,
					align: 'right',
				},
			)
			doc.text(
				'Revenue (IDR)',
				startX + colWidths.sku + colWidths.name + colWidths.category + colWidths.qty,
				hy,
				{ width: colWidths.revenue, align: 'right' },
			)
			doc.text(
				'COGS (IDR)',
				startX +
					colWidths.sku +
					colWidths.name +
					colWidths.category +
					colWidths.qty +
					colWidths.revenue,
				hy,
				{ width: colWidths.cost, align: 'right' },
			)
			doc.text(
				'Gross Profit',
				startX +
					colWidths.sku +
					colWidths.name +
					colWidths.category +
					colWidths.qty +
					colWidths.revenue +
					colWidths.cost,
				hy,
				{ width: colWidths.profit, align: 'right' },
			)
			doc.text(
				'Margin %',
				startX +
					colWidths.sku +
					colWidths.name +
					colWidths.category +
					colWidths.qty +
					colWidths.revenue +
					colWidths.cost +
					colWidths.profit,
				hy,
				{ width: colWidths.margin, align: 'right' },
			)

			doc.y = hy + 14
			doc.strokeColor('#cbd5e1')
				.lineWidth(1)
				.moveTo(startX, doc.y)
				.lineTo(startX + usableWidth, doc.y)
				.stroke()
			doc.y += 6
		}

		// Document Title
		doc.fontSize(16)
			.font('Helvetica-Bold')
			.fillColor('#0f172a')
			.text('SALES BY PRODUCT & CATEGORY', { align: 'center' })
		doc.fontSize(9)
			.font('Helvetica')
			.fillColor('#64748b')
			.text(
				`Period: ${new Date(report.fromDate).toLocaleDateString()} to ${new Date(report.toDate).toLocaleDateString()} | Filter: ${report.categoryFilterName}`,
				{ align: 'center' },
			)
		doc.moveDown(1.5)

		renderHeader()

		// Product Rows
		doc.font('Helvetica').fontSize(8.5).fillColor('#334155')

		if (report.products.length === 0) {
			doc.text('(No product sales in this period)', startX, doc.y)
			doc.y += 18
		} else {
			for (const p of report.products) {
				const rowHeight = Math.max(
					14,
					doc.heightOfString(p.name, { width: colWidths.name }),
				)

				if (doc.y + rowHeight > doc.page.height - 50) {
					doc.addPage()
					renderHeader()
					doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
				}

				const cy = doc.y

				doc.text(p.sku, startX, cy, { width: colWidths.sku })
				doc.text(p.name, startX + colWidths.sku, cy, { width: colWidths.name })
				doc.text(p.categoryName, startX + colWidths.sku + colWidths.name, cy, {
					width: colWidths.category,
				})
				doc.text(
					parseFloat(p.quantitySold).toLocaleString('id-ID'),
					startX + colWidths.sku + colWidths.name + colWidths.category,
					cy,
					{ width: colWidths.qty, align: 'right' },
				)
				doc.text(
					parseFloat(p.totalRevenue).toLocaleString('id-ID'),
					startX + colWidths.sku + colWidths.name + colWidths.category + colWidths.qty,
					cy,
					{ width: colWidths.revenue, align: 'right' },
				)
				doc.text(
					parseFloat(p.totalCost).toLocaleString('id-ID'),
					startX +
						colWidths.sku +
						colWidths.name +
						colWidths.category +
						colWidths.qty +
						colWidths.revenue,
					cy,
					{ width: colWidths.cost, align: 'right' },
				)
				doc.text(
					parseFloat(p.grossProfit).toLocaleString('id-ID'),
					startX +
						colWidths.sku +
						colWidths.name +
						colWidths.category +
						colWidths.qty +
						colWidths.revenue +
						colWidths.cost,
					cy,
					{ width: colWidths.profit, align: 'right' },
				)
				doc.text(
					`${p.marginPercent}%`,
					startX +
						colWidths.sku +
						colWidths.name +
						colWidths.category +
						colWidths.qty +
						colWidths.revenue +
						colWidths.cost +
						colWidths.profit,
					cy,
					{ width: colWidths.margin, align: 'right' },
				)

				doc.y = cy + rowHeight + 4
			}
		}

		// Divider & Total Row
		doc.strokeColor('#0f172a')
			.lineWidth(1)
			.moveTo(startX, doc.y)
			.lineTo(startX + usableWidth, doc.y)
			.stroke()
		doc.y += 6

		const ty = doc.y
		doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a')
		doc.text('TOTALS', startX, ty, {
			width: colWidths.sku + colWidths.name + colWidths.category,
		})
		doc.text(
			parseFloat(report.summary.totalQuantity).toLocaleString('id-ID'),
			startX + colWidths.sku + colWidths.name + colWidths.category,
			ty,
			{ width: colWidths.qty, align: 'right' },
		)
		doc.text(
			parseFloat(report.summary.totalRevenue).toLocaleString('id-ID'),
			startX + colWidths.sku + colWidths.name + colWidths.category + colWidths.qty,
			ty,
			{ width: colWidths.revenue, align: 'right' },
		)
		doc.text(
			parseFloat(report.summary.totalCost).toLocaleString('id-ID'),
			startX +
				colWidths.sku +
				colWidths.name +
				colWidths.category +
				colWidths.qty +
				colWidths.revenue,
			ty,
			{ width: colWidths.cost, align: 'right' },
		)
		doc.text(
			parseFloat(report.summary.totalProfit).toLocaleString('id-ID'),
			startX +
				colWidths.sku +
				colWidths.name +
				colWidths.category +
				colWidths.qty +
				colWidths.revenue +
				colWidths.cost,
			ty,
			{ width: colWidths.profit, align: 'right' },
		)
		doc.text(
			`${report.summary.overallMarginPercent}%`,
			startX +
				colWidths.sku +
				colWidths.name +
				colWidths.category +
				colWidths.qty +
				colWidths.revenue +
				colWidths.cost +
				colWidths.profit,
			ty,
			{ width: colWidths.margin, align: 'right' },
		)

		doc.end()
	})
}
