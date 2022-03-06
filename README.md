# data-compare
data-compare是一个对比数据之间差异的一个轻量级库，类似于简化版本的git对比。

## 功能
通过diff算法对比出两个版本数据或三个版本数据之间的属性差异与状态。（新增/删除/修改/交换位置/冲突）
通过diff算法对比出两个数据之间的属性差异。是否有属性删除/新增/修改之类的

## 三个版本数据对比
- 三个版本
    - 当前版本
    - 基础版本
    - 其他版本
    
- 差异获取
    - 当前版本与基础版本对比得到一个差异状态树（currentDiff）
    - 其他版本与基础版本对比得到一个差异状态树（otherDiff）
    - currentDiff 与 otherDiff 对比得到最终的一个差异树
    
__注意：只有三个版本对比才会出现冲突状态。冲突是指当前版本与其他版本都修改了同一个属性则会导致冲突。__


## 数据对比的结构

## 两个版本数据对比
两个版本对比就是指当前版本与其他版本之前对比返回一个差异树。不存在冲突状态

__diffAttr__
- _diffAttr (origin: unknown, target: unknown, pathStacks: string[] = []): AttrCompareStatus_
- _param_ origin 当前版本数据。
- _param_ target 其他版本数据。
- _param_ pathStacks 可选参数，为当前对比的节点的key路径。

```ts
import { diffAttr } from 'data-compare'
const diffResult = diffAttr({ a: 2, b: 2, d: 1 }, { a: 1, b: 2, c: 3 })

// 返回结果
{
    type: 'update', // 表示当前对象状态为修改
    path: '', // 当前对象在父级的路径(key)
    attrStatus: { // 属性状态
        a: { type: 'update', path: 'a' }, // a 属性是修改，路径为 a
        d: { type: 'create', path: 'd' }, // d 属性是新建的，路径为 d
        c: { type: 'delete', path: 'c' } // c 属性是删除的，路径为 c
        // 因为 b 属性没有更改，所以不会展示在结果中
    }
}
```

## 钩子函数
钩子函数是指在对比期间调用的一些方法，可以让你定制化对比。

__beforeCreateCompareNode__：创建对比节点之前调用。
- _param_ callback(data: CompareTree) 触发的回调
```ts
import { beforeCreateCompareNode } from 'data-compare'

beforeCreateCompareNode(data => {
    // 如果想要对数据进行修改，只需要处理data即可
    data.name = 'update' // example
})

```
