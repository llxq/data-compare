import { CompareStatusEnum } from './type';
/**
 * 创建 id => index 缓存
 * @param start
 * @param end
 * @param source
 */
export declare const createIdxCache: (start: number, end: number, source: CompareTree[]) => Map<number, number>;
/**
 * 修改当前节点以及子节点状态
 * @param compareTree
 * @param statusType
 */
export declare const updateStatus: (compareTree: CompareTree, statusType: CompareStatusEnum) => CompareTree;
/**
 * 使用diff算法对比两个节点。 XXX 注意这里直接是修改了 origin 源对象的
 * @param origin new
 * @param target old
 * @param parent origin 对象的 parent （new parent）
 */
export declare const diffCompareTreeUtil: <T extends CompareDataAttr = CompareData>(origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T> | undefined) => CompareTree<T>[];
