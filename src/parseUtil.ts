import { speedCreateCompareNode } from '../main'
import { isArray } from './utils'
import { getConfig } from './utils/config'
import { each } from './utils/object'

const getEmptyData = <T extends CompareDataAttr = CompareData> () => speedCreateCompareNode({ id: new Date().valueOf() } as T)

const parseItem = <T extends CompareDataAttr = CompareData> (data: T, parent?: CompareTree<T>): CompareTree<T> => {
    if (!data) return getEmptyData<T>()
    const { childrenKey } = getConfig()
    const keys = Object.keys(data)
    const newData: Partial<T> = {}
    each(keys, key => {
        if (!Reflect.has(newData, key) && key !== childrenKey) {
            Reflect.set(newData, key, Reflect.get(data, key))
        }
    })
    return speedCreateCompareNode<T>(newData as T, parent)
}

const parseChildren = <T extends CompareDataAttr = CompareData> (data: T, parent?: CompareTree<T>): CompareTree<T> => {
    const { childrenKey } = getConfig()
    const currentNode = parseItem(data, parent)
    if (Reflect.has(data, childrenKey)) {
        const childrenTarget = Reflect.get(data, childrenKey)
        if (childrenTarget) {
            if (isArray(childrenTarget)) {
                currentNode.children.concat(childrenTarget.map(m => parseChildren(m, currentNode)).filter(it => !!it) as CompareTree<T>[])
            } else {
                parseChildren(childrenTarget, currentNode)
            }
        }
    }
    parent?.children.push(currentNode)
    return currentNode
}

export function parseUtil<T extends CompareDataAttr = CompareData> (data: T, parent?: CompareTree<T>): CompareTree<T>
export function parseUtil<T extends CompareDataAttr = CompareData> (data: T[], parent?: CompareTree<T>): CompareTree<T>[]
export function parseUtil<T extends CompareDataAttr = CompareData> (data: T[] | T, parent?: CompareTree<T>): CompareTree<T>[] | CompareTree<T> {
    if (isArray(data)) {
        const childrenNodes = data.map(m => parseChildren(m, parent))
        if (childrenNodes) {
            return childrenNodes
        }
        return [getEmptyData<T>()]
    } else {
        const parseData = parseChildren(data, parent)
        if (!parseData) {
            return getEmptyData<T>()
        }
        return parseData
    }
}
