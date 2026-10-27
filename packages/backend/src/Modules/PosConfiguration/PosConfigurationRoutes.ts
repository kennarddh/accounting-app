import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import GetPosConfiguration from './Controllers/GetPosConfiguration'
import UpdatePosConfiguration from './Controllers/UpdatePosConfiguration'

const PosConfigurationRouter = new CelosiaRouter({ strict: true })

PosConfigurationRouter.get('/', [new VerifyJWT()], new GetPosConfiguration())
PosConfigurationRouter.patch('/', [new VerifyJWT()], new UpdatePosConfiguration())

export default PosConfigurationRouter
