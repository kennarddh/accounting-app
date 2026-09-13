import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import CreateJournalEntry from './Controllers/CreateJournalEntry'
import FindJournalEntryById from './Controllers/FindJournalEntryById'
import FindManyJournalEntries from './Controllers/FindManyJournalEntries'

const JournalRouter = new CelosiaRouter({ strict: true })

JournalRouter.get('/', [new VerifyJWT()], new FindManyJournalEntries())
JournalRouter.post('/', [new VerifyJWT()], new CreateJournalEntry())
JournalRouter.get('/:id', [new VerifyJWT()], new FindJournalEntryById())

export default JournalRouter
