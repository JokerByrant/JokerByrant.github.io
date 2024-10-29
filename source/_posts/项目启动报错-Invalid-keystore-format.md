---
title: 项目启动报错 Invalid keystore format
abbrlink: 57678
date: 2024-09-26 15:25:52
tags: 后端技术
categories: 后端技术
---

在启动项目时，控制台出现了 **Invalid keystore format** 报错提示，如下：

<!--more-->

![picture 0](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/c7c30839db40c5c0b1b1beac4cc83320fb4891a61617c32b4d5a3f1b356b9a61.png)  


起初以为是端口号被占用了，因为印象中之前也出现过这个报错，使用如下的命令查看端口号占用情况：

```batchfile
netstat -ano|findstr xxx
```

端口并没有被占用，之后对电脑进行了重启，报错仍然存在，没办法，只能使用笨办法，对代码进行 Debug，看看问题出现在哪。根据控制台中打印的堆栈信息，定位到报错信息是在 `JavaKeyStore` 类中抛出的，而抛出这个异常的原因，是下面这行判断结果为 `false`

![picture 1](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/cf4f4ad5b7e89e2b34ada784d1a8d2214b315b32c170102f529c1955847acd11.png)  

这里进行的工作是对 Https 配置文件进行校验，之前都能正常运行，为何现在却出现异常了？对另一个使用了相同的 Https 配置文件的项目进行测试，启动却是正常的，在 `JavaKeyStore` 中进行密码校验能够正常通过，如下：

![picture 2](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/139bc99e940136a8ef081e2ed3443430a8b657836dfeff0ca11f7d4134ffe176.png)  

难道是因为电脑断电，导致 Https 配置文件损坏了？尝试将另一个正常运行项目下的 server.jks 替换过来，再次启动项目，启动成功了！

将损坏的 server.jks 与正常的 server.jks 文件进行对比，使用如下命令：

```batchfile
keytool -list -rfc -keystore server.jks -storepass 密钥
```

对两个文件的内容进行对比，并没有发现什么区别。虽然没有明确找到问题发生的原因，但这个问题也算是解决了，这里记录一下，方便之后定位。

### 参考文档

[如何提取JKS文件的证书和私钥?](https://blog.csdn.net/u013412772/article/details/103726591)
