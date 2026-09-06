import { User } from '../../../User/UserService'
import { UserSession } from '../../../UserSession/UserSessionService'
import ResourceAccessPolicy from '../ResourceAccessPolicy'

class IsSameUserBySession extends ResourceAccessPolicy<UserSession> {
	async hasAccess(user: User, context: UserSession) {
		return user.id === context.user.id
	}
}

export default IsSameUserBySession
