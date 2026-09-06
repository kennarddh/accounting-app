import { FC } from 'react'

import { isRouteErrorResponse, useRouteError } from 'react-router'

import { useTranslation } from 'react-i18next'

import ErrorPageTemplate from 'Components/ErrorPageTemplate'

const ErrorPage: FC = () => {
	const error = useRouteError()

	const { t } = useTranslation()

	if (isRouteErrorResponse(error) && error.status === 404)
		return (
			<ErrorPageTemplate
				title={t('errors.notFound.title')}
				text={t('errors.notFound.text')}
			/>
		)

	return <ErrorPageTemplate title={t('errors.unknown.title')} text={t('errors.unknown.text')} />
}

export default ErrorPage
