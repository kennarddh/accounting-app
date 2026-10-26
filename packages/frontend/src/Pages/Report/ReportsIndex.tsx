import { FC } from 'react'

import { useNavigate } from 'react-router'

import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded'
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded'

import {
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Divider,
	Grid,
	Typography,
} from '@mui/material'

import { useTranslation } from 'react-i18next'

import PageContainer from 'Components/PageContainer'

interface ReportCardConfig {
	title: string
	description: string
	path: string
	icon: React.ReactNode
	color: string
}

interface ReportSectionConfig {
	title: string
	subtitle: string
	cards: ReportCardConfig[]
}

const ReportsIndex: FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const sections: ReportSectionConfig[] = [
		{
			title: t('reports.hub.sections.financial'),
			subtitle: t('reports.hub.sections.financialDesc'),
			cards: [
				{
					title: t('reports.profitAndLoss.title'),
					description: t('reports.hub.cards.pnl'),
					path: '/report/profit-and-loss',
					icon: <AssessmentRoundedIcon sx={{ fontSize: 32 }} />,
					color: '#0284c7',
				},
				{
					title: t('reports.trialBalance.title'),
					description: t('reports.hub.cards.trialBalance'),
					path: '/report/trial-balance',
					icon: <FactCheckRoundedIcon sx={{ fontSize: 32 }} />,
					color: '#16a34a',
				},
				{
					title: t('reports.balanceSheet.title'),
					description: t('reports.hub.cards.balanceSheet'),
					path: '/report/balance-sheet',
					icon: <AccountBalanceWalletRoundedIcon sx={{ fontSize: 32 }} />,
					color: '#9333ea',
				},
				{
					title: t('reports.generalLedger.title'),
					description: t('reports.hub.cards.generalLedger'),
					path: '/report/general-ledger',
					icon: <ReceiptRoundedIcon sx={{ fontSize: 32 }} />,
					color: '#ea580c',
				},
			],
		},
		{
			title: t('reports.hub.sections.pos'),
			subtitle: t('reports.hub.sections.posDesc'),
			cards: [
				{
					title: t('reports.zReport.title'),
					description: t('reports.hub.cards.zReport'),
					path: '/report/z-report',
					icon: <PointOfSaleRoundedIcon sx={{ fontSize: 32 }} />,
					color: '#2563eb',
				},
				{
					title: t('reports.salesByProduct.title'),
					description: t('reports.hub.cards.salesByProduct'),
					path: '/report/sales-by-product',
					icon: <LeaderboardRoundedIcon sx={{ fontSize: 32 }} />,
					color: '#0d9488',
				},
			],
		},
		{
			title: t('reports.hub.sections.inventory'),
			subtitle: t('reports.hub.sections.inventoryDesc'),
			cards: [
				{
					title: t('reports.inventoryValuation.title'),
					description: t('reports.hub.cards.inventoryValuation'),
					path: '/report/inventory-valuation',
					icon: <WarehouseRoundedIcon sx={{ fontSize: 32 }} />,
					color: '#b45309',
				},
			],
		},
	]

	return (
		<PageContainer title={t('reports.hub.title')}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
				<Typography variant='body1' sx={{ color: 'text.secondary', mt: -1 }}>
					{t('reports.hub.subtitle')}
				</Typography>

				{sections.map((section, secIdx) => (
					<Box key={secIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Box>
							<Typography
								variant='h6'
								sx={{ fontWeight: 600, color: 'text.primary' }}
							>
								{section.title}
							</Typography>
							<Typography variant='body2' sx={{ color: 'text.secondary' }}>
								{section.subtitle}
							</Typography>
						</Box>

						<Grid container spacing={2}>
							{section.cards.map((card, cardIdx) => (
								<Grid key={cardIdx} size={{ xs: 12, sm: 6, md: 4 }}>
									<Card
										variant='outlined'
										sx={{
											height: '100%',
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'space-between',
											transition: 'border-color 0.2s, box-shadow 0.2s',
											'&:hover': {
												borderColor: 'primary.main',
												boxShadow: 2,
											},
										}}
									>
										<CardContent>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 1.5,
													mb: 1.5,
													color: card.color,
												}}
											>
												{card.icon}
												<Typography
													variant='subtitle1'
													sx={{ fontWeight: 600, color: 'text.primary' }}
												>
													{card.title}
												</Typography>
											</Box>
											<Typography
												variant='body2'
												sx={{ color: 'text.secondary', minHeight: 40 }}
											>
												{card.description}
											</Typography>
										</CardContent>

										<Box>
											<Divider />
											<CardActions sx={{ p: 1.5 }}>
												<Button
													size='small'
													endIcon={<ArrowForwardRoundedIcon />}
													onClick={() => navigate(card.path)}
													sx={{
														ml: 'auto',
														textTransform: 'none',
														fontWeight: 600,
													}}
												>
													{t('reports.hub.openReport')}
												</Button>
											</CardActions>
										</Box>
									</Card>
								</Grid>
							))}
						</Grid>
					</Box>
				))}
			</Box>
		</PageContainer>
	)
}

export default ReportsIndex

export { ReportsIndex as Component }
