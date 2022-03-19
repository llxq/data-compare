import { Cycle } from './utils/cycle'

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
    oldValue?: any,
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
export type CompareDataAttr = { id?: number, name?: string }

export type CompareData = CompareDataAttr & Obj

export interface CompareTree<T extends CompareDataAttr = CompareData> extends Obj {
    id: number
    name?: string
    // 需要对比的数据
    compareData: Partial<T> & CompareDataAttr
    // 源数据
    target?: T
    status: AttrCompareStatus
    // 当前节点的位置更换信息
    changeInfo?: ChangeCompareInfo
    // 子节点的位置跟换信息
    childrenChangeInfo?: ChildrenChangeCompareInfo
    children: CompareTree<T>[]
    parent?: CompareTree<T>
    mappingId?: number
}

export type CreateCompareTreeProps<T> =
    Partial<Omit<CompareTree, 'compareData' | 'target'>>
    & { compareData: Partial<T> & CompareDataAttr, target?: T }

export type CycleType = 'beforeCreateCompareNode' | 'beforeCompare' | 'afterCompare' | 'beforeDiffStatus' | 'afterDiffStatus' | 'afterDiffAttrStatus' | 'beforeCloneCompareTree' | 'beforeCloneCompareTree' | 'beforeParse' | 'afterParse'

export type CycleCallback = (...args: any) => any

export type CycleArgs = {
    uid: number,
    args: any
}

export type CycleCallbackItem = {
    uid: number,
    callback: CycleCallback
}

export type CycleTypeStack = Map<CycleType, CycleArgs[]>

export type CycleCallbackStack = Map<CycleType, CycleCallbackItem[]>

export interface CompareDataType {
    createCompareNode: <T extends CompareDataAttr = CompareData>(data: CreateCompareTreeProps<T>, parent?: CompareTree<T> | undefined, isClone?: boolean) => CompareTree
    diffAttr: (origin: unknown, target: unknown, pathStacks?: string[]) => AttrCompareStatus
    cycle: Cycle
}

export type ArgsCallback <T extends CompareDataAttr = CompareData> = (data: CompareTree<T>) => void
export type Args2Callback <T extends CompareDataAttr = CompareData> = (data: CompareTree<T>) => void
export type Args3Callback <T extends CompareDataAttr = CompareData> = (origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>) => void
export type Args4Callback <T extends CompareDataAttr = CompareData> = (current: CompareTree<T>[], online: CompareTree<T>[], currentParent?: CompareTree<T>, onlineParent?: CompareTree<T>) => void

export interface DiffCompareTreeArgs <T extends CompareDataAttr = CompareData> {
    (origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>): CompareTree<T>[]
    (origin: CompareTree<T>, target:CompareTree<T>, parent?: CompareTree<T>): CompareTree<T>
}
