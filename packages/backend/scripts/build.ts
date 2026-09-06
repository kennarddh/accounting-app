import * as esbuild from 'esbuild'

import esbuildOptions from './esbuildOptions'

const result = await esbuild.build(esbuildOptions)

console.log(result)
