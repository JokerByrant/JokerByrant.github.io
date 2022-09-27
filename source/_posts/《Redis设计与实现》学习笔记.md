---
title: 《Redis设计与实现》学习笔记
tags:
  - Redis
  - 后端技术
categories: 后端技术
abbrlink: 60142
date: 2022-09-27 10:26:41
---

本文主要用来记录在阅读《Redis设计与实现》一书时的学习笔记，其中包括一些我总结的知识以及书中我认为比较重要的知识点。`PDF` 文件链接：[《Redis设计与实现》](https://github.com/JokerByrant/iBook/blob/main/Redis%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0.pdf), 建议使用 `PDF XChange Editor` 打开，可以看到其中我添加的一些注释，也可以自己完善。

<!--more-->

## 数据结构和对象

第一部分主要介绍 `Redis` 中的数据结构和对象，包含7个章节，分别对应7种数据类型：

1. 字符串
2. 链表
3. 字典
4. 跳跃表
5. 整数集合
6. 压缩列表
7. 对象
   - 字符串对象 `String`
   - 列表对象 `List`
   - 集合对象 `Set`
   - 哈希对象 `Hash`
   - 有序集合对象 `Sorter Set`

### 字符串

`Redis` 的数据库中，包含字符串值的键值对在底层都是用 `SDS` 实现的。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425566658111d486022448fb11304ae4608ad3cc48.png)

`SDS` 在 `Redis` 中的应用：

1. `Redis` 数据库中的字符串值的存储
2. 缓冲区的实现(AOF缓冲区、客户端状态的输入缓冲区)

`SDS` 相比于 `C` 字符串优势：

- 效率：修改字符串的效率(SDS中的len保证了这个操作时间复杂度为O(1)、free实现的惰性删除避免了空间的重复分配)
  
  ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642556765811029d144e11020c71c32a7ec186f663f.png)
- 安全性：缓冲区溢出的问题(SDS实现了自己的空间分配策略解决这个问题)
- 功能：主要是二进制安全方面(C字符以"\0"作为判断字符结束的标志位，而SDS通过len来进行这个判断，因此可以存储更多类型的字符，比如图片)
  
  ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425568658133dd6dbcdd7447f42fbe4b75d35f27ad.png)

`SDS` 的 `API`：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255694584d195b87dc0f5460944d2bea46aaab59f.png)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255703580e62f906b81cc3ab6a86804fd2e12ba58.png)

`Redis` 字符串相关知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255711585738af8943c812319dcb3652b12c165d2.png)

### 链表

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255728582bdecbfb27a28071701f3a8ddf87865e5.png)

链表在 `Redis` 中的应用：

1. 列表(List)的键底层实现之一：当一个列表键包含了数量比较多的元素，又或者列表中包含的元素都是比较长的字符串时，Rrdis就会使用链表作为列表键的底层实现。
2. 发布与订阅
3. 慢查询
4. 监视器

链表相关的 `API`：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255738581f508768c2a9c9d96e1b8b11e70ed6bab.png)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642557535854caccde40fb77937322579c9a2772605.png)

总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255768585fa6cde813c68c99395f8384e00ca7c9e.png)

### 字典

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255777581dbd9086d18d076851adfce7f6316d414.png)

字典在 `Redis` 中的应用：

1. `Redis` 数据库底层实现
2. `Hash` 键的底层实现：当一个哈希键包含的键值对比较多，又或者键值对中的元素都是比较长的字符串时，Redis就会使用字典作为哈希键的底层实现。

`Redis` 的字典使用哈希表作为底层实现。散列表（Hash table，也叫哈希表），是根据关键码值(Key value)而直接进行访问的数据结构。也就是说，它通过把关键码值映射到表中一个位置来访问记录，以加快查找的速度。这个映射函数叫做散列函数，存放记录的数组叫做散列表。

Hash表节点中的next属性是为了解决Hash值冲突问题的，新添加的键如果Hash重复，那么将添加到链表首位。

有关 `Reids` 对哈希表的实现有三个概念需要了解一下：

1. **`rehash` 操作。** `rehash` 操作主要是用来解决键冲突的，当哈希表保存的键值对达到某个数量级时，会进行一次 `Hash` 表的扩容。这时 `ht(1)` 就排上用场了，给 `ht(1)` 按照规则分配了新空间后，重新计算 `ht(0)` 中数据的 `Hash` 值，之后将 `ht(0)` 中的数据移到 `ht(1)` 中。然后将 `ht(1)` 置为 `ht(0)`，再创建一个新的空 `ht(1)`，`rehash` 完成。
2. `Redis` 对哈希表的扩容和收缩的时机。
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255787581ed51a5c9f1a225f47e70b7c2a6d7b44b.png)
3. **渐进式 `rehash`**。
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642559215821664255920833.png)
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642559525831664255952430.png)

字典相关的 `API`：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642559635831cdd432489384733e4ca291b1be6d82e.png)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664255971583b4b2c4f3c4bef224aeeaba0030e08a96.png)

重点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642559805851346a7aa92160b478e6a4a05b44b04f7.png)

### 跳跃表
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425600158617598e09511af7e20ec1dac809ef6f6c.png)

跳跃表在 `Redis` 中的应用：

1. 有序集合的键(Sorted List)
2. 集群节点的内部数据结构

`Redis` 中的跳跃表由 `zskiplist` 和 `zskiplistNode` 构成，`zskiplistNode` 是跳跃表的真正构成元素，单单使用 `zskiplistNode` 也能构建一个跳跃表，引入 `zskiplist` 则是为了更方便的管理跳跃表. 

- 跳跃表的遍历流程：与链表的遍历过程类似，只用到了前进指针 `*forward` 属性，跨度属性 `span` 没有被用到。
- 跨度属性 `span` 在查找元素时会被使用到，它使得查找元素的操作时间复杂降到 O(n) 以下。
- 跳跃表中元素的顺序由分值属性 `score` 来决定，根据 `score` 从小到大进行排序。`score` 可以相同，但是其中的成员对象属性 `obj` 必须唯一(Set的定义)。

跳跃表 `API`：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256013581d032b11e2f036435cf687c345234fd79.png)

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256029581d9d02e97ad2bb3ad905d46eac4b9fd15.png)

### 整数集合

`Redis` 中整数集合的应用：

1. 集合(List)，在元素数量不多并且元素全部是整数时使用这种结构。

整数集合的升级过程：

- 升级机制的产生与C语言的语言特性有关，因为C语言是静态类型语言，为了避免类型错误，通常不会将两种不同类型的值放在同一个数据结构里面。
- 所以如果一开始定义的数据类型为 `int16_t`，之后添加的元素大小超过了这个的限制，那么就需要进行升级操作。
- 而为什么不一开始就定义为 `int64_t` 呢，这是为了节约内存而考虑的。
- 整数集合不支持降级操作

整数集合`API`：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425603858036d4697db2952dc41098274fb33b7e21.png)

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642560465821daded4605a0a2ea6e48a88a509d4766.png)

### 压缩列表

`Redis` 中压缩列表的应用：

1. 列表(List) 键的实现。当一个列表键只包含少量列表项，并且每个列表项要么就是小整数值，要么就是长度比较短的字符串，那么 `Redis` 就会使用压缩列表来做列表键的底层实现。
2. 哈希(Hash) 键的实现。当一个哈希键只包含少量键值对，并且每个键值对的键和值要么是小整数值，要么就是长度比较短的字符串时，那么Redis就会使用压缩列表来做哈希键的底层实现。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256054581327f1167c965be5e08d3d4b8cfb9174e.png)

一个压缩列表可以包含多个节点，存储在属性 `entryX` 中；节点数量保存在属性 `zllen` 中，`zllen` 的类型是 `uint16_t`，可存储的最大数值是65535，也就是说当节点数量超过这个数值时，这个值会固定为65535，而节点真实数量需要遍历整个压缩列表才能拿到。

压缩列表从后往前的遍历过程：压缩列表中每个节点都有一个 `previous_entry_length` 属性，这个属性记录了前一个节点的长度，通过当前节点起始地址的指针c，减去 `previous_entry_length` 属性的值，就可以得到指向前一个节点起始地址的指针p。

