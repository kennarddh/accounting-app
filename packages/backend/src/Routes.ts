import { CelosiaRouter } from '@celosiajs/core'

import RateLimiter from 'Middlewares/RateLimiter'

import NoMatchController from 'Controllers/NoMatchController'

import AccountRouter from 'Modules/Account/AccountRoutes'
import AuthRouter from 'Modules/Auth/AuthRoutes'
import HealthController from 'Modules/Health/HealthController'
import UserRouter from 'Modules/User/UserRoutes'

const Router = new CelosiaRouter({ strict: true })

Router.useMiddlewares(new RateLimiter())

Router.useRouters('/auth', AuthRouter)
Router.useRouters('/user', UserRouter)
Router.useRouters('/account', AccountRouter)

Router.get('/health', [], new HealthController())
Router.all('/*splat', [], new NoMatchController())

export default Router
