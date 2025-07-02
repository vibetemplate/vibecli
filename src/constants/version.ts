import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)
// Resolve package.json two levels up from dist/constants directory after build
const pkg = require(path.resolve(__dirname, '../../package.json'))

export const VIBECLI_VERSION: string = pkg.version as string 