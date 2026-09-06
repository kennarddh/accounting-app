import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import {
	CreateAccount,
	DisableAccount,
	EnableAccount,
	FindAccountById,
	FindManyAccounts,
	UpdateAccount,
} from './Controllers'

const AccountRouter = new CelosiaRouter({ strict: true })

AccountRouter.get('/', [new VerifyJWT(false)], new FindManyAccounts())
AccountRouter.post('/', [new VerifyJWT(false)], new CreateAccount())
AccountRouter.patch('/:id', [new VerifyJWT(false)], new UpdateAccount())
AccountRouter.get('/:id', [new VerifyJWT(false)], new FindAccountById())
AccountRouter.post('/:id/disable', [new VerifyJWT(false)], new DisableAccount())
AccountRouter.post('/:id/enable', [new VerifyJWT(false)], new EnableAccount())

export default AccountRouter
