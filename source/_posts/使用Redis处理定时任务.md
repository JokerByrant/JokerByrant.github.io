---
title: 使用Redis处理定时任务
abbrlink: 62888
date: 2021-01-29 10:08:11
tags:
---

项目里有很多定时任务，之前的处理都是直接用 `Spring Task`解决，与对外接口同处一个项目。但随着开发的深入，代码变得越来越复杂，项目职责需要划分的更明确，因此将定时任务抽离出来。并且现在的项目是分布式部署，继续使用 `Spring Task` 处理会出现重复处理的问题。调查了一些定时任务解决方案，比如`Quartz`，决定使用 `redis` 过期事件的方式处理。

<!--more-->

## Spring Task

## Quartz

## Redis监听过期key

## 参考文章
1. [订阅 Redis 的 key 过期事件实现动态定时任务](https://crazyfzw.github.io/2019/04/09/redis-keyspace-notifications/)
2. [SpringBoot实现监听redis key失效事件](https://www.jianshu.com/p/106f0eae07c8)

