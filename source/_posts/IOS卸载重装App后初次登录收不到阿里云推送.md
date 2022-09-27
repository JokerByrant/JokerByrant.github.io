---
title: IOS卸载重装App后初次登录收不到阿里云推送
tags: Flutter
categories: Flutter
abbrlink: 31797
date: 2022-07-27 15:51:18
---
项目使用的推送功能是阿里云平台的推送，后端在进行推送时一般都是使用 `Device` 进行推送，这需要 `App` 端提供用户登录设备对应的 `Devid`。最近在测试发现使用 `IOS` 设备登录 `App` 会出现 `Devid` 为空的情况，导致推送失败，下面是对问题的调查处理过程。

<!--more-->

## 问题原因

问题的原因是后台缓存中 `DevId` 为空，所以通知不会推送。

## 测试分析

`IOS` 卸载重装 `App` 后，登录 A 的账号。`App` 端会与聊天服务建立连接，这时会传一些设备信息过来，后台会将这些信息存储到缓存中，其中包括设备ID - `DevId`。

A 登录后服务端收到的设备信息如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642435179407e7094d98523670781b82f64a4e6dde6.png)

其中 `DevId` 为空，这时如果推送一条通知给A，通知将不会发送。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664243561939de999287c5487fd0c11fce98312352ae.jpg)

作为对比，找了一台 `Android` 设备，也进行卸载重装的操作，登录后对应的设备信息如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664243568941723e130f2b0e29f7e7f9d1fa0c81f4ec.png)

> 所以 `Android` 设备不会出现这个问题，只有 `IOS` 端有。

回到对 A 的测试上来，将 `App` 杀死重进后(***退出登录后重新登录也可以***)，通知就恢复正常了，因为后台拿到了 `DevId`，如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424357494061c886055356ead465232c2e1da54b65.png)

## 猜测和验证

A 登录的 `IOS` 端安装的是 `release` 版，两台测试的 `Android` 机安装的都是 `debug` 版，猜测是否与安装的版本有关，进行了如下测试：

- `IOS` 端安装 `DEBUG` 版，发现 `DevId` 能够正常拿到。
- `Android` 端安装 `Release` 版，`DevId` 能够正常拿到

> **所以可以判断出，只有安装了 `Release` 版的 `Ios` 设备会出现拿不到 `DevID` 的情况。**

## 解决办法

阿里云推送官方文档中给出了上面问题产生的原因：[iOS端获取deviceToken的问题](https://help.aliyun.com/document_detail/130561.html)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642435859429ef7faee558cc24a60f351850c88aa40.png)

与 `App` 端讨论后得出两个解决办法：

- 如果 `DeviceId` 没有获取成功，那么就继续轮询获取，直到获取成功。
- 目前会在打开 `App` 时获取一次 `DeviceId`，现在调整为在登录时再获取一次 `DeviceId`。

> 最终 `App` 使用第二种方法解决了问题。
