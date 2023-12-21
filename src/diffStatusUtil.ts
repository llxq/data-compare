import { createCompareNode } from '../main'
import { createIdxCache } from './diffCompareTreeUtil'
import { cloneDeep, isEqual } from './lodash'
import { CompareStatusEnum } from './type'
import { isUndefined } from './utils'
import { getConfig, getSomeValue } from './utils/config'
import cycle from './utils/Cycle'
import { each, isEmptyObj } from './utils/object'

/**
 * 设置冲突
 * @param origin
 * @param target
 */
const setConflict = (origin: AttrCompareStatus, target: AttrCompareStatus): void => {
    const oType = origin.type
    const tType = target.type
    if ((oType === tType && (oType === CompareStatusEnum.Update || oType === CompareStatusEnum.Create)) || oType !== tType) {
        // 修改状态
        origin.type = CompareStatusEnum.Conflict
        target.type = CompareStatusEnum.Conflict
    }
}

/**
 * 处理状态，根据属性维护当前状态
 * @param origin
 * @param target
 */
const updateStatus = (origin: AttrCompareStatus, target: AttrCompareStatus): void => {
    if (origin.type === CompareStatusEnum.Create && target.type === CompareStatusEnum.Create) {
        setConflict(origin, target)
        return
    }
    if (!origin?.attrStatus || !target?.attrStatus) return
    const originKeys: string[] = Object.keys(origin.attrStatus ?? {})
    const targetKeys: string[] = Object.keys(target.attrStatus ?? {})
    setConflict(origin, target)
    let index = 0
    while (index <= originKeys.length) {
        const key = originKeys[index]
        const originStatus = origin.attrStatus?.[key] as UndefinedAble<AttrCompareStatus>
        const targetStatus = target.attrStatus?.[key] as UndefinedAble<AttrCompareStatus>
        if (originStatus && targetStatus) {
            // 如果两边都是修改，或者两边状态不一致 则修改为 conflict
            setConflict(originStatus, targetStatus)
            // 如果有子节点，继续走
            if (!isEmptyObj(origin.attrStatus?.[key]?.attrStatus) && !isEmptyObj(target.attrStatus?.[key]?.attrStatus)) {
                updateStatus(origin.attrStatus[key], target.attrStatus[key])
            }
        }
        index++
    }

    // 修改当前状态。如果属性有一个是冲突，那么当前状态就是冲突
    if (originKeys.some(s => origin.attrStatus?.[s].type === CompareStatusEnum.Conflict)) {
        origin.type = CompareStatusEnum.Conflict
    }
    if (targetKeys.some(s => target.attrStatus?.[s].type === CompareStatusEnum.Conflict)) {
        target.type = CompareStatusEnum.Conflict
    }
}

/**
 * 处理两个树节点的状态。两边状态不一致，并且不等于 update（update 需要比较子节点是否有修改同一个属性），那么就是冲突，否则就不是冲突
 * 因为在 diffCompare 中，只要子节点有状态更改，那么父节点状态就会变为 update，所以需要在这恢复为 none
 * @param current
 * @param online
 */
const parseStatus = (current: CompareTree, online: CompareTree): boolean => {
    const { status: { type }, changeInfo } = current
    const {
        status: { type: onlineType },
        changeInfo: onlineChangeInfo
    } = online
    const sameType = type === onlineType && (type === CompareStatusEnum.None || type === CompareStatusEnum.Delete)
    // 两个change状态一致
    const sameChangeInfo = isEqual(changeInfo, onlineChangeInfo)

    // delete or none
    const hasDifference = sameType && (type === CompareStatusEnum.None || type === CompareStatusEnum.Delete) && sameChangeInfo

    if (!hasDifference) {
        // 不一致的话，需要处理状态
        if (!sameType) {
            updateStatus(current.status, online.status)
        }
        if (!sameChangeInfo) {
            // 如果两边都交换了位置，那么当前状态则为冲突
            if (!isEmptyObj(changeInfo) && !isEmptyObj(onlineChangeInfo)) {
                current.status.type = CompareStatusEnum.Conflict
                online.status.type = CompareStatusEnum.Conflict
            }
        }
    }

    const isNoneUpdate = (source: CompareTree): boolean => {
        return source.status.type === CompareStatusEnum.Update &&
            isEmptyObj(source.status.attrStatus) &&
            isEmptyObj(source.changeInfo)
    }

    // 如果两边没有更改，并且状态为 update 则恢复状态即可
    if (isNoneUpdate(current)) {
        current.status.type = CompareStatusEnum.None
    }
    if (isNoneUpdate(online)) {
        online.status.type = CompareStatusEnum.None
    }
    cycle.addCycle('afterCompareStatus', current, online)
    return hasDifference
}

