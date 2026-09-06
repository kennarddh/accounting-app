import { CelosiaRequest } from '@celosiajs/core'

export type OptionalResourceContextGetter<Context> = Context extends undefined
	? ResourceContextGetter<Context> | undefined
	: ResourceContextGetter<Context>

abstract class ResourceContextGetter<Context> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public abstract getContext(request: CelosiaRequest<any, any, any, any>): Promise<Context>
}

export default ResourceContextGetter
