import { defineConfig } from 'rollup'
import packageJson from './package.json'
import { join, resolve } from 'path'
import ts from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import resolvePlugin from '@rollup/plugin-node-resolve'

export default defineConfig({
    input: 'main.ts',
    output: [
        {
            name: packageJson.name,
            file: join('dist', packageJson.publishConfig.main),
            format: 'umd'
        },
        {
            name: packageJson.name,
            file: join('dist', packageJson.publishConfig.module),
            format: 'esm'
        }
    ],
    plugins: [
        ts({
            tsconfig: resolve(__dirname, 'tsconfig.json')
        }),
        commonjs(),
        resolvePlugin({
            extensions: ['.ts', '.json']
        })
    ]
})
