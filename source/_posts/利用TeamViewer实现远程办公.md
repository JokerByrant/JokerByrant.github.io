---
title: 利用TeamViewer实现远程办公
abbrlink: 44924
date: 2022-04-15 13:48:57
tags: 
  - 远程办公
  - TeamView
categories: 工具
---
### 前言

健康码变黄了，公司进不去，只能居家办公。本想让同事帮忙把相关的代码拷贝给我，但是仔细一想，目前的项目光有代码也没用，各种环境的配置也要跟上，就光配置环境这个工作量也不小...

<!--more-->

于是去搜索远程桌面的解决方案，原先以为这些方案都是企业级的。但是一看支持免费的个人版还是有几款的，包括：`TeamViewer`、向日葵、微软远程桌面、`Splashtop`....

对比了一下，选择了口碑最好的 `TeamViewer`。

### 安装 & 配置

[`TeamViewer` 下载地址](https://www.teamviewer.com/en-us/download/windows/)

安装时直接使用默认的配置，安装完毕后进入主页面，首先需要注册一个账号：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1654494555384ec2fff51e09830cd8ce5bb575e05d220.png)

登录之后可以看到连接相关的信息，拿到目标机器的 `ID` 和密码之后，就可以进行远程连接。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/165449456638483a63be488f4c89ee2e491e7aff90c6d.png)

在使用时遇到的几个问题：

1. 免费账户每隔3小时左右会被强制断开一下，这是 `TeamViewer` 为了防止商用做的限制，重新连接一下即可。
2. 目标机器休眠导致无法连接，这个可以通过配置 `TeamView` 的设置来解决，如下：
   ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16544945853872330cd9cd5eb8b02b39ff6cb3b70aa00.png)
3. 这个注意点是在论坛里看到的，免费版不能连接太多不同的 `PC`，否则会被监测为商用，就无法使用免费版了。

### 结语

原先以为这些远程桌面软件使用体验并不好，因为之前实习时用过公司的远程软件，体验非常差。但是实际使用下来感觉与操作真机没有差别，居家办公必备。
