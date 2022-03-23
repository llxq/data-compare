import { Cycle } from './utils/Cycle';
declare class DataCompare {
    static get instance(): DataCompare;
    private static dataCompareInstance;
    private constructor();
    private uid;
    cycle: Cycle;
    /**
     * 快速创建一个对比节点
     * @param data 原始数据
     * @param parent 父节点
     * @returns
     */
    speedCreateCompareNode<T extends CompareDataAttr = CompareData>(data: T, parent?: CompareTree<T>): CompareTree<T>;
    /**
     * 创建对比节点
     * @param data 原始数据
     * @param parent 父节点
     * @param isClone 是否为clone节点
     * @returns
     */
    createCompareNode<T extends CompareDataAttr = CompareData>(data: CreateCompareTreeProps<T>, parent?: CompareTree<T>, isClone?: boolean): CompareTree<T>;
    /**
     * 获取两个数据之前的差异和状态
     * @param origin 新的数据
     * @param target 原始数据
     * @param pathStacks 属性的路径
     * @returns 返回对比状态
     */
    diffAttr(origin: unknown, target: unknown, pathStacks?: string[]): AttrCompareStatus;
    /**
     * diff对比每个节点数据
     * @param origin 原始数据，该方法是会修改原始数据的
     * @param target 对比的数据
     * @param parent 父节点数据
     * @returns 对比后的数据_
     */
    diffCompareTree(origin: CompareTree[], target: CompareTree[], parent?: CompareTree): CompareTree[];
    diffCompareTree(origin: CompareTree, target: CompareTree, parent?: CompareTree): CompareTree[];
    /**
     * diffStatus
     * @param current
     * @param online
     * @param currentParent
     * @param onlineParent
     */
    diffStatus(current: CompareTree[], online: CompareTree[], currentParent?: CompareTree, onlineParent?: CompareTree): void;
    diffStatus(current: CompareTree, online: CompareTree, currentParent?: CompareTree, onlineParent?: CompareTree): void;
    /**
     * 快速对比三个对象之前的数据差异
     * @param current 当前版本
     * @param online 线上版本
     * @param base 基础版本
     */
    speedDiffStatus<T extends CompareDataAttr = CompareData>(current: T, online: T, base: T): SpeedDiffStatusType;
    /**
     * 解析
     */
    parse<T extends CompareDataAttr = CompareData>(data: T, parent?: CompareTree<T>): CompareTree<T>;
    parse<T extends CompareDataAttr = CompareData>(data: T[], parent?: CompareTree<T>): CompareTree<T>[];
}
declare const dataCompare: DataCompare;
export default dataCompare;
