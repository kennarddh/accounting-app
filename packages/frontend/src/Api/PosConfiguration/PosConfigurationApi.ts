import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

export interface PosConfigurationOutput {
	cashAccountId: string
	bankAccountId: string
	salesRevenueAccountId: string
	inventoryAssetAccountId: string
	cogsAccountId: string
	spoilageExpenseAccountId: string
	shrinkageExpenseAccountId: string
	inventoryGainAccountId: string
	accountsPayableAccountId: string
	roundingAccountId: string
	closingLockDate: number | null
}

export interface PosConfigurationUpdateData {
	cashAccountId?: string
	bankAccountId?: string
	salesRevenueAccountId?: string
	inventoryAssetAccountId?: string
	cogsAccountId?: string
	spoilageExpenseAccountId?: string
	shrinkageExpenseAccountId?: string
	inventoryGainAccountId?: string
	accountsPayableAccountId?: string
	roundingAccountId?: string
	closingLockDate?: number | null
}

export const PosConfigurationGetApi: ApiFunction<PosConfigurationOutput> = async () => {
	const result = await CallApi<PosConfigurationOutput>('/pos-configuration', 'GET', true)
	return result.data.data
}

export const PosConfigurationUpdateApi: ApiFunction<
	PosConfigurationOutput,
	PosConfigurationUpdateData
> = async data => {
	const result = await CallApi<PosConfigurationOutput>('/pos-configuration', 'PATCH', true, {
		data,
	})

	return result.data.data
}