压缩列表 `API`：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642560665811e2a45b19f1bd28b67d723815e5ef124.png)

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256077582b8a30a6f6f19a9ffef0bcc2904bcb50e.png)

### 对象

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256090582467533938f386d5e4c949deb7f027c15.png)

`Redis` 对对象的设计有些类似 Java 中封装。`Redis` 中的5种对象是暴露给用户的外层Api，而对象底层的实现则根据情况使用不同的数据结构，可以优化对象在不同场景下的使用效率。

`Redis` 中对象 `redisObject` 的数据结构，包含三个属性：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256136582cf6bdba1b1c245b40e9f2916f791893f.png)

1. `type`：类型
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256144586ad8dfe8f40978e4b2b782ac29e8c8eab.png)
2. `encoding`：编码(决定了对象使用什么数据结构作为对象的底层实现)
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642561515820abe5c970179f15878e8254c10a0be5e.png)
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642561585848a7eabad6c2efdaa286f9aa9381d601a.png)
3. `*ptr`：指向底层实现数据结构的指针

`Redis` 根据不同的使用场景来为对象设置不同的编码(底层数据结构)，实现效率最优化。

引出一个问题：**对象在不同场景下使用的数据结构转变时机是如何确定的？**

#### 字符串对象

字符串对象包含三种编码格式：

1. 长度大于32时：`raw`
2. 长度小于32时： `embstr`
3. 保存的是可以使用 `long` 表示的整数值时：`int`

`raw` 和 `embstr` 都使用 `redisObject` 和 `sdshdr` 两个结构表示字符串对象，`embstr` 的优势是将这两个结构放在一块内存空间中，如左图所示；而 `raw` 则是为这两个结构分别创建内存空间。

字符串对象编码的转换场景：

1. `int` 型编码的字符串数组中添加了字符串值，字符串对象将变为 `raw`；
2. `embstr` 类型的对象发生修改时，将自动转变为 `raw` 类型，原因是 `embstr` 类型没有修改的方法。#### 列表对象

字符串相关的 `Redis` 命令：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425617258237b9de4d0c1e76a39e525c151d4f06a6.png)

#### 列表对象

列表对象包含两种编码格式：

1. `ziplist` (底层是压缩列表)。每一个压缩列表的节点保存一个列表元素。
2. `linkedlist` (底层是双端链表)。每一个双端链表的节点保存一个字符串对象，字符串对象中保存着列表元素。

列表对象编码的转换时机：

1. 列表对象满足下面两个条件时，会使用 `ziplist` 进行编码：列表对象中所有的字符串元素长度都小于64字节；列表对象中的元素数量小于512个。
2. 如果不能满足上面的两个条件，那么列表对象需要使用 `linkedlist` 编码。

列表对象相关的 `Redis` 命令：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642570365810197a5c91f8dd37aaa3fc3d0e57db345.png)

#### 哈希对象

哈希对象包含的编码格式：

1. `ziplist`(压缩列表)。当有新的键值对要加入到哈希对象时，程序先将键对应的压缩列表节点推入到列表队尾，再将值对应的列表节点推入到列表队尾，所以键值对总是相邻的。
2. `hashtable`(字典)。字典保存键值对时，键和值都分别用一个字符串对象表示。

哈希对象编码转换时机(与列表对象类似)：

1. 哈希对象满足下面两个条件时，会使用 `ziplist` 进行编码：哈希对象中所有的键值对的键和值对应的字符串长度都小于64字节；哈希对象保存的键值对数量小于512个。
2. 如果不能满足上面的两个条件，那么哈希对象需要使用 `hashtable` 编码。

哈希对象相关的 `Redis` 命令：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256194583594dd610a65bda7d7a494dc70adf90e1.png)

#### 集合对象

集合对象包含的编码格式：

1. `intset`(整数集合)。
2. `hashtable`(字典)。字典的每个键都是一个字符串对象，每个字符串对象代表一个集合元素，而字典的值都被设置为 `null`。

集合对象的转换时机：

1. 当集合对象可以同时满足以下两个条件时，对象使用 `intset` 编码：集合对象保存的所有元素都是整数值；集合对象保存的元素数量不过512个。
2. 不能满足这两个条件的集合对象需要使用 `hashtable` 编码。

集合对象相关的 `Redis` 命令：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256205605c5d2922f099194075ebaa4e6008520e4.png)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256212580675f6af575971a9bfb529ad9f868d7e4.png)

#### 有序集合对象

有序集合对象包含的编码格式：

1. `ziplist`(压缩列表)。每个集合元素使用两个紧挨在一起的压缩列表节点来保存，第一个节点保存元素成员(`member`)，第二个节点保存分值(`score`)。
2. `skiplist`(跳跃表)。这个编码的有序集合对象使用 `zset` 结构作为底层实现，`zset` 结构包含一个 `skiplist`属性(跳跃表) 和 `hashtable`属性(字典)。
   - 其中跳跃表按照 `score`(分值) 大小保存集合元素，节点中的 `object` 属性保存了元素成员，`score` 属性保存了元素分值。跳跃表保证了有序集合使用 `ZRANK`、`ZRANGE` 等范围型命令的时间复杂度为 O(1)。
   - 而字典则为有序集合的每个元素创建了 `member`(成员) -> `score`(分值) 的映射。字典保存了有序集合查找成员分值 `ZSCORE` 的操作时间复杂度为 O(1)。

> 注：虽然有序集合同时使用两个结构来保存集合元素，但是它们通过指针共享了相同元素的成员和分值，也就是说它们指向的都是同一内存空间的元素，所以不会造成内存浪费。

有序集合编码的转换时机：

1. 当有序集合对象可以同时满足以下两个条件时，对象使用 `ziplist` 编码：有序集合保存的元素数量小于128个；有序集合保存的所有元素成员的长度都小于64字节。
2. 不能满足以上两个条件的有序集合对象将使用 `skiplist` 编码。

有序集合对象相关的 `Redis` 命令：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642562295865bf6cb4637da038e71212b20fd69826d.png)

#### 内存回收

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256261581ae128d1fdcef6a0dca2af5a2d38847b2.png)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256267582387a6305143db2e7cf1f854d81a9289b.png)

#### 对象共享

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256273584e12db8e061be54eb33b5e982d0f90d51.png)

对象相关知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642562805852111ae1ae417d560c92033e272470c6d.png)

## 单机数据库

`Redis` 数据库使用 `redisDb` 结构表示，每个 `redisDb` 中通过 `dict`(字典)属性保存数据库中的所有键值对，键是字符串对象，值是String、List、Hash、Set、SortedSet中的一种。

`redis` 通过一个 `dict`(字典) 结构的 `expires` 属性来保存数据库中所有键的过期时间，这个 `expires` 称为过期字典。它的键是一个指针，指向键空间中的某个键对象(某个数据库键)；值是一个 `long` 类型的整数，这个整数保存了对应键的过期时间 --- 毫秒精度的 `UNIX` 时间戳。

`redis` 判断一个键是否过期的方法:

1. 检查给定键是否存在于过期字典：如果存在，那么取得键的过期时间。
2. 检查当前UNIX时间戳是否大于键的过期时间：如果是的话，那么键已经期；否则的话，键未过期。

删除过期键的3种策略：

1. 定时删除，创建一个定时器任务，键过期后立刻执行删除。优点：能够保证过期键被尽快的删除，不占用内存资源；缺点：占用 `CPU` 资源。
2. 惰性删除，键过期时不立刻处理，之后获取键时判断是否过期，如果过期就执行删除。优点：不占用 `CPU` 资源。缺点：占用内存资源，如果处理不当可能会导致某些过期键一直存在，引发内存泄漏。
3. 定期删除，每隔一段时间检查数据库中过期键，执行删除。优点：中和了上面两种方法的优缺点。缺点：定情删除的频率策略必须合理设置，如果间隔过长会对内存资源不友好，间隔过低又会对 `CPU` 资源不友好。

