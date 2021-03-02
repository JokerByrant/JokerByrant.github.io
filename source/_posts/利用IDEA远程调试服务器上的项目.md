---
title: 利用IDEA远程调试服务器上的项目
tags: IDEA
categories: 后端技术
abbrlink: 2084
date: 2021-03-02 14:14:16
---

项目发布到服务器上后，需要经历一系列测试，如果这时候出了问题只能去捞日志。今天发现了一个更便捷的方法，`Remote Debug`---**远程调试**。

<!--more-->

简单来说，`Remote Debug`就是在本地`Debug`远程服务器上的项目。他的原理是：本机和远程主机的两个 `VM` 之间使用 `Debug` 协议通过 `Socket` 通信，传递调试指令和调试信息。

首先在将项目部署到服务器上时，需要添加一些参数，完整命令如下：
```shell
java -jar -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005 rsdun-app-api.jar
```
其中`5005`是端口号，`rsdun-app-api.jar` 是要部署的程序。

接着配置 `IDEA`：
![IDEA配置](https://ae01.alicdn.com/kf/Uad66176b150e47ecb8ddae6d7491f05dT.jpg)

最后启动项目，看到控制台中出现如下日志，即代表配置成功，然后就可以进行 `Debug` 了
![成功log](https://ae01.alicdn.com/kf/U50d5575397954cd2a72c20d67dfcf44f7.jpg)

