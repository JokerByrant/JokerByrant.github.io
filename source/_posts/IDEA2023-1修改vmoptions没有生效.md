---
title: IDEA2023.1修改vmoptions没有生效
tags: IDEA
categories: 后端技术
abbrlink: 1729
date: 2023-06-28 13:29:45
---
最近一段时间 `IDEA` 总是会出现 `Low Memory` 的提示，最初我以为是我在 `IDEA` 中启动的项目占用内存过大导致的。因此之后有段时间，我在写代码时，会将不必要的项目关闭，但是还是会出现这个提示。

<!--more-->

之后搜索了一下，可以通过修改 `idea64.exe.vmoption` 中的 `Xmx` 来解决，具体见 `Idea` 官网的解决办法：[Increase the memory heap of the IDE﻿](https://www.jetbrains.com/help/idea/increasing-memory-heap.html)。

![1687747904735d011dcaf629482dc522884e44d3aba0c.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747904735d011dcaf629482dc522884e44d3aba0c.png)

修改之后的文件如下：

```properties
-Xms512m
-Xmx4096m
-XX:ReservedCodeCacheSize=512m
```

也可以通过上面菜单下的 `change Memory Settings` 修改，这里修改的就是 `Xmx` 大小，与上面修改的效果是一样的。

![16877479157357bb02c8cc4887a3e8d7352bb832c7660.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877479157357bb02c8cc4887a3e8d7352bb832c7660.png)

重启之后，可以通过 `Double Shift` 按钮搜索 `show memory indicator` 配置，打开 `IDEA` 内存占用显示：

![16877479307304494ce879a959e744c221647e65a8d79.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877479307304494ce879a959e744c221647e65a8d79.png)

![1687747939732be5eaa168b063fb540941a3eab1342b7.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747939732be5eaa168b063fb540941a3eab1342b7.png)

打开之后发现上面的修改没有生效。于是又去对照修改的 `idea64.exe.vmoption` 文件，发现这个文件存在两个，一个在安装目录下：

![1687747945733997b729cd41155afb92918455019103b.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747945733997b729cd41155afb92918455019103b.png)

还有一个在用户目录下，我的目录是：`C:\Users\DELL\AppData\Roaming\JetBrains\IntelliJIdea2023.1\idea64.exe.vmoptions`

![168774795373264a44e9609a49502c0a2de47b2131ff2.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/168774795373264a44e9609a49502c0a2de47b2131ff2.png)

我们在 `IDEA` 中通过 `Edit VM Options` 修改的配置文件是第二个，`IDEA` 默认加载的配置文件也是这个。

而我的配置没有生效，我设置了 `Xmx` 大小是 `4096m`，而它却显示 `1024m`，卡在这里许久。之后这个回答给了我提示，原文：[intellij Memory heap does not increased](https://intellij-support.jetbrains.com/hc/en-us/community/posts/360008453480-intellij-Memory-heap-does-not-increased-)。

![1687747960736be70b33cdd5de3298447ba59f8cb9af8.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747960736be70b33cdd5de3298447ba59f8cb9af8.png)

查看了系统环境变量，发现已经设置了默认的 `vmoption` 路径：

![16877479677322ebf55bda24af67a9f7302f4f7383077.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877479677322ebf55bda24af67a9f7302f4f7383077.png)

我的 `IDEA` 是通过激活工具激活的，那么这个环境变量就是激活工具加上去的。打开这个目录，查看 `vmoption` 文件，发现 `IDEA` 加载的确实是这个文件：

![1687747973735f478ef15c4fefbfc598a9287dcd3c6e6.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747973735f478ef15c4fefbfc598a9287dcd3c6e6.png)

调整配置：

```properties
-Xms512m
-Xmx4096m
-XX:ReservedCodeCacheSize=1024m
```

重启 `IDEA`，可以看到配置生效了：

![16877479807315e697002dc4eaf6ffe5e4447e6f37d7c.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877479807315e697002dc4eaf6ffe5e4447e6f37d7c.png)

总结：上面直接通过 `Edit Vm option` 修改 `Idea` 配置文件没有生效，原因是在环境变量中配置了自定义的 `VmOption` 配置文件，因此，需要调整这个自定义的配置文件才能使配置生效。

> 附1: [IDEA 2023.1 激活教程](https://blog.lupf.cn/articles/2023/04/07/1680832924822.html)

> 附2：如果想看 `Idea` 的日志，可以在 `C:\Users\DELL\AppData\Local\JetBrains\IntelliJIdea2023.1\log` 目录下查看。

