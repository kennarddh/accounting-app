import { OrderSortField, OrderStatus, PaymentMethod } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction, FindManyData, FindManyOutput, FindManyResponse } from 'Api/Types'

type OrderFindManyResponse = FindManyResponse<{
	id: string
	orderNumber: string
	date: number
	status: string
	paymentMethod: string
	totalAmount: string
	totalCost: string
	cashier: {
		id: string
		name: string
	}
	itemsCount: number
	createdAt: number
	updatedAt: number
}>

export interface OrderFindManySingleOutput {
	id: string
	orderNumber: string
	date: Date
	status: OrderStatus
	paymentMethod: PaymentMethod
	totalAmount: string
	totalCost: string
	cashier: {
		id: string
		name: string
	}
	itemsCount: number
	createdAt: Date
	updatedAt: Date
}

export type OrderFindManyOutput = FindManyOutput<OrderFindManySingleOutput>

export interface OrderFindManyData extends FindManyData<OrderSortField> {
	search?: string
	status?: OrderStatus
	paymentMethod?: PaymentMethod
	createdById?: string
	fromDate?: number
	toDate?: number
}

const OrderFindManyApi: ApiFunction<OrderFindManyOutput, OrderFindManyData> = async data => {
	const result = await CallApi<OrderFindManyResponse>('/order', 'GET', true, {
		params: {
			pagination: data.pagination,
			sort: data.sort,
			search: data.search,
			status: data.status,
			paymentMethod: data.paymentMethod,
			createdById: data.createdById,
			fromDate: data.fromDate,
			toDate: data.toDate,
		},
	})

	const outputData = result.data.data

	return {
		pagination: outputData.pagination,
		list: outputData.list.map(order => ({
			id: order.id,
			orderNumber: order.orderNumber,
			date: new Date(order.date),
			status: order.status as OrderStatus,
			paymentMethod: order.paymentMethod as PaymentMethod,
			totalAmount: order.totalAmount,
			totalCost: order.totalCost,
			cashier: order.cashier,
			itemsCount: order.itemsCount,
			createdAt: new Date(order.createdAt),
			updatedAt: new Date(order.updatedAt),
		})),
	}
}

export default OrderFindManyApi