`Redis` 使用惰性删除和定期删除结合的方式处理过期键：

- 惰性删除。每次调用 `redis` 的读写命令前都会检查对应键是否过期，如果过期就移除对应键，如果未过期就不做处理(如果是读操作就返回 `null`)。
- 定期删除。`reids` 中有一个周期性操作：`serverCron`，当它被调用时，在规定的时间内，会分多次遍历服务器中的各个数据库，从数据库的 `expires` 字典中随机检查一部分键的过期时间，并删除其中的过期键。

`RDB` 文件：`redis rdb` 文件是 `redis` 在内存中所存储全部数据的二进制表示，结构非常紧凑。

`AOF` 持久化功能：`AOF`持久化是通过保存 `Redis` 所执行的写命令来记录数据库状态的。

惰性删除和定期删除对 `AOF` 持久化的影响：当键过期时，但是没有被移除，它不会被 `AOF` 文件记录；只有当触发惰性删除和定期删除，导致这个键被真正从内存移除了，才会将对应的操作写入 `AOF` 文件。

主从复制下 `Redis` 的过期键删除流程如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256292581853be65284cbe78598c423eaaf960c3a.png)

`Redis` 中服务器通知的实现原理。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425630058484b15e24aa58c9043b132dc0b20c85cc.png)

`Redis` 数据库相关知识总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642563105824d6f1027bf67d3b03fe789a1ae7eafdd.png)

## `RDB` 持久化

`RDB` 持久化功能就是将 `Redis` 在内存中的所有数据保存到磁盘中去，对应的文件是 `rdb` 文件。

`redis rdb` 文件是 `redis` 在内存中所存储全部数据的二进制表示，通过该文件可以还原生成 RDB 文件时的数据库状态。

如果 `Redis` 开启了 `AOF` 持久化功能，那么服务器会优先使用 `AOF` 文件还原数据库状态。

`AOF` 持久化功能：`AOF`持久化是通过保存 `Redis` 所执行的写命令来记录数据库状态的。

`SAVE` 和 `BGSAVE` 命令：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256329587c15f4df6c5af8d4339a81121c5adfe99.png)

执行 `RDB` 持久化的时机：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256340581c600f1d86a64e76b867754a206bcfb99.png)

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642563475823a6720e456367a94764c0fe96fc6168e.png)

## `AOF` 持久化

- RDB持久化保存的是键值对数据；
- AOF持久化保存的是操作键值对的命令。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425635758288c271497a7af8ab0e3affb2ac2bbbf7.png)

AOF文件的写入和同步策略由参数 `appendfsync` 来决定(见下表)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642563645847dc793e4aa3204f2c5863a8720dd74dc.png)

`Redis` 通过 `flushAppendOnlyFile()` 方法来将 `aof_buf` 缓冲区的数据写入到 `AOF` 文件中，在这个方法中根据 `appendfsync` 选项来决定 `AOF` 的持久化行为。 

`Redis` 可以通过读取并执行AOF文件中的写命令，来完成对Redis数据库的还原。

通过 `AOF` 文件重写机制来解决 `AOF` 文件过大的问题：创建一个新的 `AOF` 文件，然后将 `Redis` 中已有的键值对转化为精简过的写入命令存储到新 `AOF` 文件中。所以相对于旧 `AOF` 文件来说，新文件不包含任何浪费空间的冗余命令，因此新文件的体积会小很多。

`AOF` 重写操作在后台运行(子进程)，这个过程进行时 `Redis` 接收到的所有写命令都会写入到新开辟的 **AOF重写缓冲区** 中，待 `AOF` 重写子进程执行结束，AOF 缓冲区中的所有命令都会被写入到新AOF文件中，然后新AOF文件改名，替换旧AOF文件。

`AOF` 持久化相关知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642563795837d424efd8c79177efcf8171fcfd145b6.png)

## 事件

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425639258226ff860bcd2e4ecfdfe3c82a18cb41f8.png)

### 文件事件

`Redis` 的文件事件就是通过监听 `Socket`，并根据 `Socket` 目前执行的任务来为其关联不同的事件处理器。

同一时间可以有多个 `Socket` 连接，`Redis` 通过 `I/O` 多路复用程序监听这些连接，将它们放到一个队列中，然后通过：有序、同步、每次一个的方式向文件事件分派器传送 `Socket`。文件事件分派器接收到套接字后，根据套接字对应的事件类型调用相应的时间处理器。 

`Redis`  的 `I/O` 多路复用程序有多个 `I/O` 多路复用库可选，程序在编译时会选择系统中性能最高的 `I/O` 多路复用函数库作为底层实现。

`Redis` 中的文件事件处理其汇总：

- 连接应答处理器(对连接服务器的各个客户端进行应答)
- 命令请求处理器(接收客户端传来的命令请求)
- 命令回复处理器(向客户端返回命令的执行结果)
- 复制处理器(主服务器和从服务器进行复制操作时)

`Redis` 的几个文件事件处理器工作流程如下：

- 启动一个 `Redis` 服务，程序会将连接应答处理器和服务器监听套接字的 `AE_READABLE` 事件关联起来。
- 当一个 `Redis` 客户端向服务器发起连接时，套接字会产生 `AE_READABLE` 事件，触发连接应答处理器的执行。服务器会对客户端的连接请求做出应答，并创建一个客户端套接字，然后将客户端套接字的 `AE_READABLE` 事件与命令请求处理器关联。
- 之后客户端向服务器发送一个命令请求，客户端套接字产生 `AE_READABLE` 事件，触发命令请求处理器执行。
- 如果执行命令时服务端给客户端做出了命令回复，那么服务器会将客户端套接字的 `AE_WRITABLE` 事件和命令回复处理器关联，当客户端尝试读取命令回复时，客户端套接字产生 `AE_WRITABLE` 事件，触发命令回复处理器执行。当命令回复处理器将命令回复全部写入套接字后，服务器会解除客户端套接字的 `AE_WRITABLE` 事件与命令回复处理器之间的关联。

### 时间事件

时间事件的保存方式：使用无序链表，无序是指不按事件的执行时间来排序。当时间事件执行器运行时，需要遍历链表中所有的时间事件，查找所有已到达的时间事件，然后调用相应的事件处理器完成处理。

时间事件应用实例：`ServerCron` 函数，每隔一段时间执行一次。

上文提到的 `Redis` 中过期键值对的清理策略：定期删除 & 惰性删除，其中定期删除就通过这个函数触发。

此外 `RDB`持久化 和 `AOF`持久化 的操作也是通过这个触发：

- `RDB` 持久化是由用户配置的策略，比如 `900s` 内进行了 `1次` 修改，或者 `300s` 内进行了 `10次` 修改就会触发 `RDB` 持久化操作，这个检查就是通过 `ServerCron` 进行的。
- `AOF` 持久化则是每次执行修改操作后，命令会被写入 `aof_buf` 中，`ServerCron` 则会定期检查 `aof_buf`，考虑是否将 `aof_buf` 中的数据写入到 `AOF` 文件中去，具体是否执行要看 `AOF` 持久化的策略。

`Redis` 事件知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425640958186b630feb12fcd17190883dc16389f10.png)

## 客户端

问题：`Redis` 是如何使用单线程来处理多命令请求的？
答：使用 `I/O` 多路复用技术。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642564185833b4fa148cc2754088d70c226392a2aa8.png)

当一个客户端发出一个命令请求时，这个命令会被服务器保存到对应的客户端状态的输入缓冲区(`querybuf`)中。之后服务器会对命令请求进行内容分析，然后将得到的 **命令参数** 保存到客户端状态的 `argv` 属性中，将 **命令参数的个数** 保存到客户端状态的 `argc` 属性中。
其中 `argv` 中是客户端要执行的命令(是一个数组)，`argv[0]` 表示要执行的操作(`set`、`delete`、`get`等)，`argv[1]` 记录了 `key` 值，`argv[2]` 记录了 `value` 值。服务器会根据 `argv[0]` 的值找到对应的 `redisCommand`，之后就会调用命令实现函数，完成一个命令的执行。

