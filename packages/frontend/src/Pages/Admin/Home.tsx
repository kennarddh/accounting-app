import { FC } from 'react'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/Admin/PageContainer'

const Home: FC = () => {
	const { t } = useTranslation()

	return <PageContainer title={t('home.title')}>{t('home.title')}</PageContainer>
}

export default Home

export { Home as Component }
