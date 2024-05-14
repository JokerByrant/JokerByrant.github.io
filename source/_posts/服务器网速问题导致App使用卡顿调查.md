---
title: 服务器网速问题导致App使用卡顿调查
abbrlink: 64010
date: 2024-02-25 14:44:20
tags: 网络
categories: 后端技术
---
### 前言

目前生产环境下的 `App` 经常会出现使用卡顿，有下面几种表现：
<!--more-->

1. 在 [加载中] 页面会停留较长时间，如下
![1711437323110407ccac5c5ac9e1db8d3d458d0a743a0.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1711437323110407ccac5c5ac9e1db8d3d458d0a743a0.png)

2. 软件安装包下载速度较慢

3. 图片视频音频资源加载速度较慢。

之前开会时讨论过这个问题，当时定位的原因是 **服务器带宽导致的**。但是这只是其中一个原因，下面来结合各个因素整体分析一下 **生产服务器网速较慢** 的原因。

### 网速较慢的原因

目前 **云鱼App** 涉及的所有服务都部署在同一台生产服务器上，这些服务共享同一台服务器的带宽资源，其中占用网络带宽资源较多的服务是：**[接口服务]、[聊天服务]、[文件服务]、[管理页面]** 四个服务。

下面的这些行为都会占用网络带宽资源：**`App` 端请求接口、用户发送聊天消息、用户查看图片/视频、用户下载 `App` 安装包、用户在管理页面操作**。这些行为可以分为3类：**接口请求、聊天消息对应的 `Socket` 请求、静态资源的加载**。这3类中，**静态资源的加载** 对服务器带宽资源的占用最大，因为 **静态资源** 是内存占用较大的 **图片/视频/音频/文件**，相比 **接口请求** 和 **聊天消息对应的 `Socket` 请求** 会耗费更多的带宽资源。

进行如下测试，在 **管理页面 - 商品列表** 中进行的一次查询列表数据操作对应的网络请求：

![1711437350112e08450a76a183bdd532ab466ddec4b2b.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1711437350112e08450a76a183bdd532ab466ddec4b2b.png)

另外，还有一种更直观的方式来测试 **加载静态资源占用带宽导致 `App` 网络卡顿** 的情况：在浏览器中同时开启多个 **`App` 安装包下载任务**，然后这时使用 `App`，就会出现接口请求缓慢，甚至可能出现 [图片/视频/音频] 加载失败的情况。

![17114373701111eaeadca5420e02784f5d1912ec72b55.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17114373701111eaeadca5420e02784f5d1912ec72b55.png)

### 处理办法

最直接的办法：**增加服务器的带宽**，但这个方案应该只能缓解网络卡顿的情况。上面说过，**静态资源的加载** 是占用服务器带宽的主要因素，因此可以考虑对这一块儿进行优化，有如下几个办法：

