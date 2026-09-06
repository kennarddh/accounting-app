import { CelosiaRouter } from '@celosiajs/core'

import HandleAccess from 'Middlewares/HandleAccess'
import VerifyJWT from 'Middlewares/VerifyJWT'

import { IsSameUser } from 'Modules/Auth/AccessControl/ResourceAccessPolicies'
import { UserResourceContextGetter } from 'Modules/Auth/AccessControl/ResourceContextGetters'

import UserSessionRouter from '../UserSession/UserSessionRoutes'
import { CreateUser, FindManyUsers, FindUserById, UpdateUser } from './Controllers'

const UserRouter = new CelosiaRouter({ strict: true })

UserRouter.useRouters('/', UserSessionRouter)

UserRouter.get('/', [new VerifyJWT(false)], new FindManyUsers())
UserRouter.post('/', [new VerifyJWT(false)], new CreateUser())
UserRouter.patch(
	'/:id',
	[new VerifyJWT(false), new HandleAccess([new IsSameUser()], new UserResourceContextGetter())],
	new UpdateUser(),
)
UserRouter.get(
	'/:id',
	[new VerifyJWT(false), new HandleAccess([new IsSameUser()], new UserResourceContextGetter())],
	new FindUserById(),
)

export default UserRouter
