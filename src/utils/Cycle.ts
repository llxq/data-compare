import { CompareStatusEnum } from '../type'
import { each } from './object'

export class Cycle {

    private uid = 0

    private quoteId: Set<number> = new Set()

    private cycleStacks: CycleTypeStack = new Map()

    private cycleCallback: CycleCallbackStack = new Map()

    private getCycleArgs (cycleType: CycleType): CycleArgs[] {
        if (this.cycleStacks.has(cycleType)) {
            return this.cycleStacks.get(cycleType)!
        }
        const stacks: CycleArgs[] = []
        this.cycleStacks.set(cycleType, stacks)
        return stacks
    }

    private runCallback = (callback: CycleCallback, args: any[], argsNum: number): void => {
        if (!args) return
        switch (argsNum) {
            case 1:
                callback(args[0])
                break
            case 2:
                callback(args[0], args[1])
                break
            case 3:
                callback(args[0], args[1], args[2])
                break
            case 4:
                callback(args[0], args[1], args[2], args[3])
        }
    }

    public addCycle (cycleType: CycleType, ...args: any[]): void {
        this.getCycleArgs(cycleType).push({
            uid: ++this.uid,
            args
        })
        // run cyce
        each(this.cycleCallback.get(cycleType) ?? [], item => {
            if (!this.quoteId.has(item.uid)) {
                this.quoteId.add(item.uid)
                item.callback(...args)
            }
        })
    }

    public runCycle (cycleType: CycleType, callback: CycleCallback): any[] {
        const item = { uid: ++this.uid, callback }
        if (this.cycleCallback.has(cycleType)) {
            this.cycleCallback.get(cycleType)!.push(item)
        } else {
            this.cycleCallback.set(cycleType, [item])
        }

        const cycleArgs = this.getCycleArgs(cycleType)
        const argsList: any = []
        cycleArgs.length && each(cycleArgs, cycleItem => {
            if (!this.quoteId.has(cycleItem.uid)) {
                this.quoteId.add(cycleItem.uid)
                argsList.push(cycleItem.args)
            }
        })
        return argsList
    }

    /**
     * 创建节点之前调用
     * @param callback 回调
     */
    public beforeCreateCompareNode<T extends CompareDataAttr = CompareData> (callback: ArgsCallback<T>): void {
        const [args] = this.runCycle('beforeCreateCompareNode', callback)
        this.runCallback(callback, args, 1)
    }

    /**
     * 比较之前调用
     * @param callback
     */
    public beforeCompare<T extends CompareDataAttr = CompareData> (callback: Args3Callback<T>): void {
        const [args] = this.runCycle('beforeCompare', callback)
        this.runCallback(callback, args, 3)
    }

    /**
     * 比较之后调用
     * @param callback
     * @returns
     */
    public afterCompare<T extends CompareDataAttr = CompareData> (callback: Args3Callback<T>): void {
        const [args] = this.runCycle('afterCompare', callback)
        this.runCallback(callback, args, 3)
    }

    /**
     * beforeDiffStatus
     * @param callback
     */
    public beforeDiffStatus<T extends CompareDataAttr = CompareData> (callback: Args4Callback<T>): void {
        const [args] = this.runCycle('beforeDiffStatus', callback)
        this.runCallback(callback, args, 4)
    }

    /**
     *
     * @param callback
     */
    public afterDiffStatus<T extends CompareDataAttr = CompareData> (callback: Args4Callback<T>): void {
        const [args] = this.runCycle('afterDiffStatus', callback)
        this.runCallback(callback, args, 4)
    }

    /**
     * afterCompareStatus
     * @param callback
     */
    public afterCompareStatus<T extends CompareDataAttr = CompareData> (callback: Args2Callback<T>): void {
        const [args] = this.runCycle('afterCompareStatus', callback)
        this.runCallback(callback, args, 2)
    }

    /**
     * beforeCloneCompareTree
     * @param callback
     */
    public beforeCloneCompareTree<T extends CompareDataAttr = CompareData> (callback: (cloneTree: CompareTree<T>, statusType: CompareStatusEnum, parent?: CompareTree) => void): void {
        const [args] = this.runCycle('beforeCloneCompareTree', callback)
        this.runCallback(callback, args, 3)
    }

    /**
     * beforeParse
     * @param callback
     */
    public beforeParse<T extends CompareDataAttr = CompareData> (callback: (data: T | T[], parent?: CompareTree<T>) => void): void {
        const [args] = this.runCycle('beforeParse', callback)
        this.runCallback(callback, args, 2)
    }

    /**
     * afterParse
     * @param callback
     */
    public afterParse<T extends CompareDataAttr = CompareData> (callback: (data: T | T[], compareTree: CompareTree<T> | CompareTree<T>[], parent?: CompareTree<T>) => void): void {
        const [args] = this.runCycle('afterParse', callback)
        this.runCallback(callback, args, 3)
    }
}

export default new Cycle()