客户端执行命令拿到的命令回复会被放到输出缓冲区中，有两种结构：

- 固定大小缓冲区：使用一个 `buf` 数组保存数据，最大值为 16 * 1024.
- 可变大小缓冲区：当回复超出上面的大小时，会使用可变大小缓冲区。这个结构使用链表连接多个字符串对象，可以保存一个非常长的命令回复。

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642564975863b26b4557623dd53dff8efd163025b65.png)
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256518581c30711a36b5cf81d132546c79bdf0627.png)

## 服务器

### 初始化服务器

1. 初始化服务器状态。创建 `struct redisServer` 类型的变量 `server` 作为服务器状态。通过 `initServerConfig` 函数完成初始化，主要工作有：
   - 设置服务器的运行ID。
   - 设置服务器的默认运行频率。
   - 设置服务器的默认配置文件路径。
   - 设置服务器的运行架构。
   - 设置服务器的默认端口号。
   - 设置服务器的默认RDB持久化条件和AOF持久化条件。
   - 初始化服务器的LRU时钟。
   - **创建命令表。**
2. 载入配置选择。这个阶段主要是工作就是 **载入用户给定的配置参数和配置文件**，并根据用户设定的配置，对 `server` 变量中属性的值进行修改。如果用户没有指定配置，那么将沿用在初始化服务器状态时默认的配置。
3. 初始化服务器数据结构。**命令表** 在第1步 初始化数据库状态阶段就已经创建完成了，这一步是对下面几种属性进行创建：
   - `server.clients` - 链表。记录了所有的客户端状态。
   - `server.db` - 数组。记录了服务器中所有的数据库。
   - `server.pubsub_channels` - 字典。保存频道订阅信息。
   - `server.pubsub_patterns` - 链表。保存模式订阅信息。
   - `server.lua`。执行 `Lua` 脚本的 `Lua` 环境。
   - `server.slowlog`。保存慢查询日志。
   
   这一步通过 `initServer()` 函数完成初始化，当这个函数执行完毕，服务器在输出日志中打印出 `Redis` 的图标和版本号信息。
4. 还原数据库状态。通过载入 `RDB` / `AOF` 文件完成数据库状态的还原(优先使用 `AOF` 文件进行还原)。启动 `Redis` 服务时，可以看到这一步的日志输出：
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425654158157cd378b50274ca698e0330ec12c7703.png)
5. 执行事件循环。初始化的最后一步，服务器打印下面的内容，之后开始执行服务器的事件循环。
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425654858594ee1bec25e53453a8e93a3212e654d7.png)

### 命令请求的过程

总结一下 `Redis` 执行命令请求的过程：

1. 用户输入命令请求，客户端将这个命令转换为协议格式发送给服务器
2. 服务器读取命令，将其保存到客户端状态的输入缓冲区，然后解析协议并将参数和参数个数保存到客户端状态的 `argv` 和 `argc` 属性中
3. 接着服务器调用命令执行器：
   - 首先根据客户端状态中的 `argv[0]` 从命令表查找对应的命令，将找到的命令保存到客户端状态的 `cmd` 属性中；
   - 执行命令的必要条件都拿到了(客户端状态中的三个属性：`cmd`、`argv`、`argc`)，接着进行执行命令前的准备工作，进行一下参数的检查；
   - 然后执行命令，调用 `client.cmd.proc(client)`，调用完毕会产生对应的命令回复，命令回复保存在客户端状态的输出缓冲区中(`buf`、`reply`)；
   - 最终执行一些后续操作(慢查询日志、AOF持久化、命令同步)。
4. 给客户端发送命令回复。
5. 客户端收到命令回复，将其转换为可读的格式，并打印给用户。

### `ServerCron` 函数

每隔 `100ms` 执行一次。

总结一下 `Redis` `ServerCron` 函数的功能：

1. 更新服务器时间缓存。每 `100ms` 对服务器状态中的两个时间属性进行更新： `unixtime`(秒级精度 `UNIX` 时间戳)、`mstime`(毫秒级精度 `UNIX` 时间戳)
2. 更新 `LRU` 时钟，每 `10s` 更新一次.
3. 更新服务器每秒执行命令次数。调用 `trackOperationsPerSecond()` 函数，这个函数采用抽样计算的方式估算并记录服务器最近一秒处理的命令请求数量。
4. 更新服务器内存峰值记录(`stat_peak_memory` 属性)。
5. 处理 `SIGTERM` 信号。服务器接收到这个信号后悔打开服务器状态的 `shutdown_asap` 标识，`ServerCron` 会对 `shutdown_asap` 属性进行检查，如果值为1则执行关闭服务器的操作(关闭前会执行 `RDB` 持久化的操作)。
6. 管理客户端资源。`ServerCron` 每次执行会调用 `clientsCron` 函数，对客户端做两个检查：
   - 释放客户端资源(客户端与服务器之间长时间未互动)。
   - 释放并重置输入缓冲区(当输入缓冲区超过一定长度后)。
7. 管理数据库资源。调用 `databasesCron` 函数，删除过期键，对字典进行收缩.
8. 执行被延迟的 `BGReWriteAOF` 命令 。这个命令会被延迟的原因是，服务器在执行 `BgSave` 命令的期间，如果客户端向服务器发来了 `BGReWriteAOF` 命令，那么服务器会将 `BGReWriteAOF` 命令延迟到 `BGSave` 命令后执行，并且 `aof_rewrite_scheduled` 会被标识为1。`ServerCron`运行时，如果 `BgSave` 和 `BgReWriteAOF` 命令都没在执行，并且 `aof_rewrite_scheduled` 属性为1，那么就执行 `BgReWriteAof` 命令。
9. 检查持久化操作的运行状态。服务器状态分别使用 `rdb_child_pid` 和 `aof_child_pid` 属性记录 `BgSave` 和 `BgReWriteAof` 命令的子进程 `ID`，`ServerCron` 做的操作就是检查这个属性的值，如果不为 `-1`，那么执行 `wait3()`，检查子进程是否有信号返回。如果有，表示 `RDB` 文件或 `AOF` 文件已重写完毕，那么就执行后续操作(新的 `RDB`/`AOF` 文件替换旧的)；如果没有，不作处理。
10. 将 `AOF` 缓冲区中的内容写入 `AOF` 文件。
11. 关闭异步客户端。(输出缓冲区超过大小限制的客户端)
12. 增加 `cronloops` 计数器的值。这个计数器的作用就是实现 “每执行 `ServerCron` N 次就执行一次指定代码” 的功能。

服务器相关知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256556580cb4b86f0dbcb4043dc247b3ece0f9c1b.png)

## `Redis` 独立功能的实现

### 发布和订阅功能

客户端可以订阅 **频道** 和 **频道对应的模式**，当其他客户端向频道发送消息，**频道的订阅者** 和 **频道匹配的模式的订阅者** 都会收到这个消息。

四个命令：

- 订阅频道：`Subscribe`
- 退订频道：`UnSubscribe`
- 订阅模式：`PSubscribe`
- 退订模式：`PUnSubscribe`

服务器状态中 `pubsub_channels` 字典用来保存频道的订阅关系：

- 键：被订阅的频道
- 值：所有订阅这个频道的客户端(是一个链表)

服务器状态中 `pubsub_patterns` 链表用来保存模式的订阅关系：

- 链表中的每个节点都是一个 `pubsubPattern` 结构的属性，每个 `pubsubPattern` 中包含两个属性：`pattern` - 被订阅的模式，`client` - 订阅模式的客户端。

服务端指定频道接收到消息后，会将消息发送给对应频道的订阅者(从 `pubsub_channels`字典中查找对应频道的客户端)，和频道绑定模式的订阅者(从 `pubsub_patterns` 链表中找到对应的客户端)。

查看订阅信息的一些命令：

- `pubsub channels [pattern]`：查看服务器当前被订阅的频道。
- `pubsub numsub [channel-1 channel-2 ....]`：返回对应频道的订阅者数量
- `pubsub numpat`：服务器当前被订阅模式的数量。

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256565584b633d873bc8e9626825116368533f71f.png)

