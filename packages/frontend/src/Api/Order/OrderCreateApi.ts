import { OrderStatus, PaymentMethod } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

interface OrderCreateResponse {
	id: string
}

export interface OrderCreateData {
	orderNumber: string
	date: string
	status: OrderStatus
	paymentMethod: PaymentMethod
	items: {
		productId: string
		quantity: string
	}[]
}

export interface OrderCreateOutput {
	id: string
}

const OrderCreateApi: ApiFunction<OrderCreateOutput, OrderCreateData> = async data => {
	const result = await CallApi<OrderCreateResponse>('/order', 'POST', true, {
		data,
	})

	const outputData = result.data.data

	return {
		id: outputData.id,
	}
}

export default OrderCreateApi
