# @chendf/data-compare
data-compare是一个对比数据之间差异的一个轻量级库，类似于简化版本的git对比。

## 功能
通过diff算法对比出两个版本数据或三个版本数据之间的属性差异与状态。（新增/删除/修改/交换位置/冲突）。
通过diff算法对比出两个数据之间的属性差异。是否有属性删除/新增/修改之类的。
可以手动转换为对比节点(compareTree)也可以通过parse方法自动转换，自动转换可以手动配置转换结构。

## 三个版本数据对比
- 三个版本
    - 当前版本
    - 基础版本
    - 其他版本
    
- 差异获取
    - 当前版本与基础版本对比得到一个差异状态树（currentDiff）。
    - 其他版本与基础版本对比得到一个差异状态树（otherDiff）。
    - currentDiff 与 otherDiff 对比得到最终的一个差异树。
    
__注意：只有三个版本对比才会出现冲突状态。冲突是指当前版本与其他版本都修改了同一个属性则会导致冲突。__


## 数据对比的结构
```ts
// 必须要的属性
export type CompareDataAttr = { id?: number, name?: string }

export type CompareData = CompareDataAttr & Obj

export interface CompareTree<T extends CompareDataAttr = CompareData> extends Obj {
    // 树节点id
    id: number
    // 树节点名称 也可以通过配置更改 config
    name?: string
    // 需要对比的数据
    compareData: Partial<T> & CompareDataAttr
    // 源数据
    target?: T
    // 状态
    status: AttrCompareStatus
    // 当前节点的位置更换信息
    changeInfo?: ChangeCompareInfo
    // 子节点的位置跟换信息
    childrenChangeInfo?: ChildrenChangeCompareInfo
    // 子节点
    children: CompareTree<T>[]
    // 父节点
    parent?: CompareTree<T>
    // 当前节点id与另一个对比数id的映射
    mappingId?: number
}
```

## methods
__createCompareNode: 创建一个对比节点__
- _createCompareNode<T extends CompareDataAttr = CompareData> (data: CreateCompareTreeProps<T>, parent?: CompareTree<T>, isClone = false): CompareTree<T>_
- _@param_ data 原始数据。
- _@param_ parent 父节点。
- _@param_ isClone 是否为clone节点，clone节点不会触发 beforeCreateCompareNode 钩子
- _@returns_ 返回创建成功后的节点
```ts
import { createCompareNode } from '@chendf/data-compare'
const data = {
    id: 1,
    name: '名称'
}
const compareTree = createCompareNode({compareData: data, target: data})
// 返回一个树节点
```

__speedCreateCompareNode: 快速创建一个对比节点__
- _speedCreateCompareNode<T extends CompareDataAttr = CompareData> (data: T, parent?: CompareTree<T>): CompareTree<T>_
- _@param_ data 原始数据
- _@param_ parent 父节点
- _@returns_ 返回创建成功后的节点
```ts
import { speedCreateCompareNode } from '@chendf/data-compare'
const data = {
    id: 1,
    name: '名称'
}
const compareTree = speedCreateCompareNode(data)
// 返回一个树节点
``` 

__diffCompareTree: 对比两个对比树节点之间的差异 (两个重载)__
- _diffCompareTree(origin: CompareTree[], target: CompareTree[], parent?: CompareTree): CompareTree[]_
- _diffCompareTree(origin: CompareTree, target: CompareTree, parent?: CompareTree): CompareTree[]_
- _@param origin 原始数据，该方法是会修改原始数据的_
- _@param target 对比的数据_
- _@param parent 父节点数据_
- _@returns 对比后的数据_
```ts
import { speedCreateCompareNode, diffCompareTree } from '@chendf/data-compare'
const data = {
    id: 1,
    name: '名称'
}
const compareTree1 = speedCreateCompareNode(data)
const data2 = {
    id: 1,
    name: '名称2'
}
const compareTree2 = speedCreateCompareNode(data2)
diffCompareTree(compareTree1, compareTree2)

// return
[
    {
        id: 1,
        name: "名称",
        compareData: {
            id: 1,
            name: "名称"
        },
        target: {
            id: 1,
            name: "名称"
        },
        status: {
            type: "update",
            path: "",
            attrStatus: {
                name: {
                    type: "update",
                    path: "name",
                    oldValue: "名称2"
                }
            }
        },
        children: []
    }
]
```

