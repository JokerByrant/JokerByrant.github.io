---
title: Android Studio打开emulator卡在starting up阶段
abbrlink: 41231
date: 2024-08-03 13:36:00
tags: Android Studio
categories: 后端技术
---

使用 `Android Studio` 打开一个模拟器时，卡在了 `starting up` 阶段<!--more-->，如下：

![picture 0](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/ca7ad00424323199e9d3ec4ba0632ce32d059a50bf2f9dbb5a7d1831ddb008f0.png)  

参考了 [Android studio emulator keep starting up and nothing happen](https://stackoverflow.com/questions/77772117/android-studio-emulator-keep-starting-up-and-nothing-happen) 的这篇回答

![picture 1](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/084c56a7dffa515ff78d4bf1f287edb8804fe4a418ae53523a6e8f26589883ab.png)  

点击 `Show on Disk` 进入模拟器所在目录

![picture 2](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1f45e43100a2b9e107fd29682b4d29fb1dd910bf227f952e5ad3a9d5d56a0dbc.png)  

将带有 `.lock` 后缀的文件和文件夹全部移除，如下：

![picture 3](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/d70df4d17577cf52171fcf979d9d66024b4b4ffcfc01795852aa6383eeb784a0.png)  

之后在就能成功启动了...
