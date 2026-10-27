import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import CreateOrder from './Controllers/CreateOrder'
import FindManyOrders from './Controllers/FindManyOrders'
import FindOrderById from './Controllers/FindOrderById'
import RefundOrder from './Controllers/RefundOrder'

const OrderRouter = new CelosiaRouter({ strict: true })

OrderRouter.get('/', [new VerifyJWT()], new FindManyOrders())
OrderRouter.post('/', [new VerifyJWT()], new CreateOrder())
OrderRouter.get('/:id', [new VerifyJWT()], new FindOrderById())
OrderRouter.post('/:id/refund', [new VerifyJWT()], new RefundOrder())

export default OrderRouter
