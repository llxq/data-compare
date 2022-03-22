import { CompareStatusEnum } from './type'
import { isArray, isUndefined } from './utils'
import { each } from './utils/object'


const updateStatus = (key: string | number, value: AttrCompareStatus, status: AttrCompareStatus): void => {
    if (!Reflect.has(status, 'attrStatus')) {
        Reflect.set(status, 'attrStatus', {})
    }
    // 添加状态
    Reflect.set(status.attrStatus!, key, value)
}

/**
 * 根据属性状态修改status.type
 * @param status
 */
const updateStatusTypeByAttr = (status: AttrCompareStatus): AttrCompareStatus => {
    let type = status.type
    if (status.attrStatus) {
        // 如果全子节点状态一致，则是同种状态，如果状态不一致，那就是 update
        const keys = Object.keys(status.attrStatus)
        if (!keys.some(it => status.attrStatus![it] === status.attrStatus![0])) {
            type = CompareStatusEnum.Update
        }
    }
    status.type = type
    return status
}

/**
 * 建立 key 于 索引的缓存
 * @param start
 * @param end
 * @param source
 */
const createIdxCache = (start: number, end: number, source: string[]): Map<string, number> => {
    const map: Map<string, number> = new Map()
    for (; start < end; ++start) {
        Reflect.has(source, start) && map.set(source[start], start)
    }
    return map
}

/**
 * 获取两个值对比之后的状态
 * @param originKey
 * @param targetKey
 * @param origin
 * @param target
 * @param pathStacks
 */
const sameValue = <T extends Record<string, unknown>> (originKey: string, targetKey: string, origin: T, target: T, pathStacks: string[] = []): UndefinedAble<AttrCompareStatus> => {
    const originValue = Reflect.get(origin, originKey)
    const targetValue = Reflect.get(target, targetKey)
    if (originValue !== targetValue) {
        const status: AttrCompareStatus = {
            type: CompareStatusEnum.None,
            path: pathStacks.join('.'),
            oldValue: targetValue
        }
        if (typeof originValue === 'object' && typeof targetValue === 'object') {
            // 递归去比较子节点属性的状态
            const { attrStatus, type } = diffAttrUtil(originValue, targetValue, pathStacks.slice())
            if (attrStatus) {
                if (!Reflect.has(status, 'attrStatus')) {
                    Reflect.set(status, 'attrStatus', {})
                }
                Object.assign(status.attrStatus, attrStatus)
                if (isArray(originValue) && isArray(targetValue)) {
                    status.type = type
                }
            } else {
                return undefined
            }
        } else {
            status.type = CompareStatusEnum.Update
        }
        return updateStatusTypeByAttr(status)
    }
}

/**
 * 对象的属性对比
 * @param origin
 * @param target
 * @param pathStacks
 */
const diffObjAttr = (origin: Record<string, unknown>, target: Record<string, unknown>, pathStacks: string[] = []): AttrCompareStatus => {
    // Reflect.ownKeys 会拿到 get 属性的值
    const originKeys: string[] = Object.keys(origin)
    const targetKeys: string[] = Object.keys(target)

    const status: AttrCompareStatus = {
        type: CompareStatusEnum.None,
        path: pathStacks.join('.')
    }

    const getPath = (key: string): string => pathStacks.concat([key]).join('.')

    if (!originKeys.length && !targetKeys.length) {
        return status
    } else if (originKeys.length && !targetKeys.length) {
        // 都是新增
        status.type = CompareStatusEnum.Update
        each(originKeys, item => updateStatus(item, {
            type: CompareStatusEnum.Create,
            path: getPath(item)
        }, status))
        return status
    } else if (!originKeys.length && targetKeys.length) {
        // 都是删除
        status.type = CompareStatusEnum.Update
        each(targetKeys, item => updateStatus(item, {
            type: CompareStatusEnum.Delete,
            path: getPath(item)
        }, status))
        return status
    }

    const filterIdx = new Set()

    let startOriginKeyIdx = 0,
        startOriginKey = originKeys[0],
        endOriginKeyIdx = originKeys.length - 1,
        endOriginKey = originKeys[originKeys.length - 1]

    let startTargetKeyIdx = 0,
        startTargetKey = targetKeys[0],
        endTargetKeyIdx = targetKeys.length - 1,
        endTargetKey = targetKeys[targetKeys.length - 1]

    let cacheIdMap: UndefinedAble<Map<string, number>>

    /**
     * 比较两个key是否相等
     * @param originKey
     * @param targetKey
     */
    const sameKey = (originKey: string, targetKey: string): boolean => originKey === targetKey

    /**
     * 对比key，设置状态
     * @param originKey
     * @param targetKey
     */
    const compare = (originKey: string, targetKey: string): void => {
        // 获取两个状态
        const _status = sameValue(originKey, targetKey, origin, target, pathStacks.concat([originKey]))
        _status && updateStatus(originKey, _status, status)
    }

    while (startOriginKeyIdx <= endOriginKeyIdx && startTargetKeyIdx <= endTargetKeyIdx) {
        // 说明当前是查找过后的。直接跳过
        if (filterIdx.has(startTargetKey)) {
            startTargetKey = targetKeys[++startTargetKeyIdx]
        } else if (filterIdx.has(endTargetKey)) {
            endTargetKey = targetKeys[--endTargetKeyIdx]
        } else if (sameKey(startOriginKey, startTargetKey)) {
            compare(startOriginKey, startTargetKey)
            startOriginKey = originKeys[++startOriginKeyIdx]
            startTargetKey = targetKeys[++startTargetKeyIdx]
        } else if (sameKey(endOriginKey, endTargetKey)) {
            compare(endOriginKey, endTargetKey)
            endOriginKey = originKeys[--endOriginKeyIdx]
            endTargetKey = targetKeys[--endTargetKeyIdx]
        } else if (sameKey(endOriginKey, startTargetKey)) {
            compare(endOriginKey, startTargetKey)
            endOriginKey = originKeys[--endOriginKeyIdx]
            startTargetKey = targetKeys[++startTargetKeyIdx]
        } else if (sameKey(startOriginKey, endTargetKey)) {
            compare(startOriginKey, endTargetKey)
            startOriginKey = originKeys[++startOriginKeyIdx]
            endTargetKey = targetKeys[--endTargetKeyIdx]
        } else {
            if (!cacheIdMap) {
                cacheIdMap = createIdxCache(startTargetKeyIdx, endTargetKeyIdx, targetKeys)
            }
            const findIdx = cacheIdMap.get(startOriginKey)
            // 表示找到了
            if (!isUndefined(findIdx)) {
                // 进行对比。如果对比结果没有，则代表只是换了位置并没有更新值
                compare(startOriginKey, targetKeys[findIdx])
                // 添加过滤
                filterIdx.add(startOriginKey)
            } else {
                // 找不到表示为新增
                updateStatus(startOriginKey, { type: CompareStatusEnum.Create, path: getPath(startOriginKey) }, status)
            }
            startOriginKey = originKeys[++startOriginKeyIdx]
        }
    }

    // target 遍历完成了。剩下的都是新增的
    if (startOriginKeyIdx <= endOriginKeyIdx) {
        for (; startOriginKeyIdx <= endOriginKeyIdx; ++startOriginKeyIdx) updateStatus(originKeys[startOriginKeyIdx], {
            type: CompareStatusEnum.Create,
            path: getPath(originKeys[startOriginKeyIdx])
        }, status)
    }

    // origin 遍历完成了。剩下的都是删除的
    if (startTargetKeyIdx <= endTargetKeyIdx) {
        for (; startTargetKeyIdx <= endTargetKeyIdx; ++startTargetKeyIdx) updateStatus(targetKeys[startTargetKeyIdx], {
            type: CompareStatusEnum.Delete,
            path: getPath(targetKeys[startTargetKeyIdx])
        }, status)
    }

    return updateStatusTypeByAttr(status)
}

