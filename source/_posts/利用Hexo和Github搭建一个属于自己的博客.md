---
title: 利用Hexo和Github搭建一个属于自己的博客
tags: hexo
categories: 网站优化
abbrlink: 60706
date: 2021-07-14 09:33:56
---

这篇文章用来记录自己利用Hexo和Github搭建的博客，博客搭建了也有一年多了，今天就来重新整理一下搭建的流程。

<!--more-->

## 网站搭建

---

## 配置SEO
最近突然想看看平常写的东西有没有人看，虽然不是很在意，但是如果有人看了那还是很有鼓励的。于是去google上搜了自己的博客，发现居然一条都搜不到，试了百度和bing都没有，奇了怪了。

于是就发现了`SEO`(搜索引擎优化)这个东西，想要自己的网站在`Google`和`Baidu`这些搜索引擎被搜索到，就需要在它们那儿添加索引。除非你的网站知名度比较高，否则是不会被它们主动收录的，因此就需要我们来完成这个操作，让搜索引擎能够爬取到我们的网站内容。

### 参考链接
[SEO最有用的教程](https://weilining.github.io/1.html)---比较详细，细节不足
[hexo 百度主动推送](https://lanlan2017.github.io/blog/7ac3f85/)

---

## 添加网站访问人数
网站支持了`SEO`后，还是没法看到被访问的情况，因此需要为其加上访问统计次数。

### 常规添加方法
使用 [不蒜子](http://busuanzi.ibruce.info/) 来进行配置，[配置教程](http://ibruce.info/2015/04/04/busuanzi/)。

### next主题下的添加方法
如果使用的是`next`主题，那么配置就更简单了，`next`主题默认已经集成了不蒜子的访客人数和文章阅读次数功能。

直接修改 `source\_data\next.yml` 文件，搜索 `busuanzi`，将 `enable` 置为 `true` 即可。
![](https://i.loli.net/2021/07/14/YGudrUtkZMjscWn.png)

对应的样式文件路径是 `themes\next\layout\_third-party\statistics\busuanzi-counter.swig`，如果需要可以自己 `DIY`。
![](https://i.loli.net/2021/07/14/TH24CFDAbOKnWkM.png)

最终效果如下
![](https://i.loli.net/2021/07/14/JYZ1x4POfTkvV6y.png)

在具体的文章页面也能看到阅读次数
![](https://i.loli.net/2021/07/14/tJunadHUZprOLAE.png)

---



