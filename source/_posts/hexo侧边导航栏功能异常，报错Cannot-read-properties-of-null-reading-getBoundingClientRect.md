---
title: hexo侧边导航栏功能异常，报错Cannot read properties of null (reading getBoundingClientRect)
abbrlink: 49319
date: 2022-09-29 13:13:46
tags: 前端技术
categories: 前端技术
---

最近在整理博客，发现网站的侧边导航栏功能无法正常使用了，如下：
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16644285146961664428513842.png)

<!--more-->

点击某个子菜单正文没有跳转到对应位置，并且当前高亮的菜单也不对。打开开发者工具，发现报了一个错误：
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16644285926951664428592222.png)
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16644286076971664428606916.png)

是 `utils.js` 文件中的 `registerSidebarTOC` 方法报错了，这个方法是用来实现点击侧边栏跳转正文指定位置的功能的。通过解析侧边栏中链接的 `href` 值，然后找到正文中对应的 `id`，以此定位到正文的指定位置。
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16644295266951664429526165.png)
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16644295876971664429586963.png)

可以看到侧边栏的 `href` 存在乱码的情况，而正文中的 `id` 是正常的，这就是导致 `target` 为 `null` 的原因。

现在着手解决这个问题，开始的时候我钻到了牛角尖里，一直在思考为什么侧边栏的 `href` 会乱码。博客配置中各种配置都配置的没有问题，找了很多文章也没找到原因。后来转念一想，既然无法解决 `href` 乱码的问题，那就在解析时将其手动格式化成中文格式，在拿到 `href` 后，通过 `decodeURI` 方法进行格式化，最终问题解决：
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16644299086971664429908000.png)

