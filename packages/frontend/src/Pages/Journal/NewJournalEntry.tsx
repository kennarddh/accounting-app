import { FC, SubmitEvent, useCallback, useEffect, useMemo, useState, useTransition } from 'react'

import { useLocation, useNavigate } from 'react-router'

import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import {
	Alert,
	Box,
	Button,
	Chip,
	FormControl,
	IconButton,
	MenuItem,
	Paper,
	Select,
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

import dayjs, { Dayjs } from 'dayjs'
import { Decimal } from 'decimal.js'
import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import AccountFindOptionsApi from 'Api/Account/AccountFindOptionsApi'
import JournalEntryCreateApi from 'Api/Journal/JournalEntryCreateApi'

interface LineRow {
	id: string // Temporary frontend key
	accountId: string
	debit: string
	credit: string
	description: string
}

interface Account {
	id: string
	code: string
	name: string
}

export interface ReverseJournalLinePayload {
	accountId: string
	debit: string
	credit: string
	description: string
}

export interface ReverseJournalLocationState {
	reverseFromJournal?: {
		entryNumber: string
		description: string
		lines: ReverseJournalLinePayload[]
	}
}

const NewJournalEntry: FC = () => {
	const { t } = useTranslation()

	const location = useLocation()
	const locationState = location.state as ReverseJournalLocationState | null
	const reverseData = locationState?.reverseFromJournal

	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [date, setDate] = useState<Dayjs>(dayjs())

	const [entryNumber, setEntryNumber] = useState(() =>
		reverseData ? `REV-${reverseData.entryNumber}` : '',
	)
	const [description, setDescription] = useState(() =>
		reverseData
			? t('journal.reversalDescription', {
					entryNumber: reverseData.entryNumber,
					description: reverseData.description,
				})
			: '',
	)

	const [lines, setLines] = useState<LineRow[]>(() => {
		if (reverseData?.lines && reverseData.lines.length > 0) {
			return reverseData.lines.map((line: ReverseJournalLinePayload) => ({
				id: crypto.randomUUID(),
				accountId: line.accountId,
				// Swap debit and credit:
				debit: line.credit || '',
				credit: line.debit || '',
				description: `Reversal: ${line.description}`,
			}))
		}
		return [
			{ id: '1', accountId: '', debit: '', credit: '', description: '' },
			{ id: '2', accountId: '', debit: '', credit: '', description: '' },
		]
	})

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const [accounts, setAccounts] = useState<Account[]>([])

	useEffect(() => {
		const main = async () => {
			try {
				const activeAccounts = await AccountFindOptionsApi()
				setAccounts(activeAccounts)
			} catch (error) {
				console.error('Failed to load accounts for dropdown:', error)
			}
		}

		main().catch((error: unknown) => console.error('JournalEntryCreate load error', error))
	}, [])

	const handleAddLine = () => {
		setLines(prev => [
			...prev,
			{ id: crypto.randomUUID(), accountId: '', debit: '', credit: '', description: '' },
		])
	}

	const handleRemoveLine = (index: number) => {
		if (lines.length <= 2) return

		setLines(prev => prev.filter((_, i) => i !== index))
	}

	const handleLineChange = (index: number, field: keyof LineRow, value: string) => {
		setLines(prev => {
			const updated = [...prev]
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			updated[index] = { ...updated[index]!, [field]: value }

			// Mutual exclusion: if debit is entered, clear credit and vice versa
			if (field === 'debit' && value) updated[index].credit = ''
			if (field === 'credit' && value) updated[index].debit = ''

			return updated
		})
	}

	// Calculate live totals using Decimal to avoid float bugs
	const totalDebit = useMemo(
		() => lines.reduce((acc, l) => acc.plus(l.debit || 0), new Decimal(0)),
		[lines],
	)
	const totalCredit = useMemo(
		() => lines.reduce((acc, l) => acc.plus(l.credit || 0), new Decimal(0)),
		[lines],
	)
	const isBalanced = useMemo(
		() => totalDebit.equals(totalCredit) && totalDebit.greaterThan(0),
		[totalDebit, totalCredit],
	)

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			startTransition(async () => {
				try {
					await JournalEntryCreateApi({
						date: date.valueOf(),
						description,
						entryNumber,
						lines: lines.map(line => ({
							accountId: line.accountId,
							debit: line.debit || '0',
							credit: line.credit || '0',
							description: line.description,
						})),
					})

					await Navigate('../')
				} catch (thrownError) {
					SetErrorText(HandleApiError(thrownError))
				}
			})
		},
		[Navigate, lines, date, description, entryNumber],
	)

	const canSubmit = useMemo(
		() =>
			!isBalanced ||
			lines.some(l => (l.debit === '' && l.credit === '') || l.accountId === ''),
		[isBalanced, lines],
	)

	return (
		<PageContainer title={t('journal.new.title')}>
			<Box
				component='form'
				noValidate
				onSubmit={OnSubmit}
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				{ErrorText !== null ? (
					<Alert severity='error' sx={{ width: '100%', whiteSpace: 'pre-line' }}>
						{ErrorText}
					</Alert>
				) : null}
				<FormControl fullWidth>
					<TextField
						value={entryNumber}
						onChange={event => setEntryNumber(event.target.value)}
						label={t('journal.entryNumber')}
						variant='outlined'
						required
					/>
				</FormControl>
				<FormControl fullWidth>
					<DateTimePicker
						label={t('journal.date')}
						value={date}
						onChange={newValue => newValue && setDate(newValue)}
						ampm={false}
					/>
				</FormControl>
				<FormControl fullWidth>
					<TextField
						value={description}
						onChange={event => setDescription(event.target.value)}
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
							{lines.map((line, index) => (
								<TableRow key={line.id}>
									<TableCell>
										<Select
											fullWidth
											size='small'
											displayEmpty
											value={line.accountId}
											onChange={e =>
												handleLineChange(index, 'accountId', e.target.value)
											}
										>
											<MenuItem value='' disabled>
												<em> {t('journal.selectAccount')}</em>
											</MenuItem>
											{accounts.map(acc => (
												<MenuItem key={acc.id} value={acc.id}>
													{acc.code} - {acc.name}
												</MenuItem>
											))}
										</Select>
									</TableCell>

									<TableCell>
										<TextField
											fullWidth
											size='small'
											placeholder={t('journal.description')}
											value={line.description}
											onChange={e =>
												handleLineChange(
													index,
													'description',
													e.target.value,
												)
											}
										/>
									</TableCell>

									<TableCell align='right'>
										<MuiMoneyInput
											size='small'
											placeholder='0.00'
											value={line.debit}
											onChange={val => handleLineChange(index, 'debit', val)}
										/>
									</TableCell>

									<TableCell align='right'>
										<MuiMoneyInput
											size='small'
											placeholder='0.00'
											value={line.credit}
											onChange={val => handleLineChange(index, 'credit', val)}
										/>
									</TableCell>

									<TableCell align='center'>
										<IconButton
											size='small'
											disabled={lines.length <= 2}
											onClick={() => handleRemoveLine(index)}
										>
											<DeleteOutlinedIcon fontSize='small' />
										</IconButton>
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

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Button
						startIcon={<AddIcon />}
						variant='outlined'
						size='small'
						onClick={handleAddLine}
					>
						{t('journal.addLine')}
					</Button>

					<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
						{isBalanced ? (
							<Chip label='Balanced' color='success' size='small' />
						) : (
							<Chip
								label={`Out of Balance: ${totalDebit.minus(totalCredit).abs().toString()}`}
								color='error'
								size='small'
							/>
						)}
					</Box>
				</Box>

				<Button
					type='submit'
					variant='outlined'
					fullWidth
					loading={isPending}
					disabled={canSubmit}
				>
					{t('common.submit')}
				</Button>
			</Box>
		</PageContainer>
	)
}

export default NewJournalEntry

export { NewJournalEntry as Component }
