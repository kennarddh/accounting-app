/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from '../../User/UserService'
import ResourceAccessPolicy from './ResourceAccessPolicy'

type ValidatePolicies<
	Policies extends ResourceAccessPolicy<any>[],
	Context,
	Results extends ResourceAccessPolicy<any>[] = [],
> = Policies extends [ResourceAccessPolicy<infer IterContext>, ...infer Tail]
	? Tail extends ResourceAccessPolicy<any>[]
		? IterContext extends undefined
			? ValidatePolicies<Tail, Context, [...Results, Policies[0]]>
			: IterContext extends Context
				? ValidatePolicies<Tail, Context, [...Results, Policies[0]]>
				: ValidatePolicies<Tail, Context, [...Results, ResourceAccessPolicy<Context>]>
		: Results
	: Results

export class Or<
	Context,
	Policies extends ResourceAccessPolicy<any>[],
> extends ResourceAccessPolicy<any> {
	private policies: ValidatePolicies<Policies, Context> & Policies

	constructor(...policies: ValidatePolicies<Policies, Context> & Policies) {
		super()

		this.policies = policies
	}

	async hasAccess(user: User, context: Context) {
		for (const policy of this.policies) {
			if (await policy.hasAccess(user, context)) return true
		}

		return false
	}
}

export class And<
	Context,
	Policies extends ResourceAccessPolicy<any>[],
> extends ResourceAccessPolicy<Context> {
	private policies: ValidatePolicies<Policies, Context> & Policies

	constructor(...policies: ValidatePolicies<Policies, Context> & Policies) {
		super()

		this.policies = policies
	}

	async hasAccess(user: User, context: Context) {
		for (const policy of this.policies) {
			if (!(await policy.hasAccess(user, context))) return false
		}

		return true
	}
}

export class Not<Context> extends ResourceAccessPolicy<Context> {
	constructor(private policy: ResourceAccessPolicy<Context>) {
		super()
	}

	async hasAccess(user: User, context: Context) {
		return !(await this.policy.hasAccess(user, context))
	}
}
