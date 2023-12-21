import { toRefs } from 'vue'
import { diffAttr, diffCompareTree, diffStatus, shallowDiffAttr, speedCreateCompareNode } from '../../../main'

export const useSpeedCreateCompareNode = () => {
    const data = {
        id: 1,
        name: '名称',
        value: {
            a: 1,
            b: {
                c: 2
            }
        }
    }
    const compareTree1 = speedCreateCompareNode(data)
    const data2 = {
        id: 1,
        name: '名称2',
        value: {
            a: 1,
            b: {
                c: 4
            },
            x: 3
        }
    }
    console.log('shallowDiffAttr', shallowDiffAttr({ a: 2, b: 2, d: 1 }, { a: 1, b: 2, c: 3 }))

    const result = diffAttr(data, data2)
    const columns = [
        {
            name: 'name',
            label: '名称'
        }, {
            name: '内容',
            label: 'value'
        }
    ]
    console.log('xxx', Object.keys(result.attrStatus).reduce((r, m) => {
        const value = Reflect.get(result.attrStatus, m)
        Reflect.set(r, m, {
            label: columns.find(it => it.label === m)?.name ?? 'x',
            oldValue: value.oldValue,
            newValue: Reflect.get(data, m)
        })
        return r
    }, {}))

    const compareTree2 = speedCreateCompareNode(data2)
    const compareResult = diffCompareTree(compareTree2, compareTree1)
    console.log(compareResult)



    const current = {
        id: 1,
        name: '名称1',
        test: 1,
        update: 1,
        x: 1
    }
    const currentTree = speedCreateCompareNode(current)
    const base = {
        id: 1,
        name: '名称',
        test: 1,
        update: 2
    }
    const baseTree = speedCreateCompareNode(base)
    const online = {
        id: 1,
        name: '名称2',
        test: 1,
        update: 2,
        y: 2
    }
    const onlineTree = speedCreateCompareNode(online)
    const currentBase = diffCompareTree(currentTree, baseTree)
    const onlineBase = diffCompareTree(onlineTree, baseTree)
    diffStatus(currentBase, onlineBase)
    // 对比状态
    console.log(onlineBase, onlineTree, currentBase)

    return toRefs({
        compareTree1,
        compareTree2,
        compareResult
    })
}
