// 树节点对比的状态 新增/删除/修改/交换位置/冲突/none/虚拟添加/虚拟删除
export enum CompareStatusEnum {
    Create = 'create',
    Delete = 'delete',
    Update = 'update',
    Change = 'change',
    Conflict = 'conflict',
    None = 'none',
    VirtualCreate = 'virtualCreate',
    VirtualDelete = 'virtualDelete'
}

// 属性的对比状态
export type AttrCompareStatus<T extends Record<string, unknown> = CompareDataAttr> = {
    type: CompareStatusEnum,
    path?: string,
    attrStatus?: { [key in string]: AttrCompareStatus<T> }
}

// 位置更换信息
export type ChangeCompareInfo = {
    // 从哪里来
    from: number
    // 到哪里去
    to: number
}

// 子节点更换位置信息 以 数据id 为 key 存储
export type ChildrenChangeCompareInfo = {
    [key in number]: ChangeCompareInfo
}

export type DifferenceTipsStatus = 'none' | 'compare' | 'cover' | 'merge'

export type DialogType = 'tips' | 'compare' | 'none'

// 必须要的属性
export type CompareDataAttr = { id: number, name?: string }

export type CompareData = CompareDataAttr & Obj

export interface CompareTree<T extends CompareDataAttr = CompareData> extends Obj {
    id: number
    name: string
    // 需要对比的数据
    compareData: Partial<T> & CompareDataAttr
    // 源数据
    target?: T
    status: AttrCompareStatus
    // 当前节点的位置更换信息
    changeInfo?: ChangeCompareInfo
    // 子节点的位置跟换信息
    childrenChangeInfo?: ChildrenChangeCompareInfo
    children: Array<CompareTree<T>>
    parent?: CompareTree<T>
}

export type CreateCompareTreeProps<T> =
    Partial<Omit<CompareTree, 'compareData' | 'target'>>
    & { compareData: Partial<T> & CompareDataAttr, target?: T }

export type CycleType = 'beforeCreateCompareNode'

export type CycleCallback<T extends CompareDataAttr = any> = (...args: CompareTree<T>[]) => any

export type Cycle<T extends CompareDataAttr = any> = {
    [key in CycleType]?: Array<CycleCallback<T>>
}