/**
 * clone 一份状态树
 * @param cloneTree
 * @param statusType
 * @param parent
 * @param isOnline 是不是克隆 online
 */
const cloneCompareTree = (cloneTree: CompareTree, statusType: CompareStatusEnum, parent?: CompareTree, isOnline?: boolean): CompareTree => {

    const { someKey } = getConfig()
    cycle.addCycle('beforeCloneCompareTree', cloneTree, statusType, parent)

    const newTreeNode: CompareTree = createCompareNode({
        treeType: cloneTree.treeType,
        name: statusType === CompareStatusEnum.VirtualCreate ? '~' : cloneTree.compareData.name,
        compareData: {
            [someKey]: getSomeValue(cloneTree),
            name: statusType === CompareStatusEnum.VirtualCreate ? '~' : cloneTree.compareData.name
        },
        status: {
            type: statusType
        },
        parent,
        // XXX 后续优化
        target: cloneDeep(cloneTree.target),
        mappingId: cloneTree.id,
        diffChange: cloneTree.diffChange
    })

    newTreeNode.children = cloneTree.children.map(it => cloneCompareTree(it, statusType, newTreeNode, isOnline))

    // 修改映射id
    cloneTree.mappingId = newTreeNode.id

    cycle.addCycle('afterCompareStatus', isOnline ? newTreeNode : cloneTree, isOnline ? cloneTree : newTreeNode)

    return newTreeNode
}

/**
 * 对比两个节点是否为同一个节点
 * @param current
 * @param online
 */
const sameNode = (current: CompareTree, online: CompareTree): boolean => {
    const { someKey } = getConfig()
    return Reflect.get(current.compareData, someKey) === Reflect.get(online.compareData, someKey)
}

/**
 * diff 对比当前两个状态树。处理冲突项，并且修正两个树结构使其结构一致
 * @param current 当前版本对比结果
 * @param online 线上版本对比结果
 * @param currentParent
 * @param onlineParent
 */
