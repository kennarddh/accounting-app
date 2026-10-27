import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import CreateSupplier from './Controllers/CreateSupplier'
import DisableSupplier from './Controllers/DisableSupplier'
import EnableSupplier from './Controllers/EnableSupplier'
import FindManySuppliers from './Controllers/FindManySuppliers'
import FindSupplierById from './Controllers/FindSupplierById'
import FindSupplierOptions from './Controllers/FindSupplierOptions'
import UpdateSupplier from './Controllers/UpdateSupplier'

const SupplierRouter = new CelosiaRouter({ strict: true })

SupplierRouter.get('/', [new VerifyJWT()], new FindManySuppliers())
SupplierRouter.get('/options', [new VerifyJWT()], new FindSupplierOptions())
SupplierRouter.post('/', [new VerifyJWT()], new CreateSupplier())
SupplierRouter.patch('/:id', [new VerifyJWT()], new UpdateSupplier())
SupplierRouter.get('/:id', [new VerifyJWT()], new FindSupplierById())
SupplierRouter.post('/:id/disable', [new VerifyJWT()], new DisableSupplier())
SupplierRouter.post('/:id/enable', [new VerifyJWT()], new EnableSupplier())

export default SupplierRouter