### 事务

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642565745801941e32be9d7e1a04540bffe519074b6.png)

`Redis` 事务提供了一种将多个命令请求打包，然后一次性、按顺序地执行多个命令的机制，并且在事务执行期间，服务器不会中断事务而改去执行其他客户端的命令请求，它会将事务中的所有命令都执行完毕，然后才去处理其他客户端的命令请求。

事务分下面3个阶段：

1. 事务开始。通过 `MULTI` 命令开启事务。
2. 命令入队。服务器拿到命令后，会判断是否将命令放入事务队列，也就是除了提交事务的其他命令都会被放入事务队列。
3. 事务执行。当服务器收到事务提交的命令时，会从事务队列取出事务并执行。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256580581ba613646ff5972a61f8fe6c51208fcb1.png)

每个 `Redis` 客户端都包含一个事务状态属性，使用 `multiState` 类型存储，`multiState` 中包含了两个属性：

- 事务队列(`multiCmd *commands`)
- 已入队命令计数(`int count`)

事务的执行过程见下图：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425658858113c38a905eba47e2328c1eac45de46e4.png)

#### `Watch` 命令

`WATCH` 命令是一个乐观锁（`optimistic locking`)，它可以在 `EXEC` 命令执行之前，监视
任意数量的数据库键，并在 `EXEC` 命令执行时，检查被监视的键是否至少有一个已经被修改过了，如果是的话，服务器将拒绝执行事务，并向客户端返回代表事务执行失败的空回复。

`Redis` 通过一个 `watched_keys` 字典来保存所有被监视的键。假设一个键A被加上了 `Watch` 事务，表示它正在被监视。如果这时对这个键执行了修改的操作，比如 `SET、LPUSH、SADD` 等命令，这些命令执行之后会调用 `multi.c/touchWatchKey` 对 `watched_keys` 字典进行检查，检查到字典中包含键A，`touchWatchKey` 会将被修改键的客户端的 `REDIS_DIRTY_CAS` 标识打开。`touchWatchKey` 伪代码如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256602584eb082f630d254e1d3004464265c4fe2e.png)

当事务提交时，会判断客户端的 `REDIS_DIRTY_CAS` 是否打开，如果打开表示客户端提交的事务不安全，服务器会拒绝执行该事务。服务器判断是否执行事务的过程如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425660958160a0ebf960bea1d73bf4a08fef8daa50.png)

#### ACID

1. **原子性。**事务中的命令要么都执行，要么都不执行(出现错误)。
   
   `Redis` 中都不执行的情况是只有在 **命令入队** 时出现错误才会触发，在 **命令执行** 阶段出现的错误不会影响别的命令执行。
   
   **`Redis` 中不支持事务的回滚操作。**体现在命令执行阶段发生错误时的处理，当命令执行阶段有一条命令发生错误，事务不会回滚：**事务的后续命令不会受影响，之前执行的命令也不会收影响。**
2. **一致性。**数据库中的数据没有包含错误的数据。
   
   **命令入队** 阶段发生错误，服务器会拒绝执行这个事务。
   
   **命令执行** 阶段发生错误，未执行的命令不会受影响，已执行的命令也不会受影响。
   
   **服务器停机** 导致的一致性问题 `Redis` 处理如下：
   - 如果 `Redis` 运行在无持久化内存模式，重启后数据库空白，不会出现数据不一致情况；
   - 如果 `Redis` 运行在 `RDB/AOF` 模式下，那么重启后可以利用 `RDB/AOF` 文件恢复数据，保证数据的一致性。
3. **隔离性。**多个事务并发执行时不会相互影响，并且在并发阶段执行的事务和串行阶段执行的事务结果完全相同。
   
   `Redis` 是单线程的方式执行事务(串行)，所以隔离性得到了保证。
4. **持久性。**事务执行完毕时，事务执行后得到的结果都被保存到了永久性介质中了。
   
   `Redis` 事务的持久性由 `Redis` 使用的持久化模式决定：
   - 服务器在无持久化的内存模式下运行时，**不具有持久性**。
   - 服务器在 `RDB` 持久化模式下运行时，只有在特定情况下才具有持久性，这种情况也**不能保证持久性**。
   - 服务器在 `AOF` 持久化模式下运行时，当 `appendfsync` 选项值为 `always` 时，程序总会在执行命令后将命令数据保存到硬盘中(`AOF` 文件)，所以这种情况 **可以保证持久性**。
   - 服务器在 `AOF` 持久化模式下运行时，当 `appendfsync` 选项值为 `no` 时，命令数据写入硬盘的时机由操作系统决定，这种情况也 **不能保证持久性**。
   - 服务器在 `AOF` 持久化模式下运行时，当 `appendfsync` 选项值为 `everysec` 时，程序每隔一秒才会将命令同步到硬盘，这种情况 **不能保证持久性**。
   - 特殊情况，在 `AOF` 模式下，`appendfsync` 选项为 `always`，这时如果打开了 `no-appendfsync-on-rewrite` 配置，在执行 `BGSAVE` 或 `BGREWRITEAOF` 时，服务器会暂时停止 `AOF` 文件的同步，这时如果 `Redis` 停机，那么数据可能会没有写入硬盘，所以这种情况也 **不能保证持久性**。
   - 无论在什么持久化模式下运行时，只要在每个命令执行后加上一个 `SAVE` 命令，也能保证事务的持久性(**效率很低，不实用**)。

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256660581751ed360b5beade48655488033c66484.png)
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642566705830ddfdbb0c40886bbb1e4dd008faa506d.png)

### `Sort` 命令

现在要对 `nums` 列表进行 `sort` 排序操作，具体执行过程：

- 创建一个长度为 `nums.length` 的数组，数组项是 `redisSortObject` 结构，`redisSortObject` 包含两个关键属性：
  - `obj` 指针：指向 `nums` 列表的各个项
  - `u.score`：存储列表项的值
- 之后根据 `u.score` 的值对数组项进行排序，之后遍历数组，依次返回数组中索引从小到大的项。

`redisSortObject` 的定义如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256680583596ad0ff8bc370c36a40c8fd0c57e891.png)

>  对字符串列表的排序原理类似，使用 `sort alpha xxx` 命令

`Redis` 的排序使用了 **快速排序** 算法。

`sort` 命令包含多个选项：`BY`、`LIMIT`、`GET`、`STORE` 等，如果同时传入了多个选项，那么它们的执行顺序是：`Sort Alpha/ASC/DESC/BY` -> `LIMIT` -> `GET` -> `STORE`。选项摆放的位置不会影响 `SORT` 命令的排序结果(除 `GET` 外)。

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256691583117207f2fe11f6b5bb289586b3716241.png)

### 慢查询日志

`Redis` 的慢查询日志中记录的是：**执行时间超过给定时长的命令请求。**用户可以通过这个功能产生的日志来监视和优化查询速度。包含两个与之相关的命令：

- `slowlog-log-slower-than` 指定执行时间超过多少微秒的命令会被记录到日志上。
- `slowlog-max-len` 指定服务器上最多保存多少条慢查询日志。

通过 `slowlog get` 命令获取服务器上的慢查询日志。

慢查询日志相关的属性：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642567055824b3429be85b5f125b5e940ff6e5ad76d.png)

服务器记录慢查询日志的流程是：

- 每次执行命令前后记录的微秒格式的UNIX时间戳，它们的差值就是执行命令耗费的时长。
- 这个时长传递给 `slowlogPushEntryIfNeeded()`，这个函数会检查执行时长是否超过 `slowlog-log-slower-than` 设置的时间。超过了就创建新的日志，并将新日志添加到 `slowlog` 链表的表头。然后将 `slowlog_entry_id` 的值增加1。
- 检查日志长度 (`slowlog` 链表长度) 是否超过 `slowlog-max-len` 的长度，如果超了，那么就将多出来的日志从 `slowlog` 链表中移除。

