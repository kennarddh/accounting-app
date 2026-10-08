import { DI, Injectable, Service } from '@celosiajs/core'

import { ApiErrorResource } from '@accounting-app/common'

import { DeepPartialAndUndefined } from 'Types/Types'

import RemoveUndefinedValueFromObject from 'Utils/RemoveUndefinedValueFromObject'

import DatabaseService from 'Modules/Database/DatabaseService'
import { handlePrismaError } from 'Modules/Database/PrismaUtils'

export interface PosConfigurationData {
	cashAccountId: bigint
	bankAccountId: bigint
	salesRevenueAccountId: bigint
	inventoryAssetAccountId: bigint
	cogsAccountId: bigint
	spoilageExpenseAccountId: bigint
	shrinkageExpenseAccountId: bigint
	inventoryGainAccountId: bigint
	accountsPayableAccountId: bigint
	roundingAccountId: bigint
}

@Injectable()
class PosConfigurationService extends Service {
	private cachedConfig: PosConfigurationData | null = null

	constructor(private db = DI.get(DatabaseService)) {
		super('PosConfigurationService')
	}

	/**
	 * Get configuration (Uses in-memory cache for blazing fast reads)
	 */
	async get(forceRefresh = false): Promise<PosConfigurationData> {
		if (this.cachedConfig && !forceRefresh) {
			return this.cachedConfig
		}

		const config = await this.db.client.posConfiguration.findFirst()

		if (!config) {
			throw new Error('POS Configuration is not initialized. Please seed the database.')
		}

		this.cachedConfig = config
		return config
	}

	async update(data: DeepPartialAndUndefined<PosConfigurationData>) {
		try {
			const updated = await this.db.client.posConfiguration.update({
				where: { id: 1 },
				data: RemoveUndefinedValueFromObject(data),
			})

			// Invalidate cache immediately so new settings take effect
			this.cachedConfig = updated

			return updated
		} catch (error) {
			handlePrismaError(error, ApiErrorResource.PosConfiguration)
		}
	}
}

export default PosConfigurationService
