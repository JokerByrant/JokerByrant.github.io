---
title: IDEA Debug模式使用心得
tags: IDEA
categories: 后端技术
abbrlink: 19066
date: 2021-02-20 10:10:42
---

## watch引发的调试问题
今天在调试代码时，发现了一个问题，接口查询出的数据与 `mysql` 中的数据不一致。<!-- more -->不断的尝试，不断的 `Google`，捣鼓了一个多小时，没找到问题出现的原因。然后在又一次的重复测试中，我发现了下面这个东西。
![](https://ae01.alicdn.com/kf/U07998339e00d44e0b2e0d7ef307a22b5K.jpg)
我尝试把这个删除之后，代码居然就恢复了正常。

不断尝试下，发现这个 `watch` 与 `Evaluate Expression` 很相似，可以在 `Debug` 时改变变量的值，区别是 `watch` 设置之后，会一直生效，在 `Variables` 窗口下有一个 `∞` 标志进行标识，这也是为什么我重启了n次服务问题仍然存在的原因。

## 设置断点条件
设置断点条件，当符合条件时，调试时会在该断点出停止。
设置方式如下图，对着断点右击会出现如下界面，输入表达式即可：
[](https://img02.sogoucdn.com/app/a/100520146/e0c7ab5bf017ef9f03cbc2a777e8fb84)