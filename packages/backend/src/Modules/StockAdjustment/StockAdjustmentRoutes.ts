import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import CreateStockAdjustment from './Controllers/CreateStockAdjustment'
import FindManyStockAdjustments from './Controllers/FindManyStockAdjustments'
import FindStockAdjustmentById from './Controllers/FindStockAdjustmentById'

const StockAdjustmentRouter = new CelosiaRouter({ strict: true })

StockAdjustmentRouter.get('/', [new VerifyJWT()], new FindManyStockAdjustments())
StockAdjustmentRouter.post('/', [new VerifyJWT()], new CreateStockAdjustment())
StockAdjustmentRouter.get('/:id', [new VerifyJWT()], new FindStockAdjustmentById())

export default StockAdjustmentRouter
