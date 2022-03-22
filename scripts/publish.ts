import packageJson from '../package.json'
import { resolve } from 'path'

const preVersion = packageJson.version
const packageJsonFile = resolve(__dirname, '../package.json')
