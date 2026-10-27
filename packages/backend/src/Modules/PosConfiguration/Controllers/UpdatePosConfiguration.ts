import { CelosiaResponse, Controller, ControllerRequest, DI, EmptyObject } from '@celosiajs/core'

import z from 'zod/v4'

import PosConfigurationService from '../PosConfigurationService'

class UpdatePosConfiguration extends Controller {
	constructor(private posConfigService = DI.get(PosConfigurationService)) {
		super('UpdatePosConfiguration')
	}

	public async index(
		_: EmptyObject,
		request: ControllerRequest<UpdatePosConfiguration>,
		response: CelosiaResponse,
	) {
		const {
			cashAccountId,
			bankAccountId,
			salesRevenueAccountId,
			inventoryAssetAccountId,
			cogsAccountId,
			spoilageExpenseAccountId,
			shrinkageExpenseAccountId,
			inventoryGainAccountId,
			accountsPayableAccountId,
			roundingAccountId,
			closingLockDate,
		} = request.body

		let parsedLockDate: Date | null | undefined

		if (closingLockDate === null) {
			parsedLockDate = null
		} else if (closingLockDate !== undefined) {
			parsedLockDate = new Date(closingLockDate)
		} else {
			parsedLockDate = undefined
		}

		const updated = await this.posConfigService.update({
			cashAccountId,
			bankAccountId,
			salesRevenueAccountId,
			inventoryAssetAccountId,
			cogsAccountId,
			spoilageExpenseAccountId,
			shrinkageExpenseAccountId,
			inventoryGainAccountId,
			accountsPayableAccountId,
			roundingAccountId,
			closingLockDate: parsedLockDate,
		})

		let updatedLockTimestamp: number | null

		if (updated.closingLockDate) {
			updatedLockTimestamp = updated.closingLockDate.getTime()
		} else {
			updatedLockTimestamp = null
		}

		response.status(200).json({
			errors: {},
			data: {
				cashAccountId: updated.cashAccountId.toString(),
				bankAccountId: updated.bankAccountId.toString(),
				salesRevenueAccountId: updated.salesRevenueAccountId.toString(),
				inventoryAssetAccountId: updated.inventoryAssetAccountId.toString(),
				cogsAccountId: updated.cogsAccountId.toString(),
				spoilageExpenseAccountId: updated.spoilageExpenseAccountId.toString(),
				shrinkageExpenseAccountId: updated.shrinkageExpenseAccountId.toString(),
				inventoryGainAccountId: updated.inventoryGainAccountId.toString(),
				accountsPayableAccountId: updated.accountsPayableAccountId.toString(),
				roundingAccountId: updated.roundingAccountId.toString(),
				closingLockDate: updatedLockTimestamp,
			},
		})
	}

	public override get body() {
		return z.object({
			cashAccountId: z.coerce.bigint().min(1n).optional(),
			bankAccountId: z.coerce.bigint().min(1n).optional(),
			salesRevenueAccountId: z.coerce.bigint().min(1n).optional(),
			inventoryAssetAccountId: z.coerce.bigint().min(1n).optional(),
			cogsAccountId: z.coerce.bigint().min(1n).optional(),
			spoilageExpenseAccountId: z.coerce.bigint().min(1n).optional(),
			shrinkageExpenseAccountId: z.coerce.bigint().min(1n).optional(),
			inventoryGainAccountId: z.coerce.bigint().min(1n).optional(),
			accountsPayableAccountId: z.coerce.bigint().min(1n).optional(),
			roundingAccountId: z.coerce.bigint().min(1n).optional(),
			closingLockDate: z.coerce.number().positive().nullable().optional(),
		})
	}
}

export default UpdatePosConfiguration
