import { CelosiaRouter } from '@celosiajs/core'

import HandleAccess from 'Middlewares/HandleAccess'
import VerifyJWT from 'Middlewares/VerifyJWT'

import { IsSameUser } from 'Modules/Auth/AccessControl/ResourceAccessPolicies'
import { UserResourceContextGetter } from 'Modules/Auth/AccessControl/ResourceContextGetters'

import UserSessionRouter from '../UserSession/UserSessionRoutes'
import CreateUser from './Controllers/CreateUser'
import FindManyUsers from './Controllers/FindManyUsers'
import FindUserById from './Controllers/FindUserById'
import UpdateUser from './Controllers/UpdateUser'

const UserRouter = new CelosiaRouter({ strict: true })

UserRouter.useRouters('/', UserSessionRouter)

// TODO: When having permission make admin can get patch /:id
UserRouter.get('/', [new VerifyJWT()], new FindManyUsers())
UserRouter.post('/', [new VerifyJWT()], new CreateUser())
UserRouter.patch(
	'/:id',
	[new VerifyJWT(), new HandleAccess([new IsSameUser()], new UserResourceContextGetter())],
	new UpdateUser(),
)
UserRouter.get(
	'/:id',
	[new VerifyJWT(), new HandleAccess([new IsSameUser()], new UserResourceContextGetter())],
	new FindUserById(),
)

export default UserRouter
