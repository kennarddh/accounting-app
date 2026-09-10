import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import { CreateJournalEntry, FindJournalEntryById, FindManyJournalEntries } from './Controllers'

const JournalRouter = new CelosiaRouter({ strict: true })

JournalRouter.get('/', [new VerifyJWT(false)], new FindManyJournalEntries())
JournalRouter.post('/', [new VerifyJWT(false)], new CreateJournalEntry())
JournalRouter.get('/:id', [new VerifyJWT(false)], new FindJournalEntryById())

export default JournalRouter
