---
title: 配置Zookeeper集群和IDEA热部署插件
tags: 开发环境
categories: 后端技术
abbrlink: 17735
date: 2023-07-24 13:53:45
---
> 记录一下工作开发环境的搭建。

<!--more-->

### Zookeeper集群

首先，去官网下载 `zookeeper`，[下载地址](https://zookeeper.apache.org/releases.html#download)。

![168774832673061a224836591c0fb2588e1a6db32b8d3.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/168774832673061a224836591c0fb2588e1a6db32b8d3.png)

下载之后，解压文件夹，然后将解压后的文件夹复制三份，分别放在server1、server2、server3文件夹下

![16877483327300098c43dd86dd160828f73ae0c22031a.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877483327300098c43dd86dd160828f73ae0c22031a.png)

之后，分别进入三个文件夹下的`conf`目录，创建`zoo.cfg`文件，配置如下

```properties
# The number of milliseconds of each tick
tickTime=2000
# The number of ticks that the initial 
# synchronization phase can take
initLimit=10
# The number of ticks that can pass between 
# sending a request and getting an acknowledgement
syncLimit=5
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just 
# example sakes.
# server1、server2和server3配置不同
dataDir=D://zookeeper/server1/apache-zookeeper-3.5.6-bin/data
dataLogDir=D://zookeeper/server1/apache-zookeeper-3.5.6-bin/log
# the port at which the clients will connect
# server1->2181、server2->2182、server3->2183
clientPort=2181

# 伪集群zookeeper的server标识
server.1=localhost:2887:3887
server.2=localhost:2888:3888
server.3=localhost:2889:3889

# the maximum number of client connections.
# increase this if you need to handle more clients
#maxClientCnxns=60
#
# Be sure to read the maintenance section of the 
# administrator guide before turning on autopurge.
#
# http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
#
# The number of snapshots to retain in dataDir
#autopurge.snapRetainCount=3
# Purge task interval in hours
# Set to "0" to disable auto purge feature
#autopurge.purgeInterval=1
```

注意，上面放的是`server1`的配置，`server2`和`server3`要调整一下`clientPort`、`dataDir`、`dataLogDir`属性。

`zoo.cfg`配置完毕，创建两个文件夹：`data`、`log`

![168774835673270280ca0acb883edab2e663a1f794b21.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/168774835673270280ca0acb883edab2e663a1f794b21.png)

在`data`文件夹下创建 `myid` 文件，`server1`的值为1，`server2`的值为2，`server3`的值为3。

![16877484117338f5f308442f15696edf730a2356bbd19.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877484117338f5f308442f15696edf730a2356bbd19.png)

到这儿，配置就完成了，进入`bin`文件夹，分别启动三个服务的`zkServer.cmd`即可。

![16877484187304014bbae3ef8b73e3a0ab2f38afe0821.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877484187304014bbae3ef8b73e3a0ab2f38afe0821.png)

更便捷的启动方法是创建一个启动脚本，实现一键启动，启动脚本内容如下：

```batchfile
start /d "D:\zookeeper\server1\apache-zookeeper-3.5.6-bin\bin" zkServer.cmd
start /d "D:\zookeeper\server2\apache-zookeeper-3.5.6-bin\bin" zkServer.cmd
start /d "D:\zookeeper\server3\apache-zookeeper-3.5.6-bin\bin" zkServer.cmd
```

### IDEA激活

[IDEA激活教程](https://tech.souyunku.com/?p=18473)

### IDEA项目热部署插件---JRebel

首先去 `IDEA` 插件市场下载这个插件

![16877484267299ae7b6a9f66ddc2348ffb7e1899f8b8d.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877484267299ae7b6a9f66ddc2348ffb7e1899f8b8d.png)

之后重启`IDEA`，进行激活操作

![16877484347304d202ae65518bcbff69a935fa8636231.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877484347304d202ae65518bcbff69a935fa8636231.png)

填入的`URL`是：`https://jrebel.qekang.com/{GUID}`，其中 `GUID` 从这个网站中获取：[获取地址](https://www.guidgen.com/)。激活成功后，将 `JRebel` 设置为离线工作模式：

![1687748443730e78c91d3ad36a487ae1a8c4cd6233356.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687748443730e78c91d3ad36a487ae1a8c4cd6233356.png)

到这儿为止，插件安装完毕。要想项目支持热部署，还得进行一些设置：

![1687748451731eca113a76ae2e8bebd861ba05ceb46de.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687748451731eca113a76ae2e8bebd861ba05ceb46de.png)

接着，需要打开运行时编译设置。快捷键 `ctrl+alt+A`，弹出的输入框中输入 `registry`，设置 `compiler.automake.allow.when.app.running`。

![1687748458734f6caaefd261683309e1f4ab28a075642.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687748458734f6caaefd261683309e1f4ab28a075642.png)

上面的设置在新版本的 `IDEA` 中可能没有，因为在 `IDEA 2021.2` 之后，该设置迁移到了 `Advanced Settings` 中，如下：

![168774846572908974d28edb8abd6352358f733f26d0a.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/168774846572908974d28edb8abd6352358f733f26d0a.png)

配置完成，之后就可以运行项目，实现热部署了

![1687748472731fd60729028f72c4e28638a95485d327f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687748472731fd60729028f72c4e28638a95485d327f.png)
