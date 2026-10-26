import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import ExportProfitAndLoss from './Controllers/ExportProfitAndLoss'
import ExportTrialBalance from './Controllers/ExportTrialBalance'
import GetProfitAndLoss from './Controllers/GetProfitAndLoss'
import GetTrialBalance from './Controllers/GetTrialBalance'

const ReportRouter = new CelosiaRouter({ strict: true })

ReportRouter.get('/profit-and-loss', [new VerifyJWT()], new GetProfitAndLoss())
ReportRouter.get('/profit-and-loss/export', [new VerifyJWT()], new ExportProfitAndLoss())

ReportRouter.get('/trial-balance', [new VerifyJWT()], new GetTrialBalance())
ReportRouter.get('/trial-balance/export', [new VerifyJWT()], new ExportTrialBalance())

export default ReportRouter
