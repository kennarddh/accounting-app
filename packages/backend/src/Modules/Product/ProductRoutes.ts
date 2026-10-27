import { CelosiaRouter } from '@celosiajs/core'

import VerifyJWT from 'Middlewares/VerifyJWT'

import CreateProduct from './Controllers/CreateProduct'
import DisableProduct from './Controllers/DisableProduct'
import EnableProduct from './Controllers/EnableProduct'
import FindManyProducts from './Controllers/FindManyProducts'
import FindProductById from './Controllers/FindProductById'
import FindProductLookup from './Controllers/FindProductLookup'
import UpdateProduct from './Controllers/UpdateProduct'

const ProductRouter = new CelosiaRouter({ strict: true })

ProductRouter.get('/', [new VerifyJWT()], new FindManyProducts())
ProductRouter.get('/lookup', [new VerifyJWT()], new FindProductLookup())
ProductRouter.post('/', [new VerifyJWT()], new CreateProduct())
ProductRouter.patch('/:id', [new VerifyJWT()], new UpdateProduct())
ProductRouter.get('/:id', [new VerifyJWT()], new FindProductById())
ProductRouter.post('/:id/disable', [new VerifyJWT()], new DisableProduct())
ProductRouter.post('/:id/enable', [new VerifyJWT()], new EnableProduct())

export default ProductRouter
