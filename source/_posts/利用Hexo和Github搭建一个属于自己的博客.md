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

### 执行的命令
```
## Google站点地图
npm install hexo-generator-sitemap --save

## Baidu站点地图
npm install hexo-generator-baidu-sitemap --save

## Baidu主动推送
npm install hexo-baidu-url-submit --save
```

### 修改的配置
修改根目录下 `_config.yml`，其中Baidu站点地图文件和Google站点地图文件在重新部署博客会自动生成，位置见根目录下 `.deplot_git` 文件夹。
![](https://i.loli.net/2021/07/14/eGco5xiQ38Nt4DL.png)

`source\_data\next.yml`
![](https://i.loli.net/2021/07/14/Kv3EQFreZIdWtO9.png)

### 添加的文件
爬虫配置文件：`source\robots.txt`，可以配置网站中哪些内容能被爬取到。添加完毕之后重新部署博客，在根目录下 `.deplot_git` 文件夹可以看到该文件。然后可以到 [Google robots测试工具](https://www.google.com/webmasters/tools/robots-testing-tool) 测试是否生效。
``` txt
User-agent: *
Allow: /
Allow: /archives/
Allow: /tags/
Allow: /categories/
Allow: /about/

Disallow: /js/
Disallow: /css/
Disallow: /fonts/

Sitemap: https://jokerbyrant.github.io/sitemap.xml
Sitemap: https://jokerbyrant.github.io/baidusitemap.xml
```

### 站长工具配置
#### Google
进入 [Google站长工具](https://search.google.com/search-console)，添加网站地址，拿到 `Google SEO` 配置秘钥
![](https://i.loli.net/2021/07/14/TLGPS31y6aEvOIx.png)

站点地图在博客中配置完毕后，在 [Google站长工具](https://search.google.com/search-console) 将其添加进来
![](https://i.loli.net/2021/07/14/VlZvxWErbfKYq7P.png)

#### Baidu
进入 [Baidu站长工具](https://ziyuan.baidu.com/site/)，添加网站地址，拿到 `Baidu SEO` 配置秘钥
![](https://i.loli.net/2021/07/14/Trg7YISqXJmFNER.png)

同样，在 [Baidu站长工具](https://ziyuan.baidu.com/site/) 中添加站点地图配置
![](https://i.loli.net/2021/07/14/gls8nDRvZLfEzjC.png)

如果配置了 `Robots` 文件，在下面可以进行检测
![](https://i.loli.net/2021/07/14/EjCJc3KqSt4W7YX.png)

百度主动推送的秘钥通过下面的方式拿到
![](https://i.loli.net/2021/07/14/kdZtQfaloNB7AvK.png)

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

## 网站链接优化
### 自定义文章链接
在 `_config.yml` 中找到 `permalink` 配置，然后根据自己需要自定义即可，我的配置如下
![](https://i.loli.net/2021/07/27/GReo6igVcPhXIju.png)

### 简化文章链接
利用 `hexo-abbrlink` 插件，最终效果如下：
![](https://i.loli.net/2021/07/27/W7jchnAleIDs4Ei.png)

安装 `henxo-abbrlink`
```batch
npm install hexo-abbrlink --save
```

修改 `source\_data\next.yml` 文件，添加如下配置：
```yml
# 持久化链接
permalink: archives/:abbrlink.html
abbrlink:
  alg: crc32  # 算法：crc16(default) and crc32
  rep: hex    # 进制：dec(default) and hex
```

添加完毕之后，之后使用 `hexo new` 命令创建新的文章时，就会在文件中自动添加 `abbrlink` 标识，这就是生成的持久化链接标识
![](https://i.loli.net/2021/07/27/bGgUPRDom2nHE5h.png)

然后修改 `_comfig.yml` 文件，更改文章后缀
```yml
permalink: :year-:month-:day/:abbrlink/
```
---



