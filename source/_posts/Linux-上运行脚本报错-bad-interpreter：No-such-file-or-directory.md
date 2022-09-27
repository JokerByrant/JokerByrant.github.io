---
title: Linux 上运行脚本报错 bad interpreter：No such file or directory
tags: Linux
categories: 后端技术
abbrlink: 2790
date: 2022-07-01 09:35:13
---

最近在用 `Docker` 部署一个项目，但是某几个镜像怎么都启动不起来。之后查看控制台打印的日志，发现了如下日志：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424255993869adc873be47d4068507e24f41db09bc.png)

<!--more-->

`_1.sh` 我明明已经通过 `volumes` 将其映射到 `Linux` 服务器上了，怎么会报这个错误呢？

之后搜了 `N` 多的博客，都没找到解决办法。之后找到了一个运行成功的镜像，将 `_1.sh` 映射到它的文件系统中，在其中运行这个脚本，出现了一个报错：`Bad interpreter: No such file or directory`。

之后根据这个报错找到了这篇文章：[vi修改文件格式编码（从dos改为unix）](https://codeantenna.com/a/k4zMKI6EAS)。出现这个问题原因就是：**`Unix` 及类 `Unix` 系统里，每行结尾只有换行 `“\n”`，`Windows` 系统里面，每行结尾是换行+回车 ---> `“\r\n”`，编码格式不一样。**

文章里给出的解决办法是在 `linux` 服务器上修改文件，但是我要执行的脚本文件是从 `windows` 映射过去的，所以还是直接在 `windows` 上修改这个文件的编码。

我使用的编辑器是 `VSCode`，直接在右下角就可以选择编码格式。之前几个启动失败的镜像对应的脚本都是 `\r\n` 格式的，将它们调整为 `\r` 格式的编码，报错解决。对应的修改方式如下，对应的修改位置是文件的右下角：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424257293932fe76898a42c2c81cecc73e21441f17.png)

点击之后弹出下面的页面，选择 `LF` 即可

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424258193881b2f3fb4bb8ee0e2d243752bd46af32.png)