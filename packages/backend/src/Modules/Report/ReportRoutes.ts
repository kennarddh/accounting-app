import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import ExportProfitAndLoss from './Controllers/ExportProfitAndLoss'
import GetProfitAndLoss from './Controllers/GetProfitAndLoss'

const ReportRouter = new CelosiaRouter({ strict: true })

ReportRouter.get('/profit-and-loss', [new VerifyJWT()], new GetProfitAndLoss())
ReportRouter.get('/profit-and-loss/export', [new VerifyJWT()], new ExportProfitAndLoss())

export default ReportRouter
