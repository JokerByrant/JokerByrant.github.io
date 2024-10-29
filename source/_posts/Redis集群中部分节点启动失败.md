---
title: Redis集群中部分节点启动失败
abbrlink: 15494
date: 2024-10-10 09:16:10
tags: Redis
categories: 后端技术
---

本文记录一下 Redis 集群中节点的 AOF 文件损坏导致启动失败，以及新增节点的处理过程。

<!--more-->

### 问题描述

在启动 Redis 集群时，发现其中两个服务没有启动成功，如下：

![picture 0](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/f774a1de848d14d88a6dbe42f43e0065ae48a93e12e30a748b788a3090ba0d85.png)  

![picture 1](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/8b0817bf5cf49df11c84eea4a40c5e192837e4a17df1c343fc043b2ca272cec4.png)  

分别是`6381` 和 `6382` 端口的服务，经过调查，两个节点启动失败的原因如下：

- `6381` 节点没有成功加入 Redis 集群，
- `6382` 节点的 AOF 文件发生了损坏。

通过 `cluster nodes` 看下集群节点状态，如下：

![picture 2](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/d9a3d44afef2b93b859768a0286a3429ec922c5800c7e7647a5b9c8caf2b20c2.png)  

集群中只有5个节点，其中3个 master 节点，2个 slave 节点，`6382` 节点是启动失败状态，而 `6381` 端口并没有在集群中。

下面分别看下处理方案。

### AOF 文件损坏

控制台中已经给出了处理方法，运行下面的命令即可：

```lua
redis-check-aof --fix <filename>
```

进入 `6382` 节点目录下，运行该命令，在对应的文件夹中，发现很多 `temp-rewriteaof-xxx.aof` 文件，如下：

![picture 3](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/ed755ef4ab52276ba7bd311362eca79e42603b875dfc3f1036e54d7d4fa50a4f.png)  

修复成功后，节点就能成功启动了，但是控制台出现了如下的报错：

![picture 4](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/b356820aa1070dcbe8c4ac9db0a2abd7fb9fc2aaf6744535594ecd32bb512df0.png)  

经过调查，这个报错会导致 `6382` 节点文件夹下生成大量 `temp-rewriteaof-xxx.aof` 文件，如下：

![picture 5](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/dea6040dee99d6b876612aac347cda326f74107d93d04cbc16f760e6b07b5458.png)  

这些文件是 Redis 在执行 AOF 重写（Append-Only File Rewrite） 操作时生成的临时文件。下面来看一下为什么会出现这些文件：（*来源：chatgpt*）

1. **AOF 重写：**AOF 是 Redis 用于持久化的方式之一，它会将每一个写操作（如 SET、INCR 等）记录到 AOF 文件中，确保数据的持久性。当 AOF 文件的大小超过一定阈值时，Redis 会自动触发重写操作，以压缩和减少 AOF 文件的体积。这个过程是通过生成一个临时文件来完成的，也就是 temp-rewriteaof-xxxx.aof 文件。
2. **临时文件：**在重写过程中，Redis 会将所有操作写入这个临时文件，重写完成后会用这个文件替换旧的 AOF 文件。
3. **异常退出：**如果 Redis 在 AOF 重写时崩溃或者重写操作中途被中断，这些临时文件可能不会被自动删除。这就导致了大量 temp-rewriteaof-xxxx.aof 文件的残留。

而产生这个报错的根本原因是 **在进行 AOF 重写时，AOF 文件中存在未知的命令**，如下：

![picture 6](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/dec5a69778c3767d49e4632eb4e2a36cdd37e99ad6b3ade5ce85cf16adcc4cb1.png)  

将这段异常的指令移除，`6382` 节点就能正常启动了，而那些 `temp-rewriteaof-xxx.aof` 文件也可以移除了。

### 添加新的 Slave 节点

上面的 `6382` 节点修复完成后，再看下 Redis 集群的情况：

![picture 7](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/f9d84d46d55f50f6413fe630d470a3588efe6235b247e687744af273cf60b06f.png)  

可以看到，`6383`、`6384`、`6385` 三个是 master 节点，而 `6380` 是 `6383` 的 slave 节点，`6382` 是 `6385` 的 slave 节点。剩余一个未知端口的节点是 `6384` 节点的 slave 节点，我们将这个未知的节点移除：

```lua
ruby .\redis-trib.rb del-node 127.0.0.1:6381 78e3d67bae1f4705b0215ac19238dff29156c95f
```

但是移除失败了：

![picture 8](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/7152a9f0b3b4cbec29f9735ed983ed59486629b757934b30d57fddb03cb3d7bf.png)  

这个节点对整个 Reids 集群并没有影响，因此不管它也可以，当然也可以在各个 Redis 节点下执行下面的命令来忽略它：

```lua
cluster forget 78e3d67bae1f4705b0215ac19238dff29156c95f
```

接着将 `6381` 节点设置为 `6384` 的 slave 节点，启动 `6381` 节点，在 `redis-trib.rb` 所在目录下执行如下命令：

```lua
ruby .\redis-trib.rb add-node --slave --master-id c53c2ec015170e9339d87a26b9c61d9b46b901ba 127.0.0.1:6381 127.0.0.1:6384
```

这串命令的含义为：`./redis-trib.rb add-node --slave --master-id {主节点id} {添加节点的ip和端口} {集群中已存在节点ip和端口}`

运行之后出现了如下报错：

![picture 9](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/af8bb190966962bd302efc5611ae393cc1160195d0b5e154d81f8e253f04dbf4.png)  

因为 `6381` 节点已经存在数据了，将该节点的 `appendonly.aof` 文件清空，然后再重启节点，之后重新执行命令，成功

![picture 10](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/01a2e43820c0ffe3f38a95353913c0e4038891c719ac678bb5d2bf1b5f3b499b.png)  

再来通过 `cluster nodes` 看下集群状态：

![picture 11](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/3ab6bc2902ec103c6a9a086b820addc00f4e4d0f441a976325d58c43fac8f360.png)  

### 附：redis-trib包含的命令

![picture 12](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/31b53febf150b11a977a2b5f2af4f2cdaae76c84538f0eea35fa5c29344e3028.png)  

### 参考文档

[Redis Cluster集群搭建及节点的添加、删除](https://www.cnblogs.com/zhengzhaoxiang/p/13977059.html)

[Windows下Redis集群搭建(超详细教程)](https://blog.csdn.net/xzpaiwangchao/article/details/124530880)