1. **额外购买服务器**。将涉及 **静态资源加载** 较多的服务单独部署，目前主要集中在 **[文件服务]** 和 **[管理页面]** 两个服务中。
2. **静态资源通过 [对象存储服务] 进行存储和访问（阿里云简称 `OSS`，华为云简称 `OBS`，下面统一描述为 `OSS`）**。 
   
   `OSS` 工作原理(*来源：阿里云*)
   > 数据以对象（Object）的形式存储在OSS的存储空间（Bucket ）中。如果要使用OSS存储数据，您需要先创建Bucket，并指定Bucket的地域、访问权限、存储类型等属性。创建Bucket后，您可以将数据以Object的形式上传到Bucket，并指定Object的文件名（Key）作为其唯一标识。
   > 
   > OSS以HTTP RESTful API的形式对外提供服务，访问不同地域需要不同的访问域名（Endpoint）。当您请求访问OSS时，OSS通过使用访问密钥（AccessKey ID和AccessKey Secret）对称加密的方法来验证某个请求的发送者身份。
   
   将静态资源通过云服务商的 `OSS` 进行存储，之后访问静态资源时，直接请求 `OSS` 服务的地址，这种方式使用的是 `OSS` 服务的流量，**需要支付 `OSS` 服务的 [存储] 和 [流量] 费用**。文档地址：[对象存储服务OBS - 华为云](https://support.huaweicloud.com/obs/index.html)，价格参考：[OBS价格计算器 - 华为云](https://www.huaweicloud.com/pricing/calculator.html#/cdn)
3. **静态资源存储在云服务器上，通过 `CDN` 服务进行访问。** 
   
   `CDN` 工作原理(*来源：华为云*)
   
   ![171143738611281effad22e8bd395dde3d0afdd4c3b3e.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/171143738611281effad22e8bd395dde3d0afdd4c3b3e.png)
   
   `CDN` 服务的优势见：[为什么推荐将静态资源放到CDN上？](https://blog.csdn.net/He_9a9/article/details/134930092)
   
   静态资源仍然存储在云服务器中，开通云服务商的 `CDN` 服务，之后访问静态资源时，请求配置的 `CDN` 服务地址，**这种方式需要额外支付 `CDN` 服务的流量费用**。文档地址：[内容分发网络CDN - 华为云](https://support.huaweicloud.com/price-cdn/cdn_01_0158.html)，价格参考：[CDN价格计算器 - 华为云](https://www.huaweicloud.com/pricing/calculator.html#/cdn)
4. **静态资源通过 `OSS` 进行存储，通过 `CDN` 服务进行访问。**
   
   工作原理(*来源：[使用CDN加速OSS访问 - 阿里云](https://help.aliyun.com/zh/cdn/use-cases/accelerate-the-retrieval-of-resources-from-an-oss-bucket-in-the-alibaba-cloud-cdn-console)*)
   
   ![17114374081124651fed76dd88f3f33661cb0d1411325.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17114374081124651fed76dd88f3f33661cb0d1411325.png)
   > 补充说明：上面给出的工作原理中，静态资源是存储在 `OSS` 中的，如果将其替换为存储在云服务器上，那么就是上面说的第3种方法了。
   
   参考：[已经有了阿里云OSS还需要开通CDN吗？](https://blog.csdn.net/crazestone0614/article/details/127189079)
   
   接入方法：[CDN访问加速 - 阿里云](https://www.alibabacloud.com/help/zh/oss/user-guide/use-cdn-to-accelerate-access-to-oss)
5. **手动限制静态资源的下载速度**。在静态资源所在的服务中添加代码，限制静态资源的下载速度。如果代码中无法处理，可以考虑将静态资源通过 `Nginx` 配置直接访问，然后在 `Nginx` 中限制下载速率，参考：[文件服务器文件加载较慢的解决方案（CDN+Nginx）](https://juejin.cn/post/6866069193201025037)。

综合来看，目前较为合适的处理是第3种：**静态资源存储在云服务器上，通过 `CDN` 服务进行访问**。通过这种处理只需要接入 `CDN` 服务即可，目前静态资源占用的空间不大，服务器自带的存储空间完全够用，**待后期服务器存储空间不足时可以再考虑接入 `OSS` 服务**。

### 补充

在进行改造前，可以先调查下生产服务器目前的网络资源使用情况，方便与改造之后的情况进行对比。

### 引入`CDN`后带来的问题

需要注意 `CDN` 盗刷问题：

- [CDN 被刷几百 TB 流量求防刷措施](https://s.v2ex.com/t/1005271)
- [阿里云OSS被刷，我交了1000RMB学费](https://nickxu.me/post/aliyun-oss-brushed-1000rmb-fees)

> 目前的生产服务器其实也存在被盗刷的风险，额外引入 `CDN` 并不会让这个风险增加或减少。

华为云和阿里云给出的相关的处理办法：

- [高额账单风险警示 - 华为云](https://support.huaweicloud.com/price-cdn/cdn_01_0167.html)
- [高额账单风险警示 - 阿里云](https://help.aliyun.com/zh/cdn/product-overview/configure-high-bill-alerts?spm=a2c4g.11186623.0.0.435158d9o3Q2wT)

### 参考文章

[CDN：静态资源如何加速？](https://zhuanlan.zhihu.com/p/348012432)

[内容分发网络CDN - 华为云](https://support.huaweicloud.com/cdn/index.html)

[CDN - 阿里云](https://help.aliyun.com/zh/cdn/)

[文件服务器文件加载较慢的解决方案（CDN+Nginx）](https://juejin.cn/post/6866069193201025037)

[为什么推荐将静态资源放到CDN上？](https://blog.csdn.net/He_9a9/article/details/134930092)

[被刷7Tb+.追根溯源,找到凶手,谨防LOC论坛小人](https://hostloc.com/thread-1224989-1-1.html)
