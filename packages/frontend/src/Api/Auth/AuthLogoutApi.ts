import CallApi from 'Api/CallApi'
import { ApiFunction } from 'Api/Types'

const AuthLogoutApi: ApiFunction = async () => {
	await CallApi('/auth/logout', 'POST', true)
}

export default AuthLogoutApi
