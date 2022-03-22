import { isUndefined } from './utils'
import { each } from './utils/object'
import { cloneDeep } from './lodash'
import { createCompareNode, cycle, diffAttr } from '../main'
import { getSomeValue } from './utils/config'


const setChangeStatus = (source: CompareTree, changeInfo: ChangeCompareInfo): void => {
    source.changeInfo = changeInfo

    // 如果状态为 None，则修改为 Change
    if (source.status.type === CompareStatusEnum.None) {
        source.status.type = CompareStatusEnum.Change
    }
}

/**
 * 创建 id => index 缓存
 * @param start
 * @param end
 * @param source
 */
export const createIdxCache = (start: number, end: number, source: CompareTree[]): Map<number, number> => {
    const idMap: Map<number, number> = new Map()
    for (; start < end; ++start) {
        const id = getSomeValue(source[start])
        if (!isUndefined(id)) idMap.set(id, start)
    }
    return idMap
}

/**
 * 通过对比数据的id对比是否相同节点，如果相同则进行进一步的对比
 * @param origin
 * @param target
 */
const sameNode = (origin: CompareTree, target: CompareTree): boolean => getSomeValue(origin) === getSomeValue(target)

/**
 * 创建被删除的节点
 * @param compareTree
 * @param parent
 */
const createDeleteNode = <T extends CompareDataAttr = CompareData> (compareTree: CompareTree<T>, parent?: CompareTree<T>): CompareTree<T> => {

    const diffDeleteChildren = (compareTree: CompareTree, resultChildren: CompareTree[] = []): CompareTree[] => {
        compareTree.children && each(compareTree.children, children => resultChildren.push(createDeleteNode(children, compareTree)))
        return resultChildren
    }

    return createCompareNode({
        name: compareTree.name,
        icon: compareTree.icon,
        treeType: compareTree.treeType,
        // 为了避免影响到基础数据，这里直接深度克隆一份
        compareData: cloneDeep(compareTree.compareData),
        checkUnEnable: compareTree.checkUnEnable,
        status: {
            type: CompareStatusEnum.Delete
        },
        children: diffDeleteChildren(compareTree),
        // XXX 后续优化
        target: cloneDeep(compareTree.target)
    }, parent, true)
}

/**
 * 修改当前节点以及子节点状态
 * @param compareTree
 * @param statusType
 */
export const updateStatus = (compareTree: CompareTree, statusType: CompareStatusEnum): CompareTree => {
    compareTree.status = {
        type: statusType
    }
    if (compareTree.children) {
        each(compareTree.children, children => updateStatus(children, statusType))
    }
    return compareTree
}

/**
 * 根据子节点的状态获取当前节点的状态。需要处理当前节点的子节点的 changeInfo
 * @param compareTree
 * @param currentStatus
 * @param children
 */
const parseStatus = (compareTree: CompareTree, currentStatus: AttrCompareStatus, children: CompareTree[]): void => {
    if (children.length) {
        let isUpdate = false
        const childrenChangeInfo: ChildrenChangeCompareInfo = {}
        each(children, childrenItem => {
            const { status: { type }, changeInfo } = childrenItem
            if (!isUpdate && type !== CompareStatusEnum.None) {
                isUpdate = true
            }

            // 维护子节点跟换位置信息状态
            if (changeInfo) {
                // 收集子节点对应的信息
                Reflect.set(childrenChangeInfo, getSomeValue(childrenItem), changeInfo)
            }
        })
        // 如果状态不全等等于 None 就是 update
        if (isUpdate && currentStatus.type === CompareStatusEnum.None) {
            currentStatus.type = CompareStatusEnum.Update
        }

        if (Reflect.ownKeys(childrenChangeInfo).length) {
            compareTree.childrenChangeInfo = childrenChangeInfo
        }
    }
    compareTree.status = currentStatus
}

/**
 * 使用diff算法对比两个节点。 XXX 注意这里直接是修改了 origin 源对象的
 * @param origin new
 * @param target old
 * @param parent origin 对象的 parent （new parent）
 */
