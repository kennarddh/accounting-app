import { Decimal } from 'decimal.js'

export const safeDecimal = (val: string | number | null | undefined): Decimal => {
	if (!val || val === '-' || val === '.' || val === '-.') {
		return new Decimal(0)
	}
	try {
		return new Decimal(val)
	} catch {
		return new Decimal(0)
	}
}
