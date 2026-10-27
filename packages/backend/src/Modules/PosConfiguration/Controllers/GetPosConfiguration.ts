import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import PosConfigurationService from '../PosConfigurationService'

class GetPosConfiguration extends Controller {
	constructor(private posConfigService = DI.get(PosConfigurationService)) {
		super('GetPosConfiguration')
	}

	public async index(
		_: EmptyObject,
		__: ControllerRequest<GetPosConfiguration>,
		response: CelosiaResponse,
	) {
		const config = await this.posConfigService.get(true)

		response.status(200).json({
			errors: {},
			data: {
				cashAccountId: config.cashAccountId.toString(),
				bankAccountId: config.bankAccountId.toString(),
				salesRevenueAccountId: config.salesRevenueAccountId.toString(),
				inventoryAssetAccountId: config.inventoryAssetAccountId.toString(),
				cogsAccountId: config.cogsAccountId.toString(),
				spoilageExpenseAccountId: config.spoilageExpenseAccountId.toString(),
				shrinkageExpenseAccountId: config.shrinkageExpenseAccountId.toString(),
				inventoryGainAccountId: config.inventoryGainAccountId.toString(),
				accountsPayableAccountId: config.accountsPayableAccountId.toString(),
				roundingAccountId: config.roundingAccountId.toString(),
			},
		})
	}
}

export default GetPosConfiguration
