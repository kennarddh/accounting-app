import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import CreateCategory from './Controllers/CreateCategory'
import DisableCategory from './Controllers/DisableCategory'
import EnableCategory from './Controllers/EnableCategory'
import FindCategoryById from './Controllers/FindCategoryById'
import FindManyCategories from './Controllers/FindManyCategories'
import UpdateCategory from './Controllers/UpdateCategory'

const CategoryRouter = new CelosiaRouter({ strict: true })

CategoryRouter.get('/', [new VerifyJWT()], new FindManyCategories())
CategoryRouter.post('/', [new VerifyJWT()], new CreateCategory())
CategoryRouter.patch('/:id', [new VerifyJWT()], new UpdateCategory())
CategoryRouter.get('/:id', [new VerifyJWT()], new FindCategoryById())
CategoryRouter.post('/:id/disable', [new VerifyJWT()], new DisableCategory())
CategoryRouter.post('/:id/enable', [new VerifyJWT()], new EnableCategory())

export default CategoryRouter