/**
 * 数组的属性对比。数组的每一项使用 diffAttr 对比
 * @param origin
 * @param target
 * @param pathStacks
 */
const diffArrayAttr = (origin: Array<any>, target: Array<any>, pathStacks: string[] = []): AttrCompareStatus => {
    const status: AttrCompareStatus = {
        type: CompareStatusEnum.None,
        path: pathStacks.join('.')
    }

    const getPath = (key: number): string => pathStacks.concat([key.toString()]).join('.')

    if (!origin?.length && !target?.length) {
        return status
    } else if (origin.length && !target?.length) {
        // 都是新增
        status.type = CompareStatusEnum.Update
        each(origin, (item, index) => updateStatus(index, {
            type: CompareStatusEnum.Create,
            path: getPath(index)
        }, status))
        return status
    } else if (!origin.length && target.length) {
        // 都是删除
        status.type = CompareStatusEnum.Update
        each(target, (item, index) => updateStatus(index, {
            type: CompareStatusEnum.Delete,
            path: getPath(index)
        }, status))
        return status
    }

    let startOriginIdx = 0,
        startOrigin = origin[0]
    const endOriginIdx = origin.length - 1

    let startTargetIdx = 0,
        startTarget = target[0]
    const endTargetIdx = target.length - 1

    while (startOriginIdx <= endOriginIdx && startTargetIdx <= endTargetIdx) {
        const currentStatus = diffAttrUtil(startOrigin, startTarget, pathStacks.slice().concat([`${ startOriginIdx }`]))
        // 如果两个相同的话
        if (currentStatus.type === CompareStatusEnum.Update || currentStatus.attrStatus) {
            updateStatus(startTargetIdx, currentStatus, status)
        }
        startOrigin = origin[++startOriginIdx]
        startTarget = target[++startTargetIdx]
    }

    // target遍历完成，代表有新增的
    if (startOriginIdx <= endOriginIdx) {
        for (; startOriginIdx <= endOriginIdx; ++startOriginIdx) updateStatus(startOriginIdx, {
            type: CompareStatusEnum.Create,
            path: getPath(startOriginIdx)
        }, status)
    }

    // origin遍历完成，代表有删除的
    if (startTargetIdx <= endTargetIdx) {
        // 这里代表着是修改的
        for (; startTargetIdx <= endTargetIdx; ++startTargetIdx) updateStatus(startTargetIdx, {
            type: CompareStatusEnum.Delete,
            path: getPath(startTargetIdx)
        }, status)
    }

    return updateStatusTypeByAttr(status)
}

/**
 * 属性对比，因为需要获取更换位置状态，所以需要区分数组/对象的对比。。
 * @param origin new
 * @param target old
 * @param pathStacks
 */
export const diffAttrUtil = (origin: unknown, target: unknown, pathStacks: string[] = []): AttrCompareStatus => {
    if (typeof origin === 'object' && typeof target === 'object') {
        if (isArray(origin) && isArray(target)) {
            return diffArrayAttr(origin, target, pathStacks)
        }
        return diffObjAttr(origin as Record<string, unknown>, target as Record<string, unknown>, pathStacks)
    } else {
        // 删除
        if (!isUndefined(origin) && isUndefined(target)) {
            return {
                type: CompareStatusEnum.Delete
            }
        } else if (isUndefined(origin) && !isUndefined(target)) { // 新增
            return {
                type: CompareStatusEnum.Create
            }
        }
        return {
            type: origin === target ? CompareStatusEnum.None : CompareStatusEnum.Update
        }
    }
}
