import i18n from '../i18n'

const FormatCurrency = (amount: string | number | null | undefined): string => {
	if (amount === null || amount === undefined || amount === '') return 'Rp 0'
	const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
	if (Number.isNaN(numeric)) return 'Rp 0'

	return i18n.t('common.currency', { value: numeric })
}

export default FormatCurrency
