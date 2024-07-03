---
title: SpringBoot中Zookeeper Curator会话过期机制
abbrlink: 7590
date: 2024-06-19 13:07:28
tags:
  - SpringBoot
  - Zookeeper
  - 后端技术
categories: 后端技术
---
项目在设计时被拆分成了多个服务，其中包含接口服务和聊天服务(`Netty`)，其中为了实现聊天服务的高可用，采用 `Zookeeper` 进行服务的注册和发现，接口服务可以通过 `Zookeeper` 拿到聊天服务的地址，然后返回给 `App` 端，`App` 端之后可以通过 `Socket` 建立与聊天服务的连接。

本地测试时有一个奇怪的现象：**电脑长时间睡眠然后重新打开，聊天服务仍然运行正常，但是接口服务从 `Zookeeper` 获取聊天服务地址时，拿不到对应的聊天服务信息，`Zookeeper` 中显示节点已被移除。**

<!--more-->

### 一个案例

首先看这个案例：[zookeeper恢复了，线上微服务却全部掉线了，怎么回事？](https://mp.weixin.qq.com/s/aa1Yx0kzj800j33pjTxClw)

![17199832912709723a6a65a34be3de5dbf11b253f9f24.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17199832912709723a6a65a34be3de5dbf11b253f9f24.png)

这里提到的问题，在我的服务中出现了类似的情况，这里我把处理过程放出来：

- **问题描述：**本地有两个服务，[接口服务] 和 [聊天服务]，架构设计时考虑到之后分布式部署的情况，因此 [聊天服务] 启动时会将自己的连接信息存入 `Zookeeper` 中，之后如果需要连接 [聊天服务]，那么先请求 [接口服务] 中的 [获取聊天服务IP] 接口，该接口会从 `Zookeeper` 中拿到对应的聊天服务信息。
  
  现在出现一个问题，聊天服务运行正常，但是请求 [获取聊天服务IP] 接口时，拿不到对应的聊天服务信息，`Zookeeper` 中显示节点已被移除。
- **问题定位：**尝试对问题进行复现，发现在电脑长时间睡眠后再重新打开时能复现出该问题，查看聊天服务日志，这时存储在 `Zookeeper` 上的聊天服务节点信息被移除了，监听到的几个节点状态变化按顺序分别是：**[CONNECTION_SUSPENDED] -> [CONNECTION_LOST] -> [CONNECTION_RECONNECTED] -> [CHILD_REMOVED]**。
- **处理办法**：监听节点移除事件 `CHILD_REMOVED`，当监听到节点被移除事件时，如果被移除的节点是当前服务绑定的节点，并且当前服务运行正常，那么就直接执行重新创建节点的操作（能监听到节点被移除的事件，那么说明当前服务肯定是可用的）。

问题是解决了，但有一个问题还是要搞清：**电脑长时间睡眠然后重新打开，为什么会触发上面的节点状态变化，是什么机制导致的？**

### `Zookeeper Curator` 会话过期机制

> `Apache Curator` 是 `Java` 中的 `Zookeeper` 客户端管理框架：[Apache Curator - 官方文档](https://curator.apache.org/docs/about)
> 
> ![171998330527314db1165f313fee1cacd3d9879e78c20.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/171998330527314db1165f313fee1cacd3d9879e78c20.png)

对代码进行 `Review`，定位到与 `Zookeeper` 的连接会话是通过如下代码创建的：

```java
CuratorFrameworkFactory.newClient(zkAddress, retryPolicy);
```

看一下这个操作的源码：

```java
private static final int DEFAULT_SESSION_TIMEOUT_MS = Integer.getInteger("curator-default-session-timeout", 60 * 1000);
private static final int DEFAULT_CONNECTION_TIMEOUT_MS = Integer.getInteger("curator-default-connection-timeout", 15 * 1000);

public static CuratorFramework newClient(String connectString, RetryPolicy retryPolicy) {
    return newClient(connectString, DEFAULT_SESSION_TIMEOUT_MS, DEFAULT_CONNECTION_TIMEOUT_MS, retryPolicy);
}
public static CuratorFramework newClient(String connectString, int sessionTimeoutMs, int connectionTimeoutMs, RetryPolicy retryPolicy) {
    return builder().
        connectString(connectString).
        sessionTimeoutMs(sessionTimeoutMs).
        connectionTimeoutMs(connectionTimeoutMs).
        retryPolicy(retryPolicy).
        build();
}
```

解释一下其中的几个关键参数：

- `connectString`：服务器地址列表，服务器地址列表参数的格式是 `host1:port1,host2:port2`
- `sessionTimeoutMs`：会话超时时间，如果会话在 `sessionTimeoutMs` 内没有连接到服务器，那么与该会话关联的临时节点将被删除
- `connectionTimeoutMs`：连接超时时间。如果在这个时间内无法建立连接，连接尝试将被认为是失败的
- `retryPolicy`：重试策略，当客户端异常退出或者与服务端失去连接的时候，可以通过设置客户端重新连接 ZooKeeper 服务端

上面创建会话时，自定义了 `connectString` 和 `retryPolicy`，`sessionTimeoutMs` 和 `connectionTimeoutMs` 使用了默认的配置，分别是 `60s` 和 `15s`。 

通过上面定位到日志可知，节点触发了 `CONNECTION_LOST` 状态，表示 `Zookeeper` 认为节点对应的连接已经断开，所有依赖于该连接的临时节点都会被移除，之后收到 `CHILD_REMOVED` 表明节点被移除了。

那在什么情况下会导致连接断开呢？注意上面节点的状态变化，最先收到的是 `CONNECTION_SUSPENDED` 状态，这个状态表示客户端与 `Zookeeper` 服务器之间的连接 **暂时中断**，该事件表明客户端暂时失去了与 `Zookeeper` 的连接，但会话仍然有效，因为会话超时时间（`sessionTimeoutMs`）尚未达到。有如下几种情况会触发 `CONNECTION_SUSPENDED` 事件：

- **网络问题。**网络延迟或临时网络故障导致客户端无法与 `Zookeeper` 服务器通信。
- **服务器问题。** `Zookeeper` 服务器负载过高或临时不可用。
- **客户端问题。**客户端设备资源不足或线程阻塞。

收到 `CONNECTION_SUSPENDED` 事件时，会话仍然有效，客户端会触发重连机制，如果在 `sessionTimeoutMs` 时间内没有连接上，那么就会收到 `CONNECTION_LOST` 事件；如果连接上了，就会收到 `CONNECTION_RECONNECTED` 事件。

在本地进行了测试，`sessionTimeoutMs` 仍然使用默认的 `60s`，连接的 `Zookeeper` 在其他服务器上，关闭网络。如下，会立刻收到 `CONNECTION_SUSPENDED` 事件通知， `60s` 后收到了 `CONNECTION_LOST` 事件

![171998331926933de1d5d53380a084bad5a54e60ddfef.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/171998331926933de1d5d53380a084bad5a54e60ddfef.png)

再来测试下，如果在 `sessionTimeoutMs` 时间内重连成功会怎样，关闭网络一段时间将网络恢复，这时收到了 `CONNECTION_RECONNECTED` 事件通知，如下：

![1719983325269610c3b2a174b6034e53c5f93d97c2291.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719983325269610c3b2a174b6034e53c5f93d97c2291.png)

再来看下上面日志中打印的收到的事件通知：**[CONNECTION_SUSPENDED] -> [CONNECTION_LOST] -> [CONNECTION_RECONNECTED] -> [CHILD_REMOVED]**。

`CONNECTION_LOST` 和 `CONNECTION_RECONNECTED` 两个事件都收到了，这个问题不必深究，应该是 `Windows` 睡眠机制导致的，可能是在睡眠期间代码无法执行，因此在恢复后同时打印了这两个状态。

### 源码学习

从 [Curator：如何降低 ZooKeeper 使用的复杂性？](https://lianglianglee.com/%E4%B8%93%E6%A0%8F/ZooKeeper%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90%E4%B8%8E%E5%AE%9E%E6%88%98-%E5%AE%8C/13%20Curator%EF%BC%9A%E5%A6%82%E4%BD%95%E9%99%8D%E4%BD%8E%20ZooKeeper%20%E4%BD%BF%E7%94%A8%E7%9A%84%E5%A4%8D%E6%9D%82%E6%80%A7%EF%BC%9F.md) 这篇博客中可知，`SpringBoot` 是通过 `Curator` 框架来管理 `Zookeeper` 的，入口代码如下：

```java
public static CuratorFramework createInstance() {
    ExponentialBackoffRetry retryPolicy = new ExponentialBackoffRetry(baseSleepTimeMs, maxRetries);
    return CuratorFrameworkFactory.newClient(zkAddress, retryPolicy);
}
```

我们可以从这个入口代码入手，来看一下 `Curator` 都进行了哪些操作，参考文章：[【Zookeeper】Apach Curator 框架源码分析：初始化过程（一）](https://mp.weixin.qq.com/s/dG13MYYI_54pwrj3yabJ4Q)

我们再回顾一下上面的案例，其中出现的问题，其实是 `Zookeeper` 的会话过期机制引起的，分析了源码之后，我们就能很清晰的看出整个会话过期机制是如何触发的。

### 参考文章

[zookeeper恢复了，线上微服务却全部掉线了，怎么回事？](https://mp.weixin.qq.com/s/aa1Yx0kzj800j33pjTxClw)

[什么是 zookeeper 的会话过期？](https://zhoujunwen.com/2022/%E4%B8%AD%E9%97%B4%E4%BB%B6/zookeeper/zookeeper%20curator%E5%A4%84%E7%90%86%E4%BC%9A%E8%AF%9D%E8%BF%87%E6%9C%9Fsession%20expired/)

[聊聊Zookeeper的Session会话超时重连](https://www.cnblogs.com/zhiyong-ITNote/p/17489109.html)

[Zookeeper Curator 处理会话过期 Session Expired](https://zhoujunwen.com/2022/%E4%B8%AD%E9%97%B4%E4%BB%B6/zookeeper/zookeeper%20curator%E5%A4%84%E7%90%86%E4%BC%9A%E8%AF%9D%E8%BF%87%E6%9C%9Fsession%20expired/)

[Apache Curator - 官方手册](https://curator.apache.org/docs/about)
