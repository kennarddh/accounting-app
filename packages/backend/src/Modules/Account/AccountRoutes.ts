import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import CreateAccount from './Controllers/CreateAccount'
import DisableAccount from './Controllers/DisableAccount'
import EnableAccount from './Controllers/EnableAccount'
import FindAccountById from './Controllers/FindAccountById'
import FindManyAccounts from './Controllers/FindManyAccounts'
import UpdateAccount from './Controllers/UpdateAccount'

const AccountRouter = new CelosiaRouter({ strict: true })

AccountRouter.get('/', [new VerifyJWT()], new FindManyAccounts())
AccountRouter.post('/', [new VerifyJWT()], new CreateAccount())
AccountRouter.patch('/:id', [new VerifyJWT()], new UpdateAccount())
AccountRouter.get('/:id', [new VerifyJWT()], new FindAccountById())
AccountRouter.post('/:id/disable', [new VerifyJWT()], new DisableAccount())
AccountRouter.post('/:id/enable', [new VerifyJWT()], new EnableAccount())

export default AccountRouter
