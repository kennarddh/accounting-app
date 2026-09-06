import { DeepRemoveUndefined } from 'Types/Types'

const RemoveUndefinedValueFromObject = <T extends object>(data: T) =>
	Object.entries(data).reduce<DeepRemoveUndefined<Partial<T>>>(
		(acc, [key, value]) => {
			if (value === undefined) return acc

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			acc[key as keyof T] = value

			return acc
		},
		{} as DeepRemoveUndefined<Partial<T>>,
	)

export default RemoveUndefinedValueFromObject