export const diffStatusUtil = (current: CompareTree[], online: CompareTree[], currentParent?: CompareTree, onlineParent?: CompareTree): void => {

    cycle.addCycle('beforeDiffStatus', current, online, currentParent, onlineParent)

    if (!current && !online || (!current.length && !online.length)) {
        return
    } else if (current.length && !online.length) {
        // 将 current 克隆一份给 online，节点状态为虚拟新增
        return each(current, children => online.push(cloneCompareTree(children, CompareStatusEnum.VirtualCreate, onlineParent)))
    } else if (!current.length && online.length) {
        // 状态为虚拟新增
        return each(online, children => current.push(cloneCompareTree(children, CompareStatusEnum.VirtualCreate, currentParent, true)))
    }

    let cacheIdMap: UndefinedAble<Map<number, number>> = undefined

    /**
     * 对比两个状态是否一致。如果是相同的状态。并且没有移动状态，则表示当前两个节点都未更改，那么直接删除当前数据。否则的话对比状态
     * @param currentIdx
     * @param onlineIdx
     */
    const compareStatus = (currentIdx: number, onlineIdx: number): boolean => {
        const currentItem = current[currentIdx]
        const onlineItem = online[onlineIdx]
        // 判断当前状态是否更改
        const hasDifference = parseStatus(currentItem, onlineItem)
        if (hasDifference) {
            // 如果相同，删除即可
            current.splice(currentIdx, 1)
            // 删除元素之后需要移动元素
            startCurrent = current[startCurrentIdx]
            endCurrent = current[--endCurrentIdx]

            online.splice(onlineIdx, 1)
            startOnline = online[startOnlineIdx]
            endOnline = online[--endOnlineIdx]

            // 删除之后需要重新维护 map 因为右侧在变
            cacheIdMap = createIdxCache(startOnlineIdx, endOnlineIdx, online)
        } else {
            // 维护相互的id
            currentItem.mappingId = onlineItem.id
            onlineItem.mappingId = currentItem.id
        }
        return hasDifference
    }

    let startCurrentIdx = 0,
        startCurrent = current[0],
        endCurrentIdx = current.length - 1,
        endCurrent = current[current.length - 1]

    let startOnlineIdx = 0,
        startOnline = online[0],
        endOnlineIdx = online.length - 1,
        endOnline = online[online.length - 1]

    const filterIds = new Set()

    const getBeforeIndex = (index: number) => index === 0 ? index : index + 1

    while (startCurrentIdx <= endCurrentIdx && startOnlineIdx <= endOnlineIdx) {
        if (isUndefined(current[startCurrentIdx])) {
            startCurrent = current[++startCurrentIdx]
        } else if (isUndefined(current[endCurrentIdx])) {
            endCurrent = current[--endCurrentIdx]
        } else if (filterIds.has(getSomeValue(startOnline)) || isUndefined(online[startOnlineIdx])) {
            startOnline = online[++startOnlineIdx]
        } else if (filterIds.has(getSomeValue(endOnline)) || isUndefined(online[endOnlineIdx])) {
            endOnline = online[--endOnlineIdx]
        } else if (sameNode(startCurrent, startOnline)) {
            if (!compareStatus(startCurrentIdx, startOnlineIdx)) {
                diffStatusUtil(startCurrent.children, startOnline.children, startCurrent, startOnline)
                startCurrent = current[++startCurrentIdx]
                startOnline = online[++startOnlineIdx]
            }
        } else if (sameNode(endCurrent, endOnline)) {
            if (!compareStatus(endCurrentIdx, endOnlineIdx)) {
                diffStatusUtil(endCurrent.children, endOnline.children, endCurrent, endOnline)
                endCurrent = current[--endCurrentIdx]
                endOnline = online[--endOnlineIdx]
            }
        } else if (sameNode(endCurrent, startOnline)) {
            if (!compareStatus(endCurrentIdx, startOnlineIdx)) {
                diffStatusUtil(endCurrent.children, startOnline.children, endCurrent, startOnline)
                endCurrent = current[--endCurrentIdx]
                startOnline = online[++startOnlineIdx]
            }
        } else if (sameNode(startCurrent, endOnline)) {
            if (!compareStatus(startCurrentIdx, endOnlineIdx)) {
                diffStatusUtil(startCurrent.children, endOnline.children, startCurrent, endOnline)
                startCurrent = current[++startCurrentIdx]
                endOnline = online[--endOnlineIdx]
            }
        } else {
            if (!cacheIdMap?.size) {
                cacheIdMap = createIdxCache(startOnlineIdx, endOnlineIdx, online)
            }
            const findIdx = cacheIdMap?.get(getSomeValue(startCurrent))
            if (!isUndefined(findIdx)) {
                // 说明是跟换了位置信息
                if (!compareStatus(startCurrentIdx, findIdx)) {
                    diffStatusUtil(startCurrent.children, online[findIdx].children, startCurrent, online[findIdx])
                    startCurrent = current[++startCurrentIdx]
                    filterIds.add(getSomeValue(online[findIdx]))
                }
            } else {
                // 说明是新增的节点。需要给 online 增加一个节点到当前 startCurrent 后面，并且移动指针。
                const beforeIdx = getBeforeIndex(startCurrentIdx)
                online.splice(beforeIdx, 0, cloneCompareTree(startCurrent, CompareStatusEnum.VirtualCreate, onlineParent))
                // 增加过滤
                filterIds.add(getSomeValue(startCurrent))
                startCurrent = current[++startCurrentIdx]

                // 插入到开始节点前面，需要让开始节点/结束节点后移
                if (beforeIdx <= startOnlineIdx) {
                    startOnline = online[++startOnlineIdx]
                    endOnline = online[++endOnlineIdx]
                } else if (beforeIdx <= endOnlineIdx && beforeIdx >= startOnlineIdx) {
                    // 代表着插入到中间。只需要结束节点后移即可
                    endOnline = online[++endOnlineIdx]
                }
                // 需要更新缓存
                cacheIdMap = createIdxCache(startOnlineIdx, endOnlineIdx, online)
            }
        }
    }

    // current 处理完成了。online还未处理完成 online 还有新增
    if (startOnlineIdx <= endOnlineIdx) {
        for (; startOnlineIdx <= endOnlineIdx; ++startOnlineIdx) {
            const item = online[startOnlineIdx]
            if (!filterIds.has(getSomeValue(item))) {
                current.splice(startOnlineIdx, 0, cloneCompareTree(item, CompareStatusEnum.VirtualCreate, currentParent, true))
            }
        }
    }

    // online 处理完成。current还有新增
    if (startCurrentIdx <= endCurrentIdx) {
        for (; startCurrentIdx <= endCurrentIdx; ++startCurrentIdx) online.splice(startCurrentIdx, 0, cloneCompareTree(current[startCurrentIdx], CompareStatusEnum.VirtualCreate, onlineParent))
    }

    cacheIdMap?.clear()

    cycle.addCycle('afterDiffStatus', current, online, currentParent, onlineParent)
}
