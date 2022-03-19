import { CompareTree } from '../types'

export interface DataCompareConfig {
    // 解析为子节点的key
    childrenKey?: string
    // 对比的key
    someKey?: string
    // 展示的name
    nameKey?: string
}

const defaultConfig: Required<DataCompareConfig> = {
    childrenKey: 'children',
    someKey: 'id',
    nameKey: 'name'
}

/**
 * 获取config
 */
export const getConfig = (): Required<DataCompareConfig> => defaultConfig

export const getSomeValue = (data: CompareTree<any>): any => Reflect.get(data.compareData, defaultConfig.someKey)

export const getNameValue = (data: any): any => Reflect.get(data, defaultConfig.nameKey)

/**
 * 修改默认config
 * @param config config
 */
export const updateConfig = (config: Partial<DataCompareConfig>): void => {
    // nameKey 不能为id
    if (config.nameKey === 'id') {
        console.warn('nameKey can not be id')
        // 恢复为默认值
        config.nameKey = 'name'
    }
    Object.assign(defaultConfig, config)
}
