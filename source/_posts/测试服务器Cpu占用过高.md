---
title: 测试服务器Cpu占用过高
tags: 后端技术
categories: 后端技术
abbrlink: 39924
date: 2022-10-14 15:45:54
---

### 前言

之前出现过一次服务器`Cpu`占用率达到100%的问题，经分析是`Jenkins`的重启`Jar`包脚本导致的。

最近在使用测试服务器时，发现服务器卡顿仍然很严重，定位到问题是 `rsdun-zuul-balance` 网关服务导致的，下面是调查过程：

<!--more-->

### 发现问题

在任务管理器中，定位到一个`java`服务的线程数很多，然后通过`pid`定位到是`rsdun-zuul-balance`服务

![1687746857732609399958aa44cb898bd1420d4114c00.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687746857732609399958aa44cb898bd1420d4114c00.png)

![1687746863729efce1322158aa6cf6dc022a804ab5c4c.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687746863729efce1322158aa6cf6dc022a804ab5c4c.png)

通过 `jconsole.exe` 监视该服务，利用压测工具 `jmeter` 进行压力测试，请求 `获取朋友圈信息` 接口，得到的运行情况如下

![16877468697305e02ab06d0947141437d79f911c1ba71.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877468697305e02ab06d0947141437d79f911c1ba71.png)

`CPU` 占用率在 `5%` - `25%` 之间浮动，利用 `windows` 自带的资源监视器，对比其他正在运行的 `java` 服务，`CPU` 占用率稍高

![1687746877730c2222dfc9569dc739b5814f3592412a9.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687746877730c2222dfc9569dc739b5814f3592412a9.png)

> 注：资源监视器打开方式如下
> 
> ![16877468887318a811478dc4e17ff09fe88e9b183a8a4.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877468887318a811478dc4e17ff09fe88e9b183a8a4.png)

<br/>

### 原因分析

所有的请求都需要经过 `zuul` 进行转发，这是造成 `zuul` 服务 `cpu` 占用过高的原因。当某个时间点大量请求涌入，`CPU` 使用率会飙升，见下方测试:

![16877469007325ee4576ba4dffbe6d484fdfac2e36a3a.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877469007325ee4576ba4dffbe6d484fdfac2e36a3a.png)

![16877469057315d3924c865ed82a59779452a30b288a2.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877469057315d3924c865ed82a59779452a30b288a2.png)

<br/>

### 优化办法

根据上面的分析，`CPU` 使用率与单位时间请求数量成正比，这一块儿目前无法进行优化。但是可以以下面两个目标作为优化方向：

1. **提高系统的TPS(吞吐量)**。
2. **降低请求错误率。**

优化方法：

1. `zuul` 服务参数调优。
2. 建立高可用架构。

目前的主要调优手段应该是第一种，第二种需要物理设备的支持。

<br/>

### 其他问题

在使用 `jmeter` 进行压力测试时，发现了如下几个错误。

#### REJECTED_SEMAPHORE_EXECUTION 错误

在使用 `jmeter` 进行压测时(1s内1000请求)，发现大量请求报错：`{"timestamp":"2021-09-22T08:30:37.484+0000","status":500,"error":"Internal Server Error","message":"REJECTED_SEMAPHORE_EXECUTION"}`

异常率达到 `87.2%`

![1687746913730d447ce68496c3f109d53233edd914e72.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687746913730d447ce68496c3f109d53233edd914e72.png)

并且这个报错有时在进行 `App测试` 时也会出现。查询资料发现是因为 `zuul` 默认每个路由直接用信号量做隔离，并且默认值是 `100` ，也就是当一个路由请求的信号量高于 `100` 那么就拒绝服务了，返回500。

重新设置信号量为5000，再次测试，没有出现报错。

![168774692473029607a06680350b8c044ea8184df4c2e.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/168774692473029607a06680350b8c044ea8184df4c2e.png)

![16877469317334d4d42c7bae5b9e9987eb8b413bce28b.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877469317334d4d42c7bae5b9e9987eb8b413bce28b.png)

<br/>

#### Internal Server Error 错误

![1687746938731ae8b60a3062ec7b4b5623c0b018f05e4.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687746938731ae8b60a3062ec7b4b5623c0b018f05e4.png)

目前测试发现有两个原因会导致该错误：

1. 请求连接时间过长。
2. 服务挂了。

**这里仅分析一下第一个原因**，与 `ribbon.ConnectTimeout` 这个参数有关。这个参数配置的是请求连接超时时间，将这个参数调整至1(ms)，头几个请求会报这个错误；调整至3000(ms)，请求正常。

```properties
# 请求连接超时时间3s
ribbon.ConnectTimeout=1
```

![16877469477323d6b4051d95fd2dc5d6dea4799388e8c.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877469477323d6b4051d95fd2dc5d6dea4799388e8c.png)

<br/>

### 参考文档

[Zuul参数调优](http://dockone.io/article/8617)

[Spring Cloud各组件调优参数](https://www.itmuch.com/spring-cloud-sum/spring-cloud-concurrent/)

[Zuul报错 Internal Server Error](https://blog.csdn.net/didi7696/article/details/83092525)

[Zuul系列文章](https://www.itmuch.com/tags/Zuul/)
