import { FC, useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import {
	Box,
	FormControl,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'

import dayjs from 'dayjs'
import { Decimal } from 'decimal.js'
import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'

import JournalEntryFindByIdApi, {
	JournalEntryFindByIdOutput,
} from 'Api/Journal/JournalEntryFindByIdApi'

const JournalEntryDetail: FC = () => {
	const { id } = useParams()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const [journalEntry, setJournalEntry] = useState<JournalEntryFindByIdOutput | null>(null)

	useEffect(() => {
		const main = async () => {
			try {
				if (!id) return await Navigate('../../')

				const result = await JournalEntryFindByIdApi({ id })

				setJournalEntry(result)
			} catch {
				await Navigate('../')
			}
		}

		main().catch((error: unknown) => console.error('JournalEntryDetail load error', error))
	}, [Navigate, id])

	if (journalEntry === null) return null

	const totalDebit = journalEntry.lines.reduce((acc, l) => acc.plus(l.debit || 0), new Decimal(0))
	const totalCredit = journalEntry.lines.reduce(
		(acc, l) => acc.plus(l.credit || 0),
		new Decimal(0),
	)

	return (
		<PageContainer title={t('journal.detail.title')}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				<FormControl fullWidth>
					<TextField
						value={journalEntry.entryNumber}
						label={t('journal.entryNumber')}
						variant='outlined'
						required
					/>
				</FormControl>
				<FormControl fullWidth>
					<DateTimePicker
						label={t('journal.date')}
						defaultValue={dayjs(journalEntry.date)}
						ampm={false}
						readOnly
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						defaultValue={journalEntry.description}
						label={t('journal.description')}
						variant='outlined'
						required
					/>
				</FormControl>

				<TableContainer component={Paper} variant='outlined' sx={{ mb: 2 }}>
					<Table size='small'>
						<TableHead sx={{ backgroundColor: '#f8fafc' }}>
							<TableRow>
								<TableCell width='30%'>{t('journal.account')}</TableCell>
								<TableCell width='30%'>{t('journal.lineDescription')}</TableCell>
								<TableCell width='18%' align='right'>
									{t('journal.debit')}
								</TableCell>
								<TableCell width='18%' align='right'>
									{t('journal.credit')}
								</TableCell>
								<TableCell width='4%' align='center'></TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{journalEntry.lines.map(line => (
								<TableRow key={line.id}>
									<TableCell>
										<TextField
											fullWidth
											size='small'
											placeholder={t('journal.account')}
											defaultValue={line.account.name}
											slotProps={{
												inputLabel: { shrink: true },
												input: { readOnly: true },
											}}
										/>
									</TableCell>

									<TableCell>
										<TextField
											fullWidth
											size='small'
											placeholder={t('journal.description')}
											defaultValue={line.description}
											slotProps={{
												inputLabel: { shrink: true },
												input: { readOnly: true },
											}}
										/>
									</TableCell>

									<TableCell align='right'>
										<MuiMoneyInput
											size='small'
											placeholder='0.00'
											value={line.debit}
											disabled
										/>
									</TableCell>

									<TableCell align='right'>
										<MuiMoneyInput
											size='small'
											placeholder='0.00'
											value={line.credit}
											disabled
										/>
									</TableCell>
								</TableRow>
							))}

							<TableRow sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
								<TableCell colSpan={2} align='right'>
									<Typography variant='body2' sx={{ fontWeight: 'bold' }}>
										{t('journal.totals')}:
									</Typography>
								</TableCell>
								<TableCell align='right'>
									<Typography
										variant='body2'
										sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
									>
										{totalDebit.toString()}
									</Typography>
								</TableCell>
								<TableCell align='right'>
									<Typography
										variant='body2'
										sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
									>
										{totalCredit.toString()}
									</Typography>
								</TableCell>
								<TableCell />
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		</PageContainer>
	)
}

export default JournalEntryDetail

export { JournalEntryDetail as Component }
