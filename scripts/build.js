const { resolve } = require('path')
// https://github.com/tj/commander.js/
const { program } = require('commander')
// https://github.com/shelljs/shelljs
const shell = require('shelljs')
const { readFileSync, writeFileSync } = require('fs')

const resolvePackageJson = resolve(__dirname, '../package.json')

const packageJson = require(resolvePackageJson)

const preVersion = packageJson.version
const preVersionList = preVersion.split('.')
const [mainVersion, subVersion, phaseVersion] = preVersionList
const defaultVersion = `${mainVersion}.${subVersion}.${Number(phaseVersion) + 1}`

let newVersion = defaultVersion

// add params
program.option('-v, --versions <type>', 'you publish version', defaultVersion)
program.option('-isDev, --isDev <type>', 'you publish dev version', false)
// parse
program.parse()

// 发布执行 npm。使用pnpm传递参数暂时不能传递
const { versions, isDev } = program.opts()
if (isDev === true) {
    if (versions) {
        newVersion = versions
    }
    
    console.log('The current package version is', newVersion)
    
    shell.sed('-i', `"version": "${preVersion}"`, `"version": "${newVersion}"`, resolvePackageJson)
}

// default async is fase
shell.exec('pnpm i')

// delete dist
shell.rm('-rf', './dist')

// build
shell.exec('rollup --config rollup.config.ts --configPlugin @rollup/plugin-typescript')

shell.rm('-rf', './dist/rollup.config.d.ts')
shell.rm('-rf', './dist/index.d.ts')

// generate .d.ts and update export
const typesStr = readFileSync('./typings/index.d.ts', 'utf-8')
const mainTypeStr = readFileSync('./dist/main.d.ts', 'utf-8')
writeFileSync('./dist/index.d.ts', `${ mainTypeStr } \n ${ typesStr }`, { encoding: 'utf-8' })
