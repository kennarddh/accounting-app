import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface ProductSalesOutputItem {
	productId: string
	sku: string
	name: string
	categoryId: string
	categoryName: string
	quantitySold: string
	totalRevenue: string
	totalCost: string
	grossProfit: string
	marginPercent: string
}

export interface CategorySalesOutputItem {
	categoryId: string
	categoryName: string
	productCount: number
	quantitySold: string
	totalRevenue: string
	totalCost: string
	grossProfit: string
	marginPercent: string
}

export interface SalesByProductOutput {
	fromDate: number
	toDate: number
	categoryFilterName: string
	summary: {
		totalQuantity: string
		totalRevenue: string
		totalCost: string
		totalProfit: string
		overallMarginPercent: string
	}
	categories: CategorySalesOutputItem[]
	products: ProductSalesOutputItem[]
}

export interface SalesByProductData {
	fromDate?: number
	toDate?: number
	categoryId?: string | undefined
}

const SalesByProductApi: ApiFunction<SalesByProductOutput, SalesByProductData> = async data => {
	const result = await CallApi<SalesByProductOutput>('/report/sales-by-product', 'GET', true, {
		params: {
			fromDate: data.fromDate,
			toDate: data.toDate,
			categoryId: data.categoryId,
		},
	})

	return result.data.data
}

export default SalesByProductApi
