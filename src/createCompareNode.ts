import { CompareData, CompareDataAttr, CompareStatusEnum, CompareTree, CreateCompareTreeProps } from './types'
import { runCycle } from './utils/cycle'

let uid = 0

/**
 * 创建一个对比树节点
 * @param data
 * @param parent
 * @param isClone 是否为克隆节点，如果是克隆节点不经过 beforeCreateCompareTree 处理
 */
export const createCompareNode = <T extends CompareDataAttr = CompareData>(data: CreateCompareTreeProps<T>, parent?: CompareTree<T>, isClone = false): CompareTree<T> => {
    const target = data.target ?? data.compareData as Required<T> ?? undefined
    const newNode = {
        id: ++uid,
        name: data.name ?? data.compareData.name ?? '未命名',
        // 将数据类型去除掉，因为需要去除其中的 get 不可枚举属性
        compareData: Object.assign({}, data.compareData),
        target,
        status: data.status ?? {
            // 默认状态为 none
            type: CompareStatusEnum.None
        },
        changeInfo: data.changeInfo ?? undefined,
        childrenChangeInfo: data.childrenChangeInfo ?? undefined,
        children: (data.children ?? []) as Array<CompareTree<T>>,
        parent: parent ?? data.parent as UndefinedAble<CompareTree<T>>
    }
    
    !isClone && runCycle('beforeCreateCompareNode', newNode)

    return newNode
}
