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
// parse
program.parse()

// 发布执行 npm。使用pnpm传递参数暂时不能传递
const writeVersion = program.opts().versions

if (writeVersion) {
    newVersion = writeVersion
}

console.log('The current package version is', newVersion)

shell.sed('-i', `"version": "${ preVersion }"`, `"version": "${ newVersion }"`, resolvePackageJson)

// default async is fase
shell.exec('pnpm i')

// build
shell.exec('rollup --config rollup.config.ts --configPlugin @rollup/plugin-typescript')

// generate .d.ts and update export
const typesPath = './dist/index.d.ts'
shell.cp('-r', './index.d.ts', typesPath)
const typesStr = readFileSync(typesPath, 'utf-8')
writeFileSync(typesPath, typesStr.replace(/declare/g, 'export declare'), { encoding: 'utf-8' })
