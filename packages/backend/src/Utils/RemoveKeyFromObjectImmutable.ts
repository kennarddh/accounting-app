const RemoveKeyFromObjectImmutable = <T extends object, Keys extends (keyof T)[]>(
	data: T,
	keysToRemove: Keys,
): Omit<T, Keys[number]> => {
	return Object.fromEntries(
		Object.entries(data).filter(([key]) => !keysToRemove.includes(key as keyof T)),
	) as Omit<T, Keys[number]>
}

export default RemoveKeyFromObjectImmutable
