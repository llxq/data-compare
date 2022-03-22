export declare class Cycle {
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

export declare type UndefinedAble<T> = undefined | T

export declare type Obj<T = any> = {
    [key in string | number]: T
}

// 树节点对比的状态 新增/删除/修改/交换位置/冲突/none/虚拟添加/虚拟删除
export declare enum CompareStatusEnum {
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
export declare type AttrCompareStatus<T extends Record<string, unknown> = CompareDataAttr> = {
    type: CompareStatusEnum,
    path?: string,
    oldValue?: any,
    attrStatus?: { [key in string]: AttrCompareStatus<T> }
}

// 位置更换信息
export declare type ChangeCompareInfo = {
    // 从哪里来
    from: number
    // 到哪里去
    to: number
}

// 子节点更换位置信息 以 数据id 为 key 存储
export declare type ChildrenChangeCompareInfo = {
    [key in number]: ChangeCompareInfo
}

export declare type DifferenceTipsStatus = 'none' | 'compare' | 'cover' | 'merge'

export declare type DialogType = 'tips' | 'compare' | 'none'

// 必须要的属性
export declare type CompareDataAttr = { id?: number, name?: string }

export declare type CompareData = CompareDataAttr & Obj

export declare interface CompareTree<T extends CompareDataAttr = CompareData> extends Obj {
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
}

export declare type CreateCompareTreeProps<T> =
    Partial<Omit<CompareTree, 'compareData' | 'target'>>
    & { compareData: Partial<T> & CompareDataAttr, target?: T }

export declare type CycleType =
    'beforeCreateCompareNode'
    | 'beforeCompare'
    | 'afterCompare'
    | 'beforeDiffStatus'
    | 'afterDiffStatus'
    | 'afterCompareStatus'
    | 'beforeCloneCompareTree'
    | 'beforeParse'
    | 'afterParse'

export declare type CycleCallback = (...args: any) => any

export declare type CycleArgs = {
    uid: number,
    args: any
}

export declare type CycleCallbackItem = {
    uid: number,
    callback: CycleCallback
}

export declare type CycleTypeStack = Map<CycleType, CycleArgs[]>

export declare type CycleCallbackStack = Map<CycleType, CycleCallbackItem[]>

export declare interface CompareDataType {
    createCompareNode: <T extends CompareDataAttr = CompareData>(data: CreateCompareTreeProps<T>, parent?: CompareTree<T> | undefined, isClone?: boolean) => CompareTree<T>
    diffAttr: (origin: unknown, target: unknown, pathStacks?: string[]) => AttrCompareStatus
    cycle: Cycle
}

export declare type ArgsCallback<T extends CompareDataAttr = CompareData> = (data: CompareTree<T>) => void
export declare type Args2Callback<T extends CompareDataAttr = CompareData> = (current: CompareTree<T>, online: CompareTree<T>) => void
export declare type Args3Callback<T extends CompareDataAttr = CompareData> = (origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>) => void
export declare type Args4Callback<T extends CompareDataAttr = CompareData> = (current: CompareTree<T>[], online: CompareTree<T>[], currentParent?: CompareTree<T>, onlineParent?: CompareTree<T>) => void

export declare interface DiffCompareTreeArgs<T extends CompareDataAttr = CompareData> {
    (origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>): CompareTree<T>[]

    (origin: CompareTree<T>, target: CompareTree<T>, parent?: CompareTree<T>): CompareTree<T>
}

export declare interface SpeedDiffStatusType {
    current: CompareTree[],
    online: CompareTree[]
}

export declare interface DataCompareConfig {
    // 解析为子节点的key
    childrenKey?: string
    // 对比的key
    someKey?: string
    // 展示的name
    nameKey?: string
}

export declare const createCompareNode: <T extends CompareDataAttr = CompareData>(data: CreateCompareTreeProps<T>, parent?: CompareTree<T> | undefined, isClone?: boolean) => CompareTree<T>
export declare const speedCreateCompareNode: <T extends CompareDataAttr = CompareData>(data: T, parent?: CompareTree<T> | undefined) => CompareTree<T>
export declare const diffCompareTree: {
    (origin: CompareTree<CompareData>[], target: CompareTree<CompareData>[], parent?: CompareTree<CompareData> | undefined): CompareTree<CompareData>[]
    (origin: CompareTree<CompareData>, target: CompareTree<CompareData>, parent?: CompareTree<CompareData> | undefined): CompareTree<CompareData>[]
}
export declare const diffStatus: {
    (current: CompareTree<CompareData>[], online: CompareTree<CompareData>[], currentParent?: CompareTree<CompareData> | undefined, onlineParent?: CompareTree<CompareData> | undefined): void
    (current: CompareTree<CompareData>, online: CompareTree<CompareData>, currentParent?: CompareTree<CompareData> | undefined, onlineParent?: CompareTree<CompareData> | undefined): void
}
export declare const speedDiffStatus: <T extends CompareDataAttr = CompareData>(current: T, online: T, base: T) => SpeedDiffStatusType
export declare const diffAttr: (origin: unknown, target: unknown, pathStacks?: string[]) => AttrCompareStatus<CompareDataAttr>
export declare const parse: {
    <T extends CompareDataAttr = CompareData>(data: T, parent?: CompareTree<T> | undefined): CompareTree<T>
    <T_1 extends CompareDataAttr = CompareData>(data: T_1[], parent?: CompareTree<T_1> | undefined): CompareTree<T_1>[]
}
export declare const cycle: Cycle
export declare const updateConfig: (config: Partial<DataCompareConfig>) => void
