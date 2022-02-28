---
title: 利用Jmeter模拟多用户并发请求
tags: Jmeter
categories: 后端技术
abbrlink: 64610
date: 2022-02-10 23:16:32
---
## 前言
项目组人比较少，因此每个成员既要充当开发，也要兼顾测试的角色。平常写接口只是进行基本的单测，虽然进行过高并发的测试(开n个线程同时请求接口)，但模拟的是单用户的情况。在实际的使用场景中，高并发请求是由多个客户端的不同用户发起的，下面就记录一下如何利用 `Jmeter` 来模拟多用户的并发请求。

<!--more-->

## 模拟多用户并发请求

之前利用 `Jmeter` 对几个 `GET` 接口进行压力测试时，模拟的情况是单用户的并发请求，用户的登录信息写死在请求信息中，如下：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645802371093f88eedc59ba0cbbc38a7f94d02fd3f70.png)

在实际使用场景中，应该是多用户的并发请求为主，因此尝试了模拟多用户的并发请求。

仍然以上面的获取朋友圈信息接口为例，改造之后的测试计划如下：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645802380092243a22da37af1e038f063dcff144c878.png)

### 实现细节

首先配置一下接口请求地址，之后所有的请求都会通过这个地址进行请求。

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458023900953a7c80a36e66c636bdc46d600b1ab163.png)

假设设置10个线程并发运行

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/164580239709881e5bd1380116bd9b4a4b340e8e9bf90.png)

每个线程都会首先执行登录操作，登录信息从配置的csv文件中读取

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645802413101b169234bd5148ffd445abd876bc30c29.png)

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645802423092cefbb3e02d339ec48ee097e7a5eb4389.png)

文件内容如下：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645802437098be4d8d6cfd3af409b618eddaaaa41b6f.png)

登录请求执行成功后，将 `authorization` 信息提取出来

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/164580244609299ad6ceac1d99540358a9c05fc8f0493.png)

之后请求获取朋友圈信息接口

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645802453095fb42f141b44943556f32d0acdd66ab34.png)

将之前拿到的用户登录信息配置上来

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645802476091a7f153096ec8776754b657c26bda3952.png)

配置完毕，运行测试计划，就能看到最终的运行效果

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458024840924372d498ec3a521c15d5eabbfb6ae00f.png)

### 参考文档

[Jmeter模拟多用户并发访问](https://blog.csdn.net/biubiu2it/article/details/104009201)

