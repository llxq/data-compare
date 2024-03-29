import dataCompare from './src'
import { updateConfig as baseUpdateConfig } from './src/utils/config'
// methods
export const createCompareNode = dataCompare.createCompareNode.bind(dataCompare)
export const speedCreateCompareNode = dataCompare.speedCreateCompareNode.bind(dataCompare)
export const diffCompareTree = dataCompare.diffCompareTree.bind(dataCompare)
export const diffStatus = dataCompare.diffStatus.bind(dataCompare)
export const speedDiffStatus = dataCompare.speedDiffStatus.bind(dataCompare)
export const diffAttr = dataCompare.diffAttr.bind(dataCompare)
export const shallowDiffAttr = dataCompare.shallowDiffAttr.bind(dataCompare)
export const parse = dataCompare.parse.bind(dataCompare)

// cycle
export const cycle = dataCompare.cycle

export * from './src/utils/Cycle'

// config
export const updateConfig = baseUpdateConfig

// all
export default dataCompare
