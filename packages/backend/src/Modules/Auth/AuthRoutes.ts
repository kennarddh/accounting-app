import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import { Login, Logout, Me, Refresh, Session } from './Controllers/index'

const AuthRouter = new CelosiaRouter({ strict: true })

AuthRouter.post('/login', [], new Login())
AuthRouter.post('/refresh', [], new Refresh())
AuthRouter.get('/me', [new VerifyJWT()], new Me())
AuthRouter.post('/logout', [new VerifyJWT()], new Logout())
AuthRouter.get('/session', [new VerifyJWT()], new Session())

export default AuthRouter
