// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Intl {
	interface DurationFormatOptions {
		style?: 'long' | 'short' | 'narrow' | 'digital'
		years?: 'long' | 'short' | 'narrow'
		months?: 'long' | 'short' | 'narrow'
		days?: 'long' | 'short' | 'narrow'
		hours?: 'long' | 'short' | 'narrow' | 'numeric'
		minutes?: 'long' | 'short' | 'narrow' | 'numeric'
		seconds?: 'long' | 'short' | 'narrow' | 'numeric'
	}

	interface Duration {
		years?: number | undefined
		months?: number | undefined
		weeks?: number | undefined
		days?: number | undefined
		hours?: number | undefined
		minutes?: number | undefined
		seconds?: number | undefined
	}

	class DurationFormat {
		constructor(locales?: string | string[], options?: DurationFormatOptions)
		format(duration: Duration): string
	}
}

const SECONDS_IN_YEAR = 31536000 // 365 days
const SECONDS_IN_MONTH = 2592000 // 30 days
const SECONDS_IN_DAY = 86400
const SECONDS_IN_HOUR = 3600
const SECONDS_IN_MINUTE = 60

/**
 * Formats seconds into Years, Months, Days, Hours, etc.
 *
 * @param totalSeconds - The duration in seconds.
 * @param locale - (Optional) Pass `undefined` to use the user's system language automatically.
 */
export function FormatDuration(totalSeconds: number, locale?: string): string {
	if (totalSeconds === 0) {
		return new Intl.DurationFormat(locale, { style: 'long' }).format({ seconds: 0 })
	}

	let remaining = Math.abs(totalSeconds)

	const years = Math.floor(remaining / SECONDS_IN_YEAR)
	remaining %= SECONDS_IN_YEAR

	const months = Math.floor(remaining / SECONDS_IN_MONTH)
	remaining %= SECONDS_IN_MONTH

	const days = Math.floor(remaining / SECONDS_IN_DAY)
	remaining %= SECONDS_IN_DAY

	const hours = Math.floor(remaining / SECONDS_IN_HOUR)
	remaining %= SECONDS_IN_HOUR

	const minutes = Math.floor(remaining / SECONDS_IN_MINUTE)

	const seconds = Math.floor(remaining % 60)

	const duration: Intl.Duration = {
		years: years || undefined,
		months: months || undefined,
		days: days || undefined,
		hours: hours || undefined,
		minutes: minutes || undefined,
		seconds: seconds || undefined,
	}

	return new Intl.DurationFormat(locale, {
		style: 'long',
	}).format(duration)
}
