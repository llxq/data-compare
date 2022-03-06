import { CompareData, CompareDataAttr, CompareTree, Cycle, CycleCallback, CycleType } from '../types'
import { each } from './object'

const cycleStacks: Cycle = {}

const initCycle = (cycleType: CycleType): Array<CycleCallback> => {
    if (Reflect.has(cycleStacks, cycleType)) {
        return cycleStacks[cycleType]!
    }
    const stacks: Array<CycleCallback> = []
    Reflect.set(cycleStacks, cycleType, stacks)
    return stacks
}

/**
 * 在创建节点之前会被调用
 * @param callback 回调
 */
export const beforeCreateCompareNode = <T extends CompareDataAttr = CompareData>(callback: (data: CompareTree<T>) => void): void => {
    initCycle('beforeCreateCompareNode').push(callback)
}

export const runCycle = (cycleType: CycleType, ...args: CompareTree[]): void => {
    each(cycleStacks[cycleType] ?? [], callback => { callback(...args) })
}

export default {
    beforeCreateCompareNode
}