执行流程的伪代码如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642567125842851de778e99530297669d0390bd47a5.png)

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425672058275d815ab40412532e93615b446c8af89.png)

### 监视器

客户端可以通过 `MONITOR` 命令来将自己注册为一个监听器，服务端收到的命令都会被实时的打印出来。客户端调用 `monitor` 命令后执行的代码如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256729585f77c3855c15984260902bfff0035ad75.png)

服务器端将所有的监视器都保存在 `monitors` 链表中，在处理接收到的命令前会调用 `replicationFeedMonitors()`，将被处理的命令发送给各个监视器。伪代码如下：

```c_cpp
def replicationFeedMonitors(client, monitors, dbid, argv, argc):
  # 创建要发送给各个监视器的信息
  msg = create_message(client, dbid, argv, argc)
  # 遍历所有监视器
  for monitor in monitors:
     # 将信息发送给监视器
     send_message(monitor, msg)
```

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256738583cdeb1fe6be23cbadf8865f7926d6e111.png)

### Lua脚本

`redis` 中可以通过如下方式执行 `Lua` 命令

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425674658156180f9b1f49a1027e8932ebad526706.png)

#### 创建并修改 `Lua` 环境

`Reids` 中内嵌了一个 `Lua` 环境，并对这个环境进行了一系列修改，使其可以满足 `Redis` 服务器的需要。整个过程如下：

1. 创建一个基础的 `Lua` 环境，之后的所有修改都是针对这个环境进行的。
2. 载入多个函数库到 `Lua` 环境里面，让 `Lua` 脚本可以使用这些函数库来进行数据操作。包括下面几个库：**基础库、表格库、字符串库、数学库、调试库、`Lua CJson` 库、`Struct` 库、`Lua cmsgpack` 库**。
3. 创建全局表格 `redis`,这个表格包含了对 `Redis` 进行操作的函数，比如用于在 `Lua`
脚本中执行 `Redis` 命令的 `redis.call` 函数。
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425675358210408c2c8bf66fbd898277228c312ac9.png)
4. 使用 `Redis` 自制的随机函数 (**纯函数**) 来替换 `Lua` 原有的带有副作用的随机函数，从而避免在
脚本中引入副作用。
   > 纯函数：函数与外界交换数据只有一个唯一渠道——参数和返回值。
   > 
   > 非纯函数：函数通过参数和返回值以外的渠道，和外界进行数据交换，比如在函数内部进行了读取/修改全局变量的操作，这个操作可能导致在不同条件(时间、环境)下，对函数传入相同的参数会得到不同的结果。
5. 创建排序辅助函数 `__redis__compare__helper`，`Lua` 环境使用这个辅佐函数来对一部分 `Redis` 命令的结果进行排序，从而消除这些命令的不确定性。比如执行新增集合元素的命令 `SADD`，如果调整新增元素的位置，那么使用 `SMEMBERS` 查看元素后返回的结果可能都不一样。所以在调用完之后会使用 `__redis__compare__helper` 作为对比函数，然后调用 `table.sort()` 对命令的返回值做一次重排序，这样保证了相同数据集的返回结果一致。
6. 创建 `redis·Pca11` 函数的错误报告辅助函数 `__redis__err_handler`，这个函数可以提供更详细的出错信息。
7. 对 `Lua` 环境中的全局环境进行保护，防止用户在执行 `Lua` 脚本的过程中，将额外的
全局变量添加到 `Lua` 环境中。办法是在尝试进行下面操作时直接返回报错：
   - 创建全局变量
   - 获取一个不存在的全局变量
   
   **`Redis` 没有禁止用户修改已存在的全局变量。**
8. 将完成修改的 `Lua` 环境保存到服务器状态的 `Lua` 属性中，等待执行服务器传来的
`Lua` 脚本。接下来的各个小节将分别介绍这些步骤。

#### `Lua` 命令的执行过程(伪客户端)

`Redis` 执行命令必须要有相应的客户端状态，所以为了执行 `Lua` 脚本中的 `Redis` 命令，`Redis` 服务器为 `Lua` 环境创建了一个伪客户端 (**在服务器初始化时创建，并且这个伪客户端会一直存在**) 。当一个 `Lua` 脚本使用 `redis.call` 或 `redis.pcall` 函数执行一个 `Redis` 命令时，会完成以下几个步骤：

1. `Lua` 环境将 `redis.call` 函数或者 `redis.pcall` 函数想要执行的命令传给伪客户端。
2. 伪客户端将脚本想要执行的命令传给命令执行器。
3. 命令执行器执行伪客户端传给它的命令，并将命令的执行结果返回给伪客户端。
4. 伪客户端接收命令执行器返回的命令结果，并将这个命令结果返回给 `Lua` 环境。
5. `Lua`环境在接收到命令结果之后，将该结果返回给 `redis.call` 函数或者 `redis`,
`pcall` 函数。
6. 接收到结果的 `redis.call` 函数或者 `redis.pcall` 函数会将命令结果作为函数
返回值返回给脚本中的调用者。

#### `Lua_scripts` 字典

`Redis` 服务器中两种数据会保存到这个字典中:

- 被 `EVAL` 命令执行过的 `Lua` 脚本。
- 被 `SCRIPT LOAD` 命令载入过的 `Lua` 脚本。

这个字典的键是 `Lua` 脚本的 `SHA1` 校验和，值是对应的 `Lua` 脚本，如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425676758626aba5c4ea4e423cc83ada2986826377.png)

这个字典有两个作用：**实现 `SCRIPT EXISTS` 命令**，**实现脚本复制功能**。

#### `EVAL` 命令的实现

执行 `EVAl` 命令后，有三个步骤：

1. 根据客户端给定的 `Lua` 脚本，在 `Lua` 环境中定义一个 `Lua` 函数。函数定义的形式如下：
   - 如果传入的脚本是 `return 'hello world'`，脚本的 `SHA1` 校验和是 `xxx`，那么函数名是 `f_xxx`，函数体就是 `return 'hello world'`，伪代码如下：
     ```lua
     funtction f_xxx()
        return 'hello world'
     end
     ```
2. 将客户端给定的脚本保存到 `lua_scripts` 字典，等待将来进一步使用。
3. 执行刚刚在 `Lua` 环境中定义的函数，以此来执行客户端给定的 `Lua` 脚本。

具体的执行命令步骤如下：

1. 将 `EVAL` 命令中传人的键名 (`key name`) 参数和脚本参数分别保存到 `KEYS` 数组和
`ARGV` 数组，然后将这两个数组作为全局变量传人到 `Lua` 环境里面。
2. 为 `Lua` 环境装载超时处理钩子 (`hook`),这个钩子可以在脚本出现超时运行情况时，
让客户端通过 `SCRIPT KILL` 命令停止脚本，或者通过 `SHUTDOWN` 命令直接关闭服务器。
3. 执行脚本函数。
4. 移除之前装载的超时钩子。
5. 将执行脚本函数所得的结果保存到客户端状态的输出缓冲区里面，等待服务器将结
果返回给客户端。
6. 对 `Lua` 环境执行垃圾回收操作。

#### `EVALSHA` 命令

每个被 `EVAL` 命令执行过 `Lua` 脚本，在 `Lua` 环境中都有一个与脚本对应的 `Lua` 函数，函数名使用 `f_` + `Lua` 脚本对应的 `SHA1` 值定义。客户端可以通过 `SHA1` 值来调用脚本对应的函数，对应的命令是 `EVALSHA`，伪代码如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642567775801be7b80f14508b23421f4429775a6a5a.png)

#### 其他命令