__diffStatus: 对比两个差异树节点状态，并且设置冲突状态。如果两边都有修改那么当前节点就为冲突状态，也可通过钩子手动调整__
- _diffStatus(current: CompareTree[], online: CompareTree[], currentParent?: CompareTree, onlineParent?: CompareTree): void_
- _diffStatus(current: CompareTree, online: CompareTree, currentParent?: CompareTree, onlineParent?: CompareTree): void_
- _@param current 当前版本数据_
- _@param online 线上版本数据_
- _@param currentParent 当前版本父节点_
- _@param onlineParent 线上版本父节点_
```ts
import { speedCreateCompareNode, diffCompareTree, diffStatus } from '@chendf/data-compare'
const current = {
    id: 1,
    name: '名称1',
    test: 1,
    update: 1
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
    update: 2
}
const onlineTree = speedCreateCompareNode(online)
const currentBase = diffCompareTree(currentTree, baseTree)
const onlineBase = diffCompareTree(onlineTree, baseTree)
// 对比状态
diffStatus(currentBase, onlineBase)

// currentBase
[
    {
        "id": 1,
        "name": "名称1",
        "compareData": {
            "id": 1,
            "name": "名称1",
            "test": 1,
            "update": 1
        },
        "target": {
            "id": 1,
            "name": "名称1",
            "test": 1,
            "update": 1
        },
        "status": {
            "type": "conflict",
            "path": "",
            "attrStatus": {
                "name": {
                    "type": "conflict",
                    "path": "name",
                    "oldValue": "名称"
                },
                "update": {
                    "type": "update",
                    "path": "update",
                    "oldValue": 2
                }
            }
        },
        "children": [],
        "mappingId": 3
    }
]

// onlineBase
[
    {
        "id": 3,
        "name": "名称2",
        "compareData": {
            "id": 1,
            "name": "名称2",
            "test": 1,
            "update": 2
        },
        "target": {
            "id": 1,
            "name": "名称2",
            "test": 1,
            "update": 2
        },
        "status": {
            "type": "conflict",
            "path": "",
            "attrStatus": {
                "name": {
                    "type": "conflict",
                    "path": "name",
                    "oldValue": "名称"
                }
            }
        },
        "children": [],
        "mappingId": 1
    }
]
```


_speedDiffStatus: 快速对比三个数据之间的差异_
- _speedDiffStatus <T extends CompareDataAttr = CompareData> (current: T, online: T, base: T): SpeedDiffStatusType_
- _@param current 当前版本_
- _@param online 线上版本_
- _@param base 基础版本_
```ts
import { speedDiffStatus } from '@chendf/data-compare'
const current = {
    id: 1,
    name: '名称1',
    test: 1,
    update: 1
}
const base = {
    id: 1,
    name: '名称',
    test: 1,
    update: 2
}
const online = {
    id: 1,
    name: '名称2',
    test: 1,
    update: 2
}
this.speedDiffStatus(current, online, base)
// 结果与 diffStatus 结果一致
```

__diffAttr: 对比两个对象之间的差异，能展示出每个对象节点的差异，并且有存储对应的路径与旧值__
- _diffAttr (origin: unknown, target: unknown, pathStacks: string[] = []): AttrCompareStatus_
- _@param_ origin 当前版本数据。
- _@param_ target 其他版本数据。
- _@param_ pathStacks 可选参数，为当前对比的节点的key路径。
```ts
import { diffAttr } from '@chendf/data-compare'
const diffResult = diffAttr({ a: 2, b: 2, d: 1 }, { a: 1, b: 2, c: 3 })

// 返回结果
{
    type: "update",
    path: "",
    attrStatus: {
        a: {
            type: "update",
            path: "a",
            oldValue: 1
        },
        d: {
            type: "create",
            path: "d"
        },
        c: {
            type: "delete",
            path: "c"
        }
    }
}
```


