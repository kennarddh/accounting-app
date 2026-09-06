import React from 'react'

import CssBaseline from '@mui/material/CssBaseline'

import '@fontsource/roboto/300'
import '@fontsource/roboto/400'
import '@fontsource/roboto/500'
import '@fontsource/roboto/700'
import { createRoot } from 'react-dom/client'

import App from './App'
import './i18n'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!)

root.render(
	<React.StrictMode>
		<CssBaseline />
		<App />
	</React.StrictMode>,
)
