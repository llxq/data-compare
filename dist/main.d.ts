import dataCompare from './src';
export declare const createCompareNode: <T extends CompareDataAttr = CompareData>(data: CreateCompareTreeProps<T>, parent?: CompareTree<T> | undefined, isClone?: boolean) => CompareTree<T>;
export declare const speedCreateCompareNode: <T extends CompareDataAttr = CompareData>(data: T, parent?: CompareTree<T> | undefined) => CompareTree<T>;
export declare const diffCompareTree: {
    (origin: CompareTree<CompareData>[], target: CompareTree<CompareData>[], parent?: CompareTree<CompareData> | undefined): CompareTree<CompareData>[];
    (origin: CompareTree<CompareData>, target: CompareTree<CompareData>, parent?: CompareTree<CompareData> | undefined): CompareTree<CompareData>[];
};
export declare const diffStatus: {
    (current: CompareTree<CompareData>[], online: CompareTree<CompareData>[], currentParent?: CompareTree<CompareData> | undefined, onlineParent?: CompareTree<CompareData> | undefined): void;
    (current: CompareTree<CompareData>, online: CompareTree<CompareData>, currentParent?: CompareTree<CompareData> | undefined, onlineParent?: CompareTree<CompareData> | undefined): void;
};
export declare const speedDiffStatus: <T extends CompareDataAttr = CompareData>(current: T, online: T, base: T) => SpeedDiffStatusType;
export declare const diffAttr: (origin: unknown, target: unknown, pathStacks?: string[]) => AttrCompareStatus<CompareDataAttr>;
export declare const parse: {
    <T extends CompareDataAttr = CompareData>(data: T, parent?: CompareTree<T> | undefined): CompareTree<T>;
    <T_1 extends CompareDataAttr = CompareData>(data: T_1[], parent?: CompareTree<T_1> | undefined): CompareTree<T_1>[];
};
export declare const cycle: import("./src/utils/Cycle").Cycle;
export declare const updateConfig: (config: Partial<DataCompareConfig>) => void;
export default dataCompare;
 
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

// ???????????????????????? ??????/??????/??????/????????????/??????/none/????????????/????????????
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

// ?????????????????????
declare type AttrCompareStatus<T extends Record<string, unknown> = CompareDataAttr> = {
    type: CompareStatusEnum,
    path?: string,
    oldValue?: any,
    attrStatus?: { [key in string]: AttrCompareStatus<T> }
}

// ??????????????????
declare type ChangeCompareInfo = {
    // ????????????
    from: number
    // ????????????
    to: number
}

// ??????????????????????????? ??? ??????id ??? key ??????
declare type ChildrenChangeCompareInfo = {
    [key in number]: ChangeCompareInfo
}

declare type DifferenceTipsStatus = 'none' | 'compare' | 'cover' | 'merge'

declare type DialogType = 'tips' | 'compare' | 'none'

// ??????????????????
declare type CompareDataAttr = { id?: number, name?: string }

declare type CompareData = CompareDataAttr & Obj

declare interface CompareTree<T extends CompareDataAttr = CompareData> extends Obj {
    // ?????????id
    id: number
    // ??????????????? ??????????????????????????? config
    name?: string
    // ?????????????????????
    compareData: Partial<T> & CompareDataAttr
    // ?????????
    target?: T
    // ??????
    status: AttrCompareStatus
    // ?????????????????????????????????
    changeInfo?: ChangeCompareInfo
    // ??????????????????????????????
    childrenChangeInfo?: ChildrenChangeCompareInfo
    // ?????????
    children: CompareTree<T>[]
    // ?????????
    parent?: CompareTree<T>
    // ????????????id?????????????????????id?????????
    mappingId?: number
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
    // ?????????????????????key
    childrenKey?: string
    // ?????????key
    someKey?: string
    // ?????????name
    nameKey?: string
}
