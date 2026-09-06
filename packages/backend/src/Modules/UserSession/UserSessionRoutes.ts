import { CelosiaRouter } from '@celosiajs/core'

import HandleAccess from 'Middlewares/HandleAccess'
import VerifyJWT from 'Middlewares/VerifyJWT'

import { IsSameUser, IsSameUserBySession } from 'Modules/Auth/AccessControl/ResourceAccessPolicies'
import {
	UserResourceContextGetter,
	UserSessionResourceContextGetter,
} from 'Modules/Auth/AccessControl/ResourceContextGetters'

import {
	FindManyUserSessions,
	FindUserSessionById,
	RevokeAllUserSessionsByUserId,
	RevokeUserSession,
} from './Controllers'

const UserSessionRouter = new CelosiaRouter({ strict: true })

UserSessionRouter.get(
	'/session/:id',
	[
		new VerifyJWT(false),
		new HandleAccess([new IsSameUserBySession()], new UserSessionResourceContextGetter()),
	],
	new FindUserSessionById(),
)
UserSessionRouter.delete(
	'/session/:id',
	[
		new VerifyJWT(false),
		new HandleAccess([new IsSameUserBySession()], new UserSessionResourceContextGetter()),
	],
	new RevokeUserSession(),
)
UserSessionRouter.delete(
	'/:id/session/',
	[new VerifyJWT(false), new HandleAccess([new IsSameUser()], new UserResourceContextGetter())],
	new RevokeAllUserSessionsByUserId(),
)
UserSessionRouter.get('/session', [new VerifyJWT(false)], new FindManyUserSessions())

export default UserSessionRouter
