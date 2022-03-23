/**
 * 获取config
 */
export declare const getConfig: () => Required<DataCompareConfig>;
export declare const getSomeValue: (data: CompareTree<any>) => any;
export declare const getNameValue: (data: any) => any;
/**
 * 修改默认config
 * @param config config
 */
export declare const updateConfig: (config: Partial<DataCompareConfig>) => void;
