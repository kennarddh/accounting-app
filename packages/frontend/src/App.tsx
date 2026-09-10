import { FC, Suspense, useMemo } from 'react'

import { RouterProvider, createBrowserRouter } from 'react-router'

import { ThemeProvider, createTheme } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import AdminDashboardLayout from 'Outlets/AdminDashboardLayout'
import AuthorizationOutlet from 'Outlets/AuthorizationOutlet'
import MainLayout from 'Outlets/MainLayout'
import { useTranslation } from 'react-i18next'

import PWAManager from 'Components/PWAManager'

import PromptProvider from 'Contexts/Prompt'

import MUILocaleMap, { DefaultMUILocale } from 'Constants/MUILocaleMap'

import ErrorPage from 'Pages/ErrorPage'
import LoadingPage from 'Pages/LoadingPage'

const router = createBrowserRouter([
	{
		element: <MainLayout />,
		hydrateFallbackElement: <LoadingPage />,
		errorElement: <ErrorPage />,
		children: [
			{
				path: '/',
				element: <AuthorizationOutlet />,
				children: [
					{
						path: '',
						element: <AdminDashboardLayout />,
						children: [
							{
								index: true,
								lazy: () => import('Pages/Home'),
							},
							{
								path: 'user',
								children: [
									{
										index: true,
										lazy: () => import('Pages/User/UserList'),
									},
									{
										path: 'new',
										lazy: () => import('Pages/User/NewUser'),
									},
									{
										path: ':id',
										children: [
											{
												index: true,
												lazy: () => import('Pages/User/UserDetail'),
											},
											{
												path: 'edit',
												lazy: () => import('Pages/User/EditUser'),
											},
										],
									},
									{
										path: 'session',
										children: [
											{
												index: true,
												lazy: () =>
													import('Pages/UserSession/UserSessionList'),
											},
											{
												path: ':id',
												lazy: () =>
													import('Pages/UserSession/UserSessionDetail'),
											},
										],
									},
								],
							},
							{
								path: 'account',
								children: [
									{
										index: true,
										lazy: () => import('Pages/Account/AccountList'),
									},
									{
										path: 'new',
										lazy: () => import('Pages/Account/NewAccount'),
									},
									{
										path: ':id',
										children: [
											{
												index: true,
												lazy: () => import('Pages/Account/AccountDetail'),
											},
											{
												path: 'edit',
												lazy: () => import('Pages/Account/EditAccount'),
											},
										],
									},
								],
							},
							{
								path: 'journal',
								children: [
									{
										index: true,
										lazy: () => import('Pages/Journal/JournalList'),
									},
								],
							},
						],
					},
				],
			},
			{
				path: 'login',
				element: <AuthorizationOutlet forNonLoggedIn />,
				children: [{ index: true, lazy: () => import('Pages/Login') }],
			},
		],
	},
])

const App: FC = () => {
	const { i18n } = useTranslation()

	const theme = useMemo(() => {
		const currentMUILocale = Object.keys(MUILocaleMap).includes(i18n.language)
			? MUILocaleMap[i18n.language as keyof typeof MUILocaleMap]
			: DefaultMUILocale

		return createTheme(
			{},
			currentMUILocale.dataGrid,
			currentMUILocale.datePicker,
			currentMUILocale.material,
		)
	}, [i18n.language])

	return (
		<Suspense fallback={<LoadingPage />}>
			<ThemeProvider theme={theme} noSsr>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<PromptProvider>
						<PWAManager />
						<RouterProvider router={router} />
					</PromptProvider>
				</LocalizationProvider>
			</ThemeProvider>
		</Suspense>
	)
}

export default App
