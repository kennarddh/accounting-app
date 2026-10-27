import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface DashboardMetricsOutput {
	todaySales: string
	todayOrdersCount: number
	lowStockCount: number
	monthToDateGrossProfit: string
}

export interface DashboardMetricsData {
	startOfToday: number
	startOfMonth: number
}

const DashboardMetricsApi: ApiFunction<
	DashboardMetricsOutput,
	DashboardMetricsData
> = async data => {
	const result = await CallApi<DashboardMetricsOutput>('/report/dashboard-metrics', 'GET', true, {
		params: {
			startOfToday: data.startOfToday,
			startOfMonth: data.startOfMonth,
		},
	})

	return result.data.data
}

export default DashboardMetricsApi
