import { CelosiaRouter } from '@celosiajs/core'

import HandleAccess from 'Middlewares/HandleAccess'
import VerifyJWT from 'Middlewares/VerifyJWT'

import { IsSameUser, IsSameUserBySession } from 'Modules/Auth/AccessControl/ResourceAccessPolicies'
import {
	UserResourceContextGetter,
	UserSessionResourceContextGetter,
} from 'Modules/Auth/AccessControl/ResourceContextGetters'

import FindManyUserSessions from './Controllers/FindManyUserSessions'
import FindUserSessionById from './Controllers/FindUserSessionById'
import RevokeAllUserSessionsByUserId from './Controllers/RevokeAllUserSessionsByUserId'
import RevokeUserSession from './Controllers/RevokeUserSession'

const UserSessionRouter = new CelosiaRouter({ strict: true })

// TODO: When having permission make admin can get patch /:id

UserSessionRouter.get(
	'/session/:id',
	[
		new VerifyJWT(),
		new HandleAccess([new IsSameUserBySession()], new UserSessionResourceContextGetter()),
	],
	new FindUserSessionById(),
)
UserSessionRouter.delete(
	'/session/:id',
	[
		new VerifyJWT(),
		new HandleAccess([new IsSameUserBySession()], new UserSessionResourceContextGetter()),
	],
	new RevokeUserSession(),
)
UserSessionRouter.delete(
	'/:id/session/',
	[new VerifyJWT(), new HandleAccess([new IsSameUser()], new UserResourceContextGetter())],
	new RevokeAllUserSessionsByUserId(),
)
UserSessionRouter.get('/session', [new VerifyJWT()], new FindManyUserSessions())

export default UserSessionRouter
