import { User } from '../../User/UserService'

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
abstract class ResourceAccessPolicy<Context> {
	public abstract hasAccess(user: User, context: Context): Promise<boolean>
}

export default ResourceAccessPolicy
