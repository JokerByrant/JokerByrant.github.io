---
title: 解决Graphics2D生成的图像锯齿问题
tags: Graphics2D
categories: 后端技术
abbrlink: 28121
date: 2022-02-25 22:54:43
---
## 问题描述

后台有两个业务：**生成二维码、生成群聊头像**，这两个使用的方法都是利用 `Graphics2D` 对图片进行裁剪拼接。最近测试发现，通过这个方法生成的图片锯齿问题很严重，在 `App` 端即便展示的是小图也能很明显的看出。<!--more-->为了方便展示，下面展示的图片是放大后的，如下：
![圆形群聊Logo](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458009966871edaae88571a1caa7d21596d57da4147.png)
![圆形二维码](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458010496875192b72c4d943ae886a858b4447d1026.png)

这个情况只有圆形图片才会出现，方形图片不存在这个问题。作为对比，下面放上方形图片的展示效果：
![方形群聊Logo](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458010696880e591fc2371073d57c5d9fb4470fd30d.png)
![方形二维码](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/164580108669021a9c064e72ac8b37a4c2be3b59983b9.png)

## 优化记录

只有生成的圆形图片存在锯齿问题，那么首先定位到问题是由裁剪图片相关的代码引起的，因此下面对这一块的代码进行优化：
1. 首先尝试了为生成的圆形图片增加抗锯齿的配置，但是没有任何效果。
```java
// 增加抗锯齿配置
graph.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
```
`RenderingHints` 的作用见文档：[Class RenderingHints](https://www.apiref.com/java11-zh/java.desktop/java/awt/RenderingHints.html)

2. 接着继续搜寻解决方案，在 [JAVA 将图片剪裁成圆形，并在圆形外带有白边](https://cloud.tencent.com/developer/article/1622630) 中找到了相应的优化办法：**图片裁剪成圆形后，在图片外面再绘制一层圆形边界**。如下：
```java
// 绘制圆形图片
BufferedImage bi2 = new BufferedImage(bi1.getWidth(), bi1.getHeight(), BufferedImage.TYPE_4BYTE_ABGR);
Graphics2D g2 = bi2.createGraphics();
g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
Ellipse2D.Double shape = new Ellipse2D.Double(0, 0, bi1.getWidth(), bi1.getHeight());
g2.setClip(shape);
g2.drawImage(bi1, 0, 0, bi1.getWidth(), bi1.getHeight(), null);
g2.dispose();
// 利用画笔在切割后的圆外面再画一个圆，这样画的圆不会有锯齿
g2 = bi2.createGraphics();
g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
Stroke s = new BasicStroke(2, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND);
g2.setStroke(s);
g2.setColor(new Color(231, 231, 231));
g2.drawOval(0, 0, bi1.getWidth(), bi1.getHeight());
g2.dispose();
```
   
原理就是通过绘制一个边界来消除圆形的锯齿问题：
![样例图](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458011646878b2d5ad024a5861a79edab7708f4d3f7.png)

最终优化后的效果如下：( _**注：左边是优化前的，右边是优化后的**_ )
![对比图](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645801770093215fd863318906860c72ef7f035bbf3a.png)

## 参考文档
[JAVA 将图片剪裁成圆形，并在圆形外带有白边](https://cloud.tencent.com/developer/article/1622630)
[RenderingHints 中文文档](https://www.apiref.com/java11-zh/java.desktop/java/awt/RenderingHints.html)
