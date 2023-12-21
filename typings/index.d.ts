declare class Cycle {
    public beforeCreateCompareNode<T extends CompareDataAttr = CompareData> (callback: ArgsCallback<T>): void

    public beforeCompare<T extends CompareDataAttr = CompareData> (callback: Args3Callback<T>): void

    public afterCompare<T extends CompareDataAttr = CompareData> (callback: Args3Callback<T>): void

    public beforeDiffStatus<T extends CompareDataAttr = CompareData> (callback: Args4Callback<T>): void

    public afterDiffStatus<T extends CompareDataAttr = CompareData> (callback: Args4Callback<T>): void

    public afterCompareStatus<T extends CompareDataAttr = CompareData> (callback: Args2Callback<T>): void

    public beforeCloneCompareTree<T extends CompareDataAttr = CompareData> (callback: (cloneTree: CompareTree<T>, statusType: CompareStatusEnum, parent?: CompareTree) => void): void

    public beforeParse<T extends CompareDataAttr = CompareData> (callback: (data: T | T[], parent?: CompareTree<T>) => void): void

    public afterParse<T extends CompareDataAttr = CompareData> (callback: (data: T | T[], compareTree: CompareTree<T> | CompareTree<T>[], parent?: CompareTree<T>) => void): void
}

declare type UndefinedAble<T> = undefined | T

declare type Obj<T = any> = {
    [key in string | number]: T
}

// 树节点对比的状态 新增/删除/修改/交换位置/冲突/none/虚拟添加/虚拟删除
declare enum CompareStatusEnum {
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
declare type AttrCompareStatus<T extends Record<string, unknown> = CompareDataAttr> = {
    type: CompareStatusEnum,
    path?: string,
    oldValue?: any,
    attrStatus?: { [key in string]: AttrCompareStatus<T> }
}

declare type ShallowAttrCompareStatus = {
    type: CompareStatusEnum,
    path?: string,
    oldValue?: any,
    newValue?: any
}

// 位置更换信息
declare type ChangeCompareInfo = {
    // 从哪里来
    from: number
    // 到哪里去
    to: number
}

// 子节点更换位置信息 以 数据id 为 key 存储
declare type ChildrenChangeCompareInfo = {
    [key in number]: ChangeCompareInfo
}

declare type DifferenceTipsStatus = 'none' | 'compare' | 'cover' | 'merge'

declare type DialogType = 'tips' | 'compare' | 'none'

// 必须要的属性
declare type CompareDataAttr = { id?: number, name?: string }

declare type CompareData = CompareDataAttr & Obj

declare interface CompareTree<T extends CompareDataAttr = CompareData> extends Obj {
    // 树节点id
    id: number
    // 树节点名称 也可以通过配置更改 config
    name?: string
    // 需要对比的数据
    compareData: Partial<T> & CompareDataAttr
    // 源数据
    target?: T
    // 状态
    status: AttrCompareStatus
    // 当前节点的位置更换信息
    changeInfo?: ChangeCompareInfo
    // 子节点的位置跟换信息
    childrenChangeInfo?: ChildrenChangeCompareInfo
    // 子节点
    children: CompareTree<T>[]
    // 父节点
    parent?: CompareTree<T>
    // 当前节点id与另一个对比数id的映射
    mappingId?: number
    // 是否对比更换位置状态
    diffChange?: boolean
}

declare type CreateCompareTreeProps<T> =
    Partial<Omit<CompareTree, 'compareData' | 'target'>>
    & { compareData: Partial<T> & CompareDataAttr, target?: T }

declare type CycleType =
    'beforeCreateCompareNode'
    | 'beforeCompare'
    | 'afterCompare'
    | 'beforeDiffStatus'
    | 'afterDiffStatus'
    | 'afterCompareStatus'
    | 'beforeCloneCompareTree'
    | 'beforeParse'
    | 'afterParse'

declare type CycleCallback = (...args: any) => any

declare type CycleArgs = {
    uid: number,
    args: any
}

declare type CycleCallbackItem = {
    uid: number,
    callback: CycleCallback
}

declare type CycleTypeStack = Map<CycleType, CycleArgs[]>

declare type CycleCallbackStack = Map<CycleType, CycleCallbackItem[]>

declare interface CompareDataType {
    createCompareNode: <T extends CompareDataAttr = CompareData>(data: CreateCompareTreeProps<T>, parent?: CompareTree<T> | undefined, isClone?: boolean) => CompareTree<T>
    diffAttr: (origin: unknown, target: unknown, pathStacks?: string[]) => AttrCompareStatus
    shallowDiffAttr: (origin: unknown, target: unknown, pathStacks?: string[]) => ShallowAttrCompareStatus
    cycle: Cycle
}

declare type ArgsCallback<T extends CompareDataAttr = CompareData> = (data: CompareTree<T>) => void
declare type Args2Callback<T extends CompareDataAttr = CompareData> = (current: CompareTree<T>, online: CompareTree<T>) => void
declare type Args3Callback<T extends CompareDataAttr = CompareData> = (origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>) => void
declare type Args4Callback<T extends CompareDataAttr = CompareData> = (current: CompareTree<T>[], online: CompareTree<T>[], currentParent?: CompareTree<T>, onlineParent?: CompareTree<T>) => void

declare interface DiffCompareTreeArgs<T extends CompareDataAttr = CompareData> {
    (origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>): CompareTree<T>[]

    (origin: CompareTree<T>, target: CompareTree<T>, parent?: CompareTree<T>): CompareTree<T>
}

declare interface SpeedDiffStatusType {
    current: CompareTree[],
    online: CompareTree[]
}

declare interface DataCompareConfig {
    // 解析为子节点的key
    childrenKey?: string
    // 对比的key
    someKey?: string
    // 展示的name
    nameKey?: string
}
