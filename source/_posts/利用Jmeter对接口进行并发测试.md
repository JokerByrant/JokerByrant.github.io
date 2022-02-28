---
title: 利用Jmeter对接口进行并发测试
tags: Jmeter
categories: 后端技术
abbrlink: 21935
date: 2022-02-11 23:12:57
---
## 前言
在 {% post_link 利用Jmetwer模拟多用户并发请求 %} 这篇文章中介绍了如何使用 `Jmeter` 模拟多用户的并发请求，有了这篇文章作为基础，下面就以抢红包的功能为例对接口进行一下测试。

<!--more-->

先来看一下最终的测试计划结构：
![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/164580294509234ba58136a528587c356f5011ea9a05e.png)

## 实现细节

用户的登录信息提取细节上篇文章已经提到过，这里就不再赘述。

新建一个 **发红包** 的线程组，1个线程循环1次，模拟发红包。

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645803001091eeacf994715915596b89e5ef515d8714.png)

抢红包需要并发处理，因此另开一个线程组，设置10个线程循环1次。

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645803024090786b1297c9fc8a8cc0030bf85ffc29d3.png)

抢红包操作需要在发红包操作处理完成再执行，因此需要进行如下设置：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458030330941576f691bf675c50f79a500426dc806a.png)

发红包的请求如下，发出4个金额为1的拼手气红包：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/164580304309798c250248dcf0c2aee6391a0c26c3384.png)

由于 `Jmeter` 中不同线程组之间变量不能共享，因此需要对发红包接口返回的红包流水进行额外处理，将其保存为全局变量。

新建一个 `JSON提取器`，提取出红包流水

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645803052100298da141ebce70d6674fbf9807b07aa8.png)

接着新建一个`BeanShell 后置处理程序`，将红包流水保存为全局变量，以便后面的抢红包线程组使用

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/164580306009584a2173729799fbb4690578c2c8931e2.png)

接着就是抢红包的请求，关键点在于全局红包流水的使用

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645803068093fa90650ca55171ae2341f2ac67c359a5.png)

最后运行查看测试结果，接口正常：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458030740914e4c3aabd1973308c4e89ff07b353231.png)

## 参考文档

[jmeter---线程组执行顺序记录](https://blog.csdn.net/qq2901qq/article/details/79046577)

[jmeter之线程组间变量共享](https://blog.csdn.net/XiaoXiao_RenHe/article/details/80268205)
