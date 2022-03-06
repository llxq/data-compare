import { diffAttr } from './src/diffAttr'
import { createCompareNode } from './src/createCompareNode'
import cycle from './src/utils/cycle'

export default {
    diffAttr,
    createCompareNode,
    ...cycle
}
