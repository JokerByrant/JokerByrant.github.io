---
title: IDEA一键清除项目中无效的import引用
date: 2022-03-07 10:40:47
tags: IDEA
categories: 后端技术
---

最近在做代码优化的工作，前端时间优化了项目中存在的一些 `SQL n+1` 问题，这次要优化的是项目中存在的无效 `import` 引用。

<!--more-->

## 设置自动清除无效引用
勾选之后，在当前项目下会自动清除无效的 `import`
![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16466213874041646621387291.png)

## 一键清除所有无效 `import` 引用
上面的设置只会对当前打开的文件进行处理，如果要一键处理，则需要选中最外层的 `Module` 目录，然后利用快捷键 `ctrl + alt + o`，弹出如下提示框，点击 `run` 即可(如果只处理上次 `git/svn` 同步后修改的类，则需要打勾):
![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16466215704031646621569811.png)

等待运行完毕即可：
![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16466212904031646621289509.png)

## 参考文档
[Intellij IDEA 自动清除无效 import 和一键全量清除无效import引用](https://blog.csdn.net/qq_34370153/article/details/104430116)