__updateConfig: 修改配置__
- _updateConfig(config: Partial<DataCompareConfig>)_
- _config:_
    - _childrenKey?: string // 解析为子节点的key_
    - _someKey?: string // 对比的key_
    - _nameKey?: string // 展示的name_


__parse: 将数据自动解析为对比节点 (如果想要自动解析按照自己数据格式解析，可以修改配置信息)__
- _parse<T extends CompareDataAttr = CompareData>(data: T, parent?: CompareTree<T>): CompareTree<T>_
- _parse<T extends CompareDataAttr = CompareData>(data: T[], parent?: CompareTree<T>): CompareTree<T>[]_
```ts
import { parse } from '@chendf/data-compare'
const data = {
    id: 1,
    name: '名称2',
    test: 1,
    update: 2
}
const compareTree = parse(data) // 结果与直接调用 speedCreateCompareNode 一致 （不修改配置的情况下）
```


## 钩子函数
钩子函数是指在对比期间调用的一些方法，可以让你定制化对比。

__beforeCreateCompareNode: 创建对比节点之前调用__。
- _callback：_
    - _@param compareTree 根据当前源创建的节点数据_
```ts
import { beforeCreateCompareNode } from '@chendf/data-compare'
beforeCreateCompareNode(compareTree => {
    // 如果想要对数据进行修改，只需要处理data即可
    compareTree.name = 'update' // example
})
```

__beforeCompare: 在diffCompareTree每个节点之前调用__
- _callback(origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>)_
    - _@param origin 当前数据_
    - _@param target 对比的数据_
    - _@param parent 父节点_


__afterCompare: 在diffCompareTree每个节点之后调用__
- _callback(origin: CompareTree<T>[], target: CompareTree<T>[], parent?: CompareTree<T>)_
    - _@param origin 当前数据_
    - _@param target 对比的数据_
    - _@param parent 父节点_


__beforeDiffStatus: 在diffStatus当前父节点下的每个直属子节点之前调用__
- _callback(current: CompareTree[], online: CompareTree[], currentParent?: CompareTree, onlineParent?: CompareTree)_
    - _@param current 当前数据_
    - _@param online 对比的数据_
    - _@param currentParent current父节点_
    - _@param onlineParent online父节点_


__afterDiffStatus: 在diffStatus当前父节点下的每个直属子节点之后调用__
- _callback(current: CompareTree[], online: CompareTree[], currentParent?: CompareTree, onlineParent?: CompareTree)_
    - _@param current 当前数据_
    - _@param online 对比的数据_
    - _@param currentParent current父节点_
    - _@param onlineParent online父节点_


__afterCompareStatus: 在diffStatus中每个节点对比之后会调用。包括克隆的节点也会调用改钩子__
- _callback(current: CompareTree, online: CompareTree)_
    - _@param current 当前数据_
    - _@param online 对比的数据_


__beforeCloneCompareTree: 对比中有些数据是被删除的，为了维护另一边对应的数据结构，需要手动克隆一份节点数据，改钩子在克隆之前会调用，clone之后会调用 afterCompareStatus__
- _callback(cloneTree: CompareTree, statusType: CompareStatusEnum, parent?: CompareTree, isOnline?: boolean)_
    - _@param cloneTree 需要克隆的数据_
    - _@param statusType clone的状态_
    - _@param parent 当前克隆节点的父节点_
    - _@param isOnline 克隆的是当前数据还是对比数据， true为克隆的对比数据_

### parse钩子 parse钩子不会解析每个节点的时候都调用，如果需要解析每个节点都做处理，请使用 _beforeCreateCompareNode_

__beforeParse: 解析节点之前调用__
- _callback 参数为 parse 方法调用的参数_

__afterParse: 解析节点之后调用__
- _callback(data: T | T[], newNode: CompareTree<T>, parent?: CompareTree<T>)_
    - _@param data 原始数据_
    - _@param newNode 生成的节点数据_
    - _@param parent 父节点数据_