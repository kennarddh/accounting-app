import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'

import {
	Chip,
	FormControl,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from '@mui/material'
import {
	GridActionsCellItem,
	GridColDef,
	GridDataSource,
	GridGetRowsParams,
	GridGetRowsResponse,
} from '@mui/x-data-grid'

import { OrderSortField, OrderStatus, PaymentMethod } from '@accounting-app/common'
import { useTranslation } from 'react-i18next'

import ListPageTemplate, { ListPageTemplateHandle } from 'Components/ListPageTemplate'

import TransformGridGetRowsParams from 'Utils/TransformGridGetRowsParams'

import useDebounce from 'Hooks/useDebounce'

import OrderFindManyApi, { OrderFindManySingleOutput } from 'Api/Order/OrderFindManyApi'

const OrderList: FC = () => {
	const [SearchParams, SetSearchParams] = useSearchParams()

	const [FilterSearch, SetFilterSearch] = useState(() => SearchParams.get('search') ?? '')
	const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>(() => {
		const status = SearchParams.get('status') as OrderStatus | null
		return status && Object.values(OrderStatus).includes(status) ? status : ''
	})
	const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | ''>(() => {
		const method = SearchParams.get('paymentMethod') as PaymentMethod | null
		return method && Object.values(PaymentMethod).includes(method) ? method : ''
	})

	const ListPageTemplateRef = useRef<ListPageTemplateHandle>(null)

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const OnFilterReset = useCallback(() => {
		SetFilterSearch('')
		setStatusFilter('')
		setPaymentMethodFilter('')
	}, [])

	const getStatusChipColor = (status: OrderStatus) => {
		switch (status) {
			case OrderStatus.Completed:
				return 'success'
			case OrderStatus.Cancelled:
				return 'error'
			case OrderStatus.Refunded:
				return 'warning'
			default:
				return 'default'
		}
	}

	const Columns = useMemo<GridColDef<OrderFindManySingleOutput>[]>(
		() => [
			{
				field: 'orderNumber',
				headerName: t('orders.orderNumber'),
				width: 180,
			},
			{
				field: 'date',
				headerName: t('orders.date'),
				width: 220,
				valueGetter: (_, row) => t('common.dateTime', { date: row.date }),
			},
			{
				field: 'status',
				headerName: t('orders.status'),
				width: 130,
				renderCell: params => (
					<Chip
						label={t(`orders.enum.status.${params.row.status}`)}
						color={getStatusChipColor(params.row.status)}
						size='small'
					/>
				),
			},
			{
				field: 'paymentMethod',
				headerName: t('orders.paymentMethod'),
				width: 140,
				valueGetter: (_, row) => t(`orders.enum.paymentMethod.${row.paymentMethod}`),
			},
			{
				field: 'totalAmount',
				headerName: t('orders.totalAmount'),
				width: 150,
				align: 'right',
				headerAlign: 'right',
				renderCell: params => (
					<span style={{ fontFamily: 'monospace' }}>{params.row.totalAmount}</span>
				),
			},
			{
				field: 'totalCost',
				headerName: t('orders.totalCost'),
				width: 150,
				align: 'right',
				headerAlign: 'right',
				renderCell: params => (
					<span style={{ fontFamily: 'monospace' }}>{params.row.totalCost}</span>
				),
			},
			{
				field: 'itemsCount',
				headerName: t('orders.itemsCount'),
				width: 110,
				align: 'right',
				headerAlign: 'right',
			},
			{
				field: 'cashier',
				headerName: t('orders.cashier'),
				minWidth: 150,
				flex: 1,
				valueGetter: (_, row) => row.cashier.name,
			},
			{
				field: 'actions',
				type: 'actions',
				width: 80,
				getActions: params => [
					<GridActionsCellItem
						key='seeDetail'
						icon={<VisibilityIcon />}
						label={t('common.seeDetail')}
						onClick={() => Navigate(params.row.id)}
					/>,
				],
			},
		],
		[Navigate, t],
	)

	const debouncedFilterSearch = useDebounce(FilterSearch, 500)

	useEffect(() => {
		SetSearchParams(prev => {
			if (debouncedFilterSearch !== '') prev.set('search', debouncedFilterSearch)
			else prev.delete('search')

			if (statusFilter !== '') prev.set('status', statusFilter)
			else prev.delete('status')

			if (paymentMethodFilter !== '') prev.set('paymentMethod', paymentMethodFilter)
			else prev.delete('paymentMethod')

			return prev
		})
	}, [SetSearchParams, debouncedFilterSearch, statusFilter, paymentMethodFilter])

	const OrderDataSource = useMemo<GridDataSource>(
		() => ({
			getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
				const result = await OrderFindManyApi({
					...TransformGridGetRowsParams<OrderSortField>(params),
					...(debouncedFilterSearch ? { search: debouncedFilterSearch } : {}),
					...(statusFilter !== '' ? { status: statusFilter } : {}),
					...(paymentMethodFilter !== '' ? { paymentMethod: paymentMethodFilter } : {}),
				})

				return { rows: result.list, rowCount: result.pagination.total }
			},
		}),
		[debouncedFilterSearch, statusFilter, paymentMethodFilter],
	)

	return (
		<ListPageTemplate
			ref={ListPageTemplateRef}
			title={t('orders.list.title')}
			dataSource={OrderDataSource}
			columns={Columns}
			sortFieldEnum={OrderSortField}
			onFilterReset={OnFilterReset}
			filterSlot={
				<>
					<TextField
						id='search'
						label={t('common.search')}
						variant='outlined'
						size='small'
						value={FilterSearch}
						onChange={event => SetFilterSearch(event.target.value)}
						sx={{ minWidth: 200 }}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position='start'>
										<SearchIcon />
									</InputAdornment>
								),
							},
						}}
					/>
					<FormControl size='small' sx={{ minWidth: 150 }}>
						<InputLabel id='order-status-filter-label'>{t('orders.status')}</InputLabel>
						<Select
							labelId='order-status-filter-label'
							label={t('orders.status')}
							value={statusFilter}
							onChange={e => setStatusFilter(e.target.value)}
						>
							<MenuItem value=''>
								<em>{t('common.all')}</em>
							</MenuItem>
							{Object.values(OrderStatus).map(st => (
								<MenuItem key={st} value={st}>
									{t(`orders.enum.status.${st}`)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl size='small' sx={{ minWidth: 170 }}>
						<InputLabel id='order-payment-method-filter-label'>
							{t('orders.paymentMethod')}
						</InputLabel>
						<Select
							labelId='order-payment-method-filter-label'
							label={t('orders.paymentMethod')}
							value={paymentMethodFilter}
							onChange={e => setPaymentMethodFilter(e.target.value)}
						>
							<MenuItem value=''>
								<em>{t('common.all')}</em>
							</MenuItem>
							{Object.values(PaymentMethod).map(pm => (
								<MenuItem key={pm} value={pm}>
									{t(`orders.enum.paymentMethod.${pm}`)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</>
			}
		/>
	)
}

export default OrderList

export { OrderList as Component }
