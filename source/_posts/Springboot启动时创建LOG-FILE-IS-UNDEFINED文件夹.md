---
title: Springboot启动时创建LOG_FILE_IS_UNDEFINED文件夹
tags: Logback
categories: 后端技术
abbrlink: 30595
date: 2023-07-25 13:50:56
---
如下，之前从未在意过这个文件夹

![16901887329649eea9741c20b415aa565d77c02ebed5f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16901887329649eea9741c20b415aa565d77c02ebed5f.png)

在 `Debug` 时发现可能是一个 `Bug`

<!--more-->

![1690188740967c606bd5b7abf44653b0d3210e50224b6.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690188740967c606bd5b7abf44653b0d3210e50224b6.png)

`Google` 了一下发现确实是个 `Bug`，在 `stackoverflow` 上找到了解决办法([原链接](https://stackoverflow.com/questions/25251983/springboot-with-logback-creating-log-path-is-undefined-folder))

![169018874896426931157b82008b06c09e128637d58e3.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169018874896426931157b82008b06c09e128637d58e3.png)

将 `Logback.xml` 重命名为 `logback-spring.xml`

![1690188756965c6b2960a05998ed5733ada497f48400b.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690188756965c6b2960a05998ed5733ada497f48400b.png)

修改 `application.properties` 配置，也可以直接将 `logging.config` 配置删除，`SpringBoot` 也能找到配置的 `logback-spring.xml`。

![169018876496678e7ccf21e0a9d281edc4dfc6f5b862d.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169018876496678e7ccf21e0a9d281edc4dfc6f5b862d.png)

之后重启项目，控制台就没有找不到配置文件的日志了，LOG_FILE_IS_UNDEFINED文件夹也不会被创建出来了。
