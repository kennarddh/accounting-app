import { OrderStatus, PaymentMethod } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface OrderFindByIdResponse {
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
		username: string
	}
	journalEntry: {
		id: string
		entryNumber: string
	} | null
	items: {
		id: string
		product: {
			id: string
			sku: string
			name: string
		}
		quantity: string
		unitPrice: string
		unitCost: string
		subtotal: string
	}[]
	createdAt: number
	updatedAt: number
}

export interface OrderFindByIdOutput {
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
		username: string
	}
	journalEntry: {
		id: string
		entryNumber: string
	} | null
	items: {
		id: string
		product: {
			id: string
			sku: string
			name: string
		}
		quantity: string
		unitPrice: string
		unitCost: string
		subtotal: string
	}[]
	createdAt: Date
	updatedAt: Date
}

export interface OrderFindByIdData {
	id: string
}

const OrderFindByIdApi: ApiFunction<OrderFindByIdOutput, OrderFindByIdData> = async data => {
	const result = await CallApi<OrderFindByIdResponse>(`/order/${data.id}`, 'GET', true)

	const outputData = result.data.data

	return {
		id: outputData.id,
		orderNumber: outputData.orderNumber,
		date: new Date(outputData.date),
		status: outputData.status as OrderStatus,
		paymentMethod: outputData.paymentMethod as PaymentMethod,
		totalAmount: outputData.totalAmount,
		totalCost: outputData.totalCost,
		cashier: outputData.cashier,
		journalEntry: outputData.journalEntry,
		items: outputData.items,
		createdAt: new Date(outputData.createdAt),
		updatedAt: new Date(outputData.updatedAt),
	}
}

export default OrderFindByIdApi
