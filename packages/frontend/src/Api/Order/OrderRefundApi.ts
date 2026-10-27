import { OrderStatus } from '@accounting-app/common'

import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface OrderRefundData {
	id: string
	status?: OrderStatus.Refunded | OrderStatus.Cancelled
	reason?: string
}

export interface OrderRefundOutput {
	id: string
	status: string
}

const OrderRefundApi: ApiFunction<OrderRefundOutput, OrderRefundData> = async data => {
	const result = await CallApi<OrderRefundOutput>(`/order/${data.id}/refund`, 'POST', true, {
		data: {
			status: data.status,
			reason: data.reason,
		},
	})

	return result.data.data
}

export default OrderRefundApi