1. `SCRIPT FLUSH` - 清除服务器中所有和 `Lua` 脚本有关的信息，这个命令会释放并重建 `lua scripts` 字典，关闭现有的 `Lua` 环境并重新创建一个新的 `Lua` 环境。
2. `Script Exists` - 根据输入的 `SHA1` 校验和，检查校验和对应的脚本是否存在于服务器中。
3. `Script Load` - 首先在 `Lua` 环境中为脚本创建相对应的函数，然后再将脚本保存到 `lua scripts` 字典里面
4. `Script Kill` - 这个命令与服务器设置的超时钩子有关，如果服务器配置了 `lua-time-limit` 参数，那么每次执行 `Lua` 脚本之前，会在 `Lua` 环境中设置一个超时处理钩子。之后在脚本运行期间，这个钩子会定期检查脚本运行时间，如果超过了 `lua-time-limit` 设置的时长，钩子会在脚本运行的间隙定期查看是否有 `Script Kill` 命令或 `Shutdown` 命令到达服务器。
   
   所以这个命令是在 `lua` 脚本执行超时后由客户端发起的。如果超时运行的脚本没有执行任何写入操作，那么这个命令可以正常中断脚本的执行；如果执行了写入操作，那么只能通过 `Shutdown nosave` 命令停止服务器，防止出现不合法的数据。

#### 脚本复制

这里会被复制的脚本是那些进行了写操作的脚本：`EVAL`、`EVALSHA`、`SCRIPT FlUSH`、`SCRIPT LOAD`。

其中客户端在向服务器发送了 `EVAL`、`SCRIPT FLUSH` 或 `SCRIPT LOAD` 三个命令时，服务器会将命令转发所有从服务器，它们也会执行一遍这些命令。

**`EVALSHA` 命令的复制过程**

`EVALSHA` 命令比较特殊，因为一个在主服务器能被成功执行的 `EVALSHA` 命令，在从服务器执行时可能出现脚本未找到的错误。

`Redis` 对于上面问题的处理办法是要求主服务器在传播 `EVALSHA` 命令时，必须确保 `EVALSHA` 命要执行的脚本已经被所有从服务器载入过，如果不能确保这一点的话，主服务器会将 `EVALSHA` 命转换成一个等价的 `EVAL` 命令(从 `lua_scripts` 字典中找 `SHA1` 值对应的 `lua` 脚本)，然后通过传播 `EVAL` 命令来代替 `EVALSHA` 命令。

- 主服务器维护了一个 `repl_scriptcache_dict` 字典，里面记录了主服务器已经将哪些脚本传播给了所有从服务器，记录的值为脚本对应的 `SHA1` 值。
- 之后执行 `EVALSHA` 时，主服务器会从 `repl_scriptcache_dict` 中找对应的 `SHA1` 值是否存在，如果存在表示 `EVALSHA` 命令可以传播给从服务器执行；如果不存在，表示其中至少有一个从服务器会出现脚本未找到的错误。

当主服务器添加一个新的从服务器时，`repl_scriptcache_dict` 会被清空，强制自己重新向所有从服务器传播脚本，这样可以确保从服务器不会出现脚本未找到的错误。

如果上面的校验没有通过，那么就会将 `EVALSHA` 命令转换为 `EVAL` 命令传递给从服务器，转换过程如下：

1. 根据 `SHA1` 校验和 `sha1`,在 `lua_scripts` 字典中查找 `sha1` 对应的 `Lua` 脚本 `script`
2. 将原来的 `EVALSHA` 命令请求改写成 `EVAL` 命令请求，并且将校验和 `sha1` 改成脚本`script`,至于 `numkeys`、`key`、`arg`等参数则保持不变。

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642568275830e04795529c70d7fdea39eb978bdca0a.png)
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256837581930c4353669ff5de82a4707ef0273f7c.png)

## 多机数据库

### 主从模式

主从模式(复制)在新旧版本(基于2.8)上的实现有差异，分别来看。

#### 旧版

复制操作分为同步 (`sync`) 和 命令传播 (`command propagate`) 两个操作。

- **同步** 操作用于将从服务器的数据库状态更新至主服务器当前所处的数据库状态。
- **命令传播** 操作则用于在主服务器的数据库状态被修改，导致主从服务器的数据库状
态出现不一致时，让主从服务器的数据库重新回到一致状态。

描述一下从服务器复制主服务器的操作。客户端发送 `SLAVEOF` 命令，表示复制操作开始。从服务首先执行同步操作，将从服务器的数据库状态更新至主服务器当前所处的数据库状态。同步操作步骤如下：

1. 同步操作是通过从服务器向主服务器发送 `SYNC` 命令开始执行的。
2. 收到 `SYNC` 命令的主服务器执行 `BGSAVE` 命令，在后台异步的生成一个 `RDB` 文件，并使用一个缓冲区记录从先开始执行的所有写命令。
3. `BGSAVE` 执行完毕后，主服务器将生成的 `RDB` 文件发送给从服务器，从服务器接收并载入 `RDB` 文件，这时从服务器的数据库状态更新至了主服务器执行 `BGSAVE` 时的数据库状态。
4. 然后主服务器将记录在缓冲区中所有写命令发送给从服务器，从服务器执行这些写命令，这时从服务器的数据库状态已经更新至与主服务器相同的状态了，同步操作完成。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256852581a9a8b5123be39e230e45c69537ea7580.png)

> 同步操作 可以保证主从服务器的数据一致，但是需要客户端主动向服务器发送 `SLAVEOF` 命令才会触发。

在每次服务器执行写命令时，会触发另一种主从服务器数据同步的操作：**命令传播**。主服务器执行了写命令后，会将这条命令发送给从服务器执行，从服务器执行了这条命令后，主从服务器的状态会重新回到一致的状态。

> 旧版的复制功能主要缺陷是 **同步功能** 的处理。同步的触发条件有两种：
> 
> - 主从服务器初次建立连接
> - 从服务器断开连接后的重连。
> 
> 同步操作所执行的 `SYNC` 命令会让主服务器生成并发送一个完整的 `RDB` 文件发送给从服务器，从服务器执行这个 `RDB` 文件完成同步操作。如果是断线重连时，并且断线的时间很短，那么可能 `RDB` 文件中的大部分数据从服务器中都已经存在，只有断线时产生的少量数据真正需要同步，但是旧版的同步操作会将整个 `RDB` 文件载入完成同步，所以效率很低。

#### 新版

新版复制功能主要是用来解决旧版复制的低效问题：通过使用 `PSYNC` 命令代替 `SYNC` 命令来实现。`PSYNC` 有两种同步模式：

- 完整重同步。处理初次复制的情况，与旧版的 `SYNC` 命令执行步骤一样。
- 部分重同步。处理断线后重复制的情况：如果条件允许，主服务器只会将服务器断连这段时间执行的写命令发送给从服务器。

部分重同步的实现，包含几个关键结构：

- 主服务器的复制偏移量，从服务器的复制偏移量。
  
  在执行部分重复制时，主服务器向从服务器传送N个字节数据后，会在自己的复制偏移量的值上加N；从服务器接收到主服务器传送的N个字节数据后，会在自己的复制偏移量的值上加N。
- 主服务器的复制积压缓冲区（固定长度的先进先出队列）
  
  当主服务器进行命令传播时，它不仅会将写命令发送给所有从服务器，还会将写命令入队到复制积压缓冲区中。这个缓冲区的长度时固定的，也就是说如果缓冲区的数据超过了一定大小(默认1M)，那么最先入队的数据将被挤出队列。
- 服务器的运行ID

列举了这些关键概念后，下面就来回答一下几个问题：

1. 主服务器如何判断是执行部分重同步还是完整重同步？
   
   假设主从服务器的复制偏移量差值为A，复制积压缓冲区的大小为B，如果A>B，表示复制积压缓冲区中已经有数据溢出了，这时需要执行完整重同步操作；如果A<B，表示偏移量后的数据全部存在于复制积压缓冲区中，这时只需要执行部分重同步。
   
   从服务器对主服务器进行初次复制时，主服务器会将自己的运行ID传送给从服务器，从服务器会将这个运行ID保存起来。当从服务器断线重连时，会将之前保存的运行ID发送给主服务器，主服务器判断传送来的运行ID是否是自己的运行ID，如果是，则进行上一步复制偏移量和复制积压缓冲区的检查。如果不是，则进行完整重同步操作。
