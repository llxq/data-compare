/**
 * 属性对比，因为需要获取更换位置状态，所以需要区分数组/对象的对比。。
 * @param origin new
 * @param target old
 * @param pathStacks
 */
export declare const diffAttrUtil: (origin: unknown, target: unknown, pathStacks?: string[]) => AttrCompareStatus;