export const diffCompareTreeUtil = <T extends CompareDataAttr = CompareData> (origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>): CompareTree<T>[] => {
    // run cycle
    cycle.addCycle('beforeCompare', origin, target, parent)

    // 开始比较之前先校验
    if (!origin && !target || (!origin.length && !target.length)) {
        return []
    } else if (origin.length && !target.length) {
        // 全部都是新增的
        each(origin, item => updateStatus(item, CompareStatusEnum.Create))
        cycle.addCycle('afterCompare', origin, target, parent)
        return origin
    } else if (!origin.length && target.length) {
        const newOrigin = origin ? origin : []
        // 全部都是删除的
        each(target, children => {
            newOrigin.push(createDeleteNode<T>(children, parent))
        })
        cycle.addCycle('afterCompare', newOrigin, target, parent)
        return newOrigin
    }

    // 因为target数据传递过来不能直接修改，所以增加过滤的id列表
    const filterIds = new Set<number>()

    let startOriginIdx = 0,
        startOrigin = origin[0],
        endOriginIdx = origin.length - 1,
        endOrigin = origin[origin.length - 1]

    let startTargetIdx = 0,
        startTarget = target[0],
        endTargetIdx = target.length - 1,
        endTarget = target[target.length - 1]

    let cacheIdMap: UndefinedAble<Map<number, number>> = undefined

    while (startOriginIdx <= endOriginIdx && startTargetIdx <= endTargetIdx) {
        if (isUndefined(startOrigin)) {
            startOrigin = origin[++startOriginIdx]
        } else if (isUndefined(endOrigin)) {
            endOrigin = origin[--endOriginIdx]
        } else if (isUndefined(startTarget) || filterIds.has(getSomeValue(startTarget))) {
            startTarget = target[++startTargetIdx]
        } else if (isUndefined(endTarget) || filterIds.has(getSomeValue(endTarget))) {
            endTarget = target[--endTargetIdx]
        } else if (sameNode(startOrigin, startTarget)) {
            // 对比子节点
            const newChildren = diffCompareTreeUtil(startOrigin.children, startTarget.children, startOrigin)
            // 处理节点状态信息
            parseStatus(startOrigin, diffAttr(startOrigin.compareData, startTarget.compareData), newChildren)
            startOrigin = origin[++startOriginIdx]
            startTarget = target[++startTargetIdx]
        } else if (sameNode(endOrigin, endTarget)) {
            const newChildren = diffCompareTreeUtil(endOrigin.children, endTarget.children, endOrigin)
            parseStatus(endOrigin, diffAttr(endOrigin.compareData, endTarget.compareData), newChildren)
            endOrigin = origin[--endOriginIdx]
            endTarget = target[--endTargetIdx]
        } else if (sameNode(endOrigin, startTarget)) {
            const newChildren = diffCompareTreeUtil(endOrigin.children, startTarget.children, endOrigin)
            parseStatus(endOrigin, diffAttr(endOrigin.compareData, startTarget.compareData), newChildren)
            // 存储位置更换的信息
            setChangeStatus(endOrigin, { from: startTargetIdx, to: endOriginIdx })
            endOrigin = origin[--endOriginIdx]
            startTarget = target[++startTargetIdx]
        } else if (sameNode(startOrigin, endTarget)) {
            const newChildren = diffCompareTreeUtil(startOrigin.children, endTarget.children, startOrigin)
            parseStatus(startOrigin, diffAttr(startOrigin.compareData, endTarget.compareData), newChildren)
            setChangeStatus(endOrigin, { from: endTargetIdx, to: startOriginIdx })
            startOrigin = origin[++startOriginIdx]
            endTarget = target[--endTargetIdx]
        } else {
            if (!cacheIdMap?.size) {
                cacheIdMap = createIdxCache(startTargetIdx, endTargetIdx, target)
            }
            const findIdx = cacheIdMap.get(getSomeValue(startOrigin))
            if (!isUndefined(findIdx)) {
                const newChildren = diffCompareTreeUtil(startOrigin.children, target[findIdx].children, startOrigin)
                parseStatus(startOrigin, diffAttr(startOrigin.compareData, target[findIdx].compareData), newChildren)
                setChangeStatus(startOrigin, { from: findIdx, to: startOriginIdx })
                filterIds.add(getSomeValue(target[findIdx]))
            } else {
                // 设置状态表示为新增
                updateStatus(startOrigin, CompareStatusEnum.Create)
            }
            startOrigin = origin[++startOriginIdx]
        }
    }

    // target遍历完成，代表有新增的
    if (startOriginIdx <= endOriginIdx) {
        // 将状态修改为新增
        for (; startOriginIdx <= endOriginIdx; ++startOriginIdx) updateStatus(origin[startOriginIdx], CompareStatusEnum.Create)
    }

    // origin遍历完成，代表有删除的
    if (startTargetIdx <= endTargetIdx) {
        // 表示还有删除的
        for (; startTargetIdx <= endTargetIdx; startTargetIdx++) {
            const item = target[startTargetIdx]
            if (!filterIds.has(getSomeValue(item))) {
                origin.splice(startTargetIdx, 0, createDeleteNode(item, origin[0]?.parent))
            }
        }
    }
    cacheIdMap?.clear()
    cycle.addCycle('afterCompare', origin, target, parent)
    return origin
}
