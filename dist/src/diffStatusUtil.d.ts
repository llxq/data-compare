/**
 * diff 对比当前两个状态树。处理冲突项，并且修正两个树结构使其结构一致
 * @param current 当前版本对比结果
 * @param online 线上版本对比结果
 * @param currentParent
 * @param onlineParent
 */
export declare const diffStatusUtil: (current: CompareTree[], online: CompareTree[], currentParent?: CompareTree<CompareData> | undefined, onlineParent?: CompareTree<CompareData> | undefined) => void;
