---
title: MySQL 报错 Lost connection to MySQL server at 'reading authorization packet'
abbrlink: 16495
date: 2024-09-06 09:45:25
tags: MySQL
categories: 后端技术
---

报错信息如下

![picture 0](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/a4ead56c86c20c8105be617d5baf0e0fcbcaf36fbb492139ca58def088fa8a02.png)

<!--more-->

发生这个报错前，我进行了多次连接数据库的操作，但是密码输入错误，如下：

![picture 1](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/0f0f1c0281926b1bf5e5e3f6b4b080fe2be2350dfaead1b15d84eebd49931318.png)  


登录到数据库所在的服务器，发现数据库是正常运行的，并且能够正常连接上。尝试重启了数据库，在我的机器上重新连接，仍然会出现这个报错。

处理办法是直接在数据库中执行下面的命令即可：

```bat
flush hosts;
```