import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'
import Session from './Controllers/Session'
import Logout from './Controllers/Logout'
import Me from './Controllers/Me'
import Refresh from './Controllers/Refresh'
import Login from './Controllers/Login'


const AuthRouter = new CelosiaRouter({ strict: true })

AuthRouter.post('/login', [], new Login())
AuthRouter.post('/refresh', [], new Refresh())
AuthRouter.get('/me', [new VerifyJWT()], new Me())
AuthRouter.post('/logout', [new VerifyJWT()], new Logout())
AuthRouter.get('/session', [new VerifyJWT()], new Session())

export default AuthRouter
