import { diffAttrUtil } from './diffAttrUtil'
import { diffCompareTreeUtil } from './diffCompareTreeUtil'
import { diffStatusUtil } from './diffStatusUtil'
import { parseUtil } from './parseUtil'
import { AttrCompareStatus, CompareData, CompareDataAttr, CompareStatusEnum, CompareTree, CreateCompareTreeProps, SpeedDiffStatusType } from './types'
import { isArray } from './utils'
import { getConfig, getNameValue } from './utils/config'
import { Cycle } from './utils/cycle'

class DataCompare {

    public static get instance (): DataCompare {
        if (!this.dataCompareInstance) {
            this.dataCompareInstance = new DataCompare()
        }
        return this.dataCompareInstance
    }

    private static dataCompareInstance: DataCompare

    private constructor () {
        this.cycle = new Cycle()
    }

    private uid = 0

    public cycle!: Cycle

    /**
     * 快速创建一个对比节点
     * @param data 原始数据
     * @param parent 父节点
     * @returns 
     */
    public speedCreateCompareNode<T extends CompareDataAttr = CompareData> (data: T, parent?: CompareTree<T>): CompareTree<T> {
        return this.createCompareNode({ compareData: data, target: data }, parent)
    }

    /**
     * 创建对比节点
     * @param data 原始数据
     * @param parent 父节点
     * @param isClone 是否为clone节点
     * @returns 
     */
    public createCompareNode<T extends CompareDataAttr = CompareData> (data: CreateCompareTreeProps<T>, parent?: CompareTree<T>, isClone = false): CompareTree<T> {
        const target = data.target ?? data.compareData as Required<T> ?? undefined
        const { nameKey } = getConfig()
        const newNode: CompareTree<T> = {
            id: ++this.uid,
            [nameKey]: getNameValue(data) ?? getNameValue(data.compareData) ?? '未命名',
            // 将数据类型去除掉，因为需要去除其中的 get 不可枚举属性
            compareData: Object.assign({}, data.compareData),
            target,
            status: data.status ?? {
                // 默认状态为 none
                type: CompareStatusEnum.None
            },
            changeInfo: data.changeInfo ?? undefined,
            childrenChangeInfo: data.childrenChangeInfo ?? undefined,
            children: (data.children ?? []) as CompareTree<T>[],
            parent: parent ?? data.parent as UndefinedAble<CompareTree<T>>,
            mappingId: data.mappingId
        }
        !isClone && this.cycle.addCycle('beforeCreateCompareNode', newNode)
        return newNode
    }

    /**
     * 获取两个数据之前的差异和状态
     * @param origin 新的数据
     * @param target 原始数据
     * @param pathStacks 属性的路径
     * @returns 返回对比状态
     */
    public diffAttr (origin: unknown, target: unknown, pathStacks: string[] = []): AttrCompareStatus {
        return diffAttrUtil(origin, target, pathStacks)
    }

    /**
     * diff对比每个节点数据
     * @param origin 原始数据，该方法是会修改原始数据的
     * @param target 对比的数据
     * @param parent 父节点数据
     * @returns 对比后的数据_
     */
    public diffCompareTree(origin: CompareTree[], target: CompareTree[], parent?: CompareTree): CompareTree[]
    public diffCompareTree(origin: CompareTree, target: CompareTree, parent?: CompareTree): CompareTree[]
    public diffCompareTree (origin: any, target: any, parent?: CompareTree): CompareTree[] {
        if (isArray(origin) && isArray(target)) {
            return diffCompareTreeUtil(origin, target, parent)
        } else {
            return diffCompareTreeUtil([origin], [target], parent)
        }
    }

    /**
     * diffStatus
     * @param current 
     * @param online 
     * @param currentParent 
     * @param onlineParent 
     */
    public diffStatus(current: CompareTree[], online: CompareTree[], currentParent?: CompareTree, onlineParent?: CompareTree): void
    public diffStatus(current: CompareTree, online: CompareTree, currentParent?: CompareTree, onlineParent?: CompareTree): void
    public diffStatus (current: any, online: any, currentParent?: CompareTree, onlineParent?: CompareTree): void {
        if (isArray(current) && isArray(online)) {
            diffStatusUtil(current, online, currentParent, onlineParent)
        } else {
            diffStatusUtil([current], [online], currentParent, onlineParent)
        }
    }

    /**
     * 快速对比三个对象之前的数据差异
     * @param current 当前版本
     * @param online 线上版本
     * @param base 基础版本
     */
    public speedDiffStatus <T extends CompareDataAttr = CompareData> (current: T, online: T, base: T): SpeedDiffStatusType {
        const currentTree = this.speedCreateCompareNode(current)
        const onlineTree = this.speedCreateCompareNode(online)
        const baseTree = this.speedCreateCompareNode(base)
        const cb = this.diffCompareTree(currentTree, baseTree)
        const ob = this.diffCompareTree(onlineTree, baseTree)
        diffStatusUtil(cb, ob)
        return {
            current: cb,
            online: ob
        }
    }

    /**
     * 解析
     */
    public parse<T extends CompareDataAttr = CompareData>(data: T, parent?: CompareTree<T>): CompareTree<T>
    public parse<T extends CompareDataAttr = CompareData>(data: T[], parent?: CompareTree<T>): CompareTree<T>[]
    public parse<T extends CompareDataAttr = CompareData> (data: T[] | T, parent?: CompareTree<T>): CompareTree<T>[] | CompareTree<T> {
        this.cycle.addCycle('beforeParse', data, parent)
        let newNode: CompareTree<T> | CompareTree<T>[]
        // XXX 为了解决重载导致的编辑器报错
        if (isArray(data)) {
            newNode = parseUtil(data, parent)
        } else {
            newNode = parseUtil(data, parent)
        }
        this.cycle.addCycle('afterParse', data, newNode, parent)
        return newNode
    }
}
const dataCompare = DataCompare.instance
export default dataCompare
