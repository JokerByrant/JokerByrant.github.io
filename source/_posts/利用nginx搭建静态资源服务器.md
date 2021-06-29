---
title: 利用nginx搭建静态资源服务器
tags: nginx
categories: 后端技术
abbrlink: 44341
date: 2021-06-28 14:14:27
---

前段时间有个需求，写一个接口，`App`端会定时将错误日志上传到服务器，然后每天早上9点，通过邮件将这些错误日志发送给`App`端的同事。这样做有一个问题，如果有错误日志上传了，`App`端的同事没办法及时的得到反馈。或者如果`App`端的同事想要立刻拿到这个日志，还需要重新到服务器上去捞。
这个问题在去年我就考虑过，每次去看线上环境的错误日志，都需要去服务器上捞日志，如果能将存储日志的文件夹映射为一个链接，访问这个链接就能直接看到文件夹下的文件结构，那就能方便许多。

<!--more-->

当时因为开发任务紧，就将这个想法抛之脑后了，今天在使用`Utools`时，发现了一个工具：`Share`，可以将本机作为一个资源服务器，暴露给外部一个链接，访问这个链接，用户可以下载文件、上传文件，非常方便。
![](https://i.loli.net/2021/06/28/jhG8piTeDW1B79Y.png)

看到这个插件，我就想我也可以为服务器搭建一个类似的资源服务器，这样以后查看日志就方便了。于是一搜，就发现其实已经有现成的轮子了，可以直接利用`nginx`完成搭建。

### 搭建流程
访问 [nginx下载地址](http://nginx.org/en/download.html)，下载稳定版
![](https://i.loli.net/2021/06/28/6Je4hUVjcaTEy8C.png)

解压之后，进到`nginx`目录，启动`nginx`
```cmd
start nginx.exe
```

然后打开目录下的`conf/nginx.conf`文件，进行配置。**务必注意下面图片中的红字提示，被这个坑卡了很久！！**
![](https://i.loli.net/2021/06/28/KWLVUfuANC6IDSa.png)

配置完毕，保存，输入命令使配置生效：
```cmd
./nginx.exe -s reload
```

然后访问链接：localhost/app，就能看到对应的文件目录了
![](https://i.loli.net/2021/06/28/JNFAdrePqp3cWw9.png)

### 美化目录结构
nginx默认的目录页看着让人一言难尽，感觉一下子回到了10年前，而接下来要做了就是优化这个页面。

我的电脑系统是`windows`，网上关于这个的教程基本都是针对`linux`环境的，因此找了许久才找到一个合适的。

#### 方法1
借用 [美化nginx的autoindex页面](https://steemit.com/cn/@ety001/nginx-autoindex) 针对这个方法的描述：
> 这个方案是依赖的 `Nginx` 的这个参数 `autoindex_format`，这个参数可以规定输出信息格式，默认是 `html`，我们可以设置这里为 `json`, 这样就变成了一个 `api` 接口。然后自己去开发一套自己喜欢的前端，调用这个 `api` 接口就可以了。

`github`上找到一个现成的例子：[pretty-autoindex](https://github.com/spring-raining/pretty-autoindex.git)。(**务必阅读一下`Readme.md`，根据其指导修改对应的配置**)

然后直接修改`nginx`的配置
```conf
# 转向美化后的目录页
location / {
    root   D:/workspace/pretty-autoindex/dist/; # 项目地址
    index  index.html;
    autoindex off;
}

# 作为Api使用
location /app {
    root   C:/cloudfish/images/; # 需要暴露的目录
    autoindex on;
    autoindex_localtime on;
    autoindex_exact_size off;
    autoindex_format    json;

    # Enable your browser to access here.
    add_header  Access-Control-Allow-Origin "*";
    add_header  Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header  Access-Control-Allow-Headers "Origin, Authorization, Accept";
    add_header  Access-Control-Allow-Credentials true;
}
```

[pretty-autoindex](https://github.com/spring-raining/pretty-autoindex.git) 这个项目利用了`gulp`对`js`进行了打包，我对这一块儿也不是太熟，因此没有进行进一步的自定义，只在其基础上修改了一些简单的`css`和`js`，最终效果如下：
![](https://i.loli.net/2021/06/29/rxUQ6gZ8TpLildj.png)

#### 方法2
方法1是通过请求`api`接口获取目录信息，而方法2则是通过获取网页元素的方式，来拿到目录信息。

`nginx`配置:
```conf
location / {
    root   D:/nginx-1.20.1/html;
    index  index.html index.htm;
    charset utf-8;
    autoindex off;
}

# 只有访问该目录，样式才变化
location /app {
    root   C:/cloudfish/images/;
    charset utf-8;

    autoindex on;
    autoindex_exact_size off;
    autoindex_localtime on;

    autoindex_format    html;
    add_after_body /autoindex/footer.html;  # 这里指向的是 D:/nginx-1.20.1/html/autoindex/footer.html
}
```
需要注意的是：`add_after_body`中配置的样式文件，必须在`nginx`的`html`文件夹下。
![](https://i.loli.net/2021/06/29/NCcua6AWnx4qOSd.png)

样式文件下载地址：[fulicat/autoindex](https://github.com/fulicat/autoindex.git)

#### 方法3
TODO，参考：[实现Nginx文件目录的排序功能](https://www.sohu.com/a/149035094_216613)

## 参考文章
[美化nginx的autoindex页面](https://steemit.com/cn/@ety001/nginx-autoindex)



