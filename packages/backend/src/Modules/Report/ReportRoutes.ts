import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import ExportBalanceSheet from './Controllers/ExportBalanceSheet'
import ExportProfitAndLoss from './Controllers/ExportProfitAndLoss'
import ExportTrialBalance from './Controllers/ExportTrialBalance'
import GetBalanceSheet from './Controllers/GetBalanceSheet'
import GetProfitAndLoss from './Controllers/GetProfitAndLoss'
import GetTrialBalance from './Controllers/GetTrialBalance'

const ReportRouter = new CelosiaRouter({ strict: true })

ReportRouter.get('/profit-and-loss', [new VerifyJWT()], new GetProfitAndLoss())
ReportRouter.get('/profit-and-loss/export', [new VerifyJWT()], new ExportProfitAndLoss())

ReportRouter.get('/trial-balance', [new VerifyJWT()], new GetTrialBalance())
ReportRouter.get('/trial-balance/export', [new VerifyJWT()], new ExportTrialBalance())

ReportRouter.get('/balance-sheet', [new VerifyJWT()], new GetBalanceSheet())
ReportRouter.get('/balance-sheet/export', [new VerifyJWT()], new ExportBalanceSheet())

export default ReportRouter
