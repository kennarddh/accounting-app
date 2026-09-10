import { FC, SubmitEvent, useCallback, useEffect, useState, useTransition } from 'react'

import { useNavigate } from 'react-router'

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

import { ApiErrorKind, ApiErrorResource } from '@accounting-app/common'
import dayjs, { Dayjs } from 'dayjs'
import Decimal from 'decimal.js'
import { useTranslation } from 'react-i18next'

import { MuiMoneyInput } from 'Components/MuiMoneyInput'
import PageContainer from 'Components/PageContainer'

import HandleApiError from 'Utils/HandleApiError'

import AccountFindManyApi from 'Api/Account/AccountFindManyApi'
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

const NewJournalEntry: FC = () => {
	const [ErrorText, SetErrorText] = useState<string | null>(null)

	const [entryNumber, setEntryNumber] = useState('')
	const [date, setDate] = useState<Dayjs>(dayjs())
	const [description, setDescription] = useState('')

	const [isPending, startTransition] = useTransition()

	const Navigate = useNavigate()

	const { t } = useTranslation()

	const [lines, setLines] = useState<LineRow[]>([
		{ id: '1', accountId: '', debit: '', credit: '', description: '' },
		{ id: '2', accountId: '', debit: '', credit: '', description: '' },
	])

	const [accounts, setAccounts] = useState<Account[]>([])

	useEffect(() => {
		const main = async () => {
			// TODO: Replace with search and limit for > 100 accounts autocomplete with dynamic content
			const accounts = await AccountFindManyApi({ pagination: { limit: 100 } })

			setAccounts(
				accounts.list.map(account => ({
					id: account.id,
					code: account.code,
					name: account.name,
				})),
			)
		}

		main()
	}, [])

	const handleAddLine = () => {
		setLines(prev => [
			...prev,
			{ id: Math.random().toString(), accountId: '', debit: '', credit: '', description: '' },
		])
	}

	const handleRemoveLine = (index: number) => {
		if (lines.length <= 2) return

		setLines(prev => prev.filter((_, i) => i !== index))
	}

	const handleLineChange = (index: number, field: keyof LineRow, value: string) => {
		setLines(prev => {
			const updated = [...prev]
			updated[index] = { ...(updated[index] as LineRow), [field]: value }

			// Mutual exclusion: if debit is entered, clear credit and vice versa
			if (field === 'debit' && value && updated[index]) updated[index].credit = ''
			if (field === 'credit' && value && updated[index]) updated[index].debit = ''

			return updated
		})
	}

	// Calculate live totals using Decimal to avoid float bugs
	const totalDebit = lines.reduce((acc, l) => acc.plus(l.debit || 0), new Decimal(0))
	const totalCredit = lines.reduce((acc, l) => acc.plus(l.credit || 0), new Decimal(0))
	const isBalanced = totalDebit.equals(totalCredit) && totalDebit.greaterThan(0)

	const OnSubmit = useCallback(
		(event: SubmitEvent<HTMLFormElement>) => {
			event.preventDefault()

			if (!isBalanced) return SetErrorText(t('journal.errors.unbalanced'))
			if (lines.some(l => (l.debit === '' && l.credit === '') || l.accountId === ''))
				return SetErrorText(t('journal.errors.incomplete'))

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
					SetErrorText(
						await HandleApiError(thrownError, async error => {
							if (error.resource === ApiErrorResource.JournalEntry) {
								if (error.kind === ApiErrorKind.Invalid) {
									return t('journal.errors.invalid')
								} else if (error.kind === ApiErrorKind.Taken) {
									return t('journal.errors.entryNumberTaken')
								}
							} else if (error.resource === ApiErrorResource.Account) {
								if (error.kind === ApiErrorKind.NotFound) {
									return t('accounts.errors.notFound')
								} else if (error.kind === ApiErrorKind.Disabled) {
									return t('accounts.errors.disabled')
								}
							}
						}),
					)
				}
			})
		},
		[Navigate, t, lines, date, description, isBalanced, entryNumber],
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
						onChange={newValue => setDate(newValue as Dayjs)}
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
											placeholder='Description'
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
					disabled={!isBalanced}
				>
					{t('common.submit')}
				</Button>
			</Box>
		</PageContainer>
	)
}

export default NewJournalEntry

export { NewJournalEntry as Component }
