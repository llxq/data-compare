import { CompareStatusEnum } from '../type';
export declare class Cycle {
    private uid;
    private quoteId;
    private cycleStacks;
    private cycleCallback;
    private getCycleArgs;
    private runCallback;
    addCycle(cycleType: CycleType, ...args: any[]): void;
    runCycle(cycleType: CycleType, callback: CycleCallback): any[];
    /**
     * 创建节点之前调用
     * @param callback 回调
     */
    beforeCreateCompareNode<T extends CompareDataAttr = CompareData>(callback: ArgsCallback<T>): void;
    /**
     * 比较之前调用
     * @param callback
     */
    beforeCompare<T extends CompareDataAttr = CompareData>(callback: Args3Callback<T>): void;
    /**
     * 比较之后调用
     * @param callback
     * @returns
     */
    afterCompare<T extends CompareDataAttr = CompareData>(callback: Args3Callback<T>): void;
    /**
     * beforeDiffStatus
     * @param callback
     */
    beforeDiffStatus<T extends CompareDataAttr = CompareData>(callback: Args4Callback<T>): void;
    /**
     *
     * @param callback
     */
    afterDiffStatus<T extends CompareDataAttr = CompareData>(callback: Args4Callback<T>): void;
    /**
     * afterCompareStatus
     * @param callback
     */
    afterCompareStatus<T extends CompareDataAttr = CompareData>(callback: Args2Callback<T>): void;
    /**
     * beforeCloneCompareTree
     * @param callback
     */
    beforeCloneCompareTree<T extends CompareDataAttr = CompareData>(callback: (cloneTree: CompareTree<T>, statusType: CompareStatusEnum, parent?: CompareTree) => void): void;
    /**
     * beforeParse
     * @param callback
     */
    beforeParse<T extends CompareDataAttr = CompareData>(callback: (data: T | T[], parent?: CompareTree<T>) => void): void;
    /**
     * afterParse
     * @param callback
     */
    afterParse<T extends CompareDataAttr = CompareData>(callback: (data: T | T[], compareTree: CompareTree<T> | CompareTree<T>[], parent?: CompareTree<T>) => void): void;
}
declare const _default: Cycle;
export default _default;