2. 部分重同步时从服务器在断线期间丢失的数据如何被补充回来？
   
   从服务器断线重连后，会给主服务器发送 `PSYNC` 命令，并报告自己的复制偏移量。主服务器收到命令后，检查从服务器的复制偏移量后的数据是否存在于复制积压缓冲区中，如果存在，那么执行部分重同步，主服务器将复制积压缓冲区的偏移量(从服务器的偏移量)后的数据发送给从服务器，从服务器收到数据并执行，完成同步。

#### 复制操作

复制操作就是客户端给从服务器发送 `SLAVEOF` 命令，让从服务器去复制对应的主服务器，具体的执行步骤如下：

1. **设置主服务器的地址和端口。**
   
   客户端发送 `SLAVEOF` 命令具体如下：
   ```lua
   SLAVEOF 127.0.0.1 6379
   ```
   
   从服务器会将这个 `ip` 和端口保存到服务器状态的 `masterhost` 和 `masterport` 属性中。设置完毕，从服务器给客户端返回 `OK`。
2. **建立套接字连接。**
   
   从服务器建立一个与主服务器的套接字连接。主服务器接受连接后，会为该套接字连接创建对应的客户端状态。之后主从服务器之间就可以进行命令的收发处理工作了。
3. **发送 `PING` 命令。**
   
   主服务器的客户端状态创建成功后，从服务器会向主服务器发送一个 `PING` 命令，检查套接字的读写状态和主服务器是否可以正常处理请求。如果一切正常，主服务器会返回一个 `PONG` 给从服务器。
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664256861585add3b06c2f9aa7a1fcbd4d3a59e452fb.png)
4. ** 身份验证。**
   
   身份验证的操作是否进行与两个设置有关：
   - 从服务器的 `masterauth` 选项
   - 主服务器的 `requirepass` 选项
   
   如果两个选项都设置了，那么进行身份验证，从服务器通过 `AUTH` 命令发送密码，主服务器验证密码是否与 `requirepass` 设置的相同，如果相同可继续复制工作，如果不同则返回 **`invalid password` 错误**。
   
   如果只设置了主服务器的 `requirepass` 选项，没有设置从服务器的 `masterauth` 选项，那么主服务器会会返回 `NOAUTH` 错误。相对的，如果只设置了从服务器的 `masterauth` 选项，而没有设置主服务器的，那么将返回 `no password is set` 错误。
   
   如果都没设置，那么复制工作继续执行。
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642568725806f803b4cd1dba0d6497098c4b442e532.png)
5. **发送端口信息。**
   
   从服务器将自己绑定的端口信息发送个主服务器，主服务器收到的将其绑定到对应客户端状态的 `slave_listening_port` 属性中，这个属性的作用是在主服务器执行 `INFO replication` 命令时打印出从服务器的端口号。
6. **同步。**
   
   这一步进行的工作在上面已经介绍过了。这里需要额外注意的一点是，在这一步之后，主从服务器会互为对方的客户端(通过 `Socket` 连接)，这样可以完成数据的通信。
7. **命令传播。**
   
   同步操作后，主从服务器双方就建立了通信的通道，之后主服务器的写命令通过命令传播的方式同步给从服务器，就能保证主从服务器的数据一致。

#### 心跳检测

主从服务器的正常通信状态下通过心跳来维持连接：**从服务器每秒一次向主服务器发送命令。**命令如下：

```lua
REPLCONF ACK <replication_offset>
```

其中 `replication_offset` 是从服务器当前的复制偏移量，发送这个命令有三个作用：

1. **检测主从服务器的网络连接状态。**
   
   如果主服务器超过 `1s` 没有收到从服务器发来的 `replconf ack` 命令，那么主服务器就知道主从服务器之间的连接出现问题了。
2. **辅助实现 `min-slaves` 选项。**
   
   这个选项的作用是防止主服务器在不安全的情况下执行写命令，有两个选项可用：
   - `min-slaves-to-write ` 3
   - `min-slaves-max-lag` 10
   
   上面选项后的数字是给出的案例，意思是如果 **从服务器的数量少于3个，或者3个服务器的延迟( `lag` )值都大于或等于 `10s` 时，主服务器将拒绝执行写命令**。延迟值会通过心跳响应的时间反映出来。
3. **检测命令丢失。**
   
   当主从服务器的连接出现问题时，主服务器传播给从服务器的命令可能会丢失。当从服务器向主服务器发送 `REPLCONF ACK` 命令时，主服务器会发现从服务器的复制偏移量少于自己的复制偏移量，主服务器这时会将复制积压缓冲区中从服务器缺少的数据发送给从服务器。
   
   这一步的操作与部分重同步类似，但是部分重同步是发生在主从服务器断线重连后，这一步则是在主从服务器没有断线的情况下执行的。

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425688258623a8ac539e61284571d7ede71854519a.png)

### `Sentinel` - 哨兵模式

`Sentinel` 就是使用一个或多个 `Sentinel` 实例组成的 `Sentinel` 系统来监视主服务器，以及主服务器对应的从服务器。当主服务器下线之后，自动将某个从服务器升级为新的主服务器。

当哨兵模式下的主服务器下线时长超过了用户设定的下线时长上限时，主服务器的 **故障转移操作** 会被执行：

- 选择一个从服务器，使其成为新的主服务器
- 向其他的从服务器发送复制指令，让它们成为新的主服务器的从服务器。当所有的从服务器都开始复制新的主服务器时，故障转移操作执行完毕。
- 已下线的旧主服务器会被继续监视，当其重新上线后，会被设置为新主服务器的从服务器。

`Sentinel` 本质上是一个运行在特殊模式下的 `Redis` 服务器，它的启动步骤如下：

1. 初始化一个普通的 `Redis` 服务器。***初始化的服务器不会加载 `AOF` / `RDB` 文件。***
2. 将普通的 `Redis` 服务器使用的代码替换为 `Sentinel` 专用代码。
   
   替换的代码包括 **服务器端口** 对应的参数：`redis.h/REDIS_SERVERPORT = 6379` -> `sentinel.c/REDIS_SENTINEL_PORT = 26379`，以及命令表，`Sentinel` 使用的命令表只包含 `PING`、`SENTINEL`、`INFO`、`SUBSCRIBE`、`UNSUBSCRIBE`、`PSUBSCRIBE`、`PUNSUBSCRIBE` 七个命令。
3. 初始化 `Sentinel` 状态。
   
   具体操作是初始化一个 `sentinel.c/sentinelState` 结构，这个结构中保存了服务器中所有和 `Sentinel` 功能有关的状态。***服务器的一般状态仍然由 `redis.h/redisServer` 保存***。
4. 根据给定的配置文件，初始化 `Sentinel` 的监视主服务器列表。
   
   在上一步初始化的 `Sentinel` 状态中，其中包含一个 `masters` 字典，它记录了所有被 `Sentinel` 监视的主服务器的相关信息：
   - 字典的键是被监视的主服务器名。
   - 字典的值是被监视的主服务器对应的 `sentinel.c/sentinelRedisInstance` 结构。
5. 创建连向主服务器的网络连接。
   
   这一步会将 `Sentinel` 设置为主服务器的客户端，它可以向主服务器发送命令，并从命令回复获取相应的信息。对于每个被 `Sentinel` 监视的主服务器来说，`Sentinel` 会创建两个连向主服务器的异步网络连接：
   - 一个是命令连接，这个连接专门用于向主服务器发送命令，并接收命令回复。
   - 另一个是订阅连接，这个连接专门用于订阅主服务器的 `__sentinel__:hello`频道。
   
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642568935861a9bce14118ed83a17f5726b321fed74.png)

`Sentinel` 启动后，默认会以 `10s` 一次的频率向被监视的主服务器发送 `INFO` 命令，通过分析 `INFO` 命令的回复来获取主服务器的当前信息，获取到的信息包含如下两种：

- 主服务器本身的信息：`run_id` 域信息和 `role_id` 域信息。
- 主服务器属下所有从服务器的信息。

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642569305821664256929765.png)
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642569515861664256951461.png)

### 集群

TODO

知识点总结：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166425697558365ad06f3c9bd011982cc6d425833f8ef.png)
