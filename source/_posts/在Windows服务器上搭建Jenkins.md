---
title: 在Windows服务器上搭建Jenkins
tags: Jenkins
categories: 后端技术
abbrlink: 40762
date: 2021-07-05 09:11:38
---

## 前言
在引入自动化部署工具之前，项目部署一般是按照如下流程进行的：①. 本地编译打包代码；②. 将打包后的 `jar` 包上传到服务器；③. 登录服务器，重启项目。现在可以利用自动化部署工具将这些操作自动化，实现一键部署。

<!--more-->

---

## Jenkins介绍
提起自动化部署工具，我的第一反应就是 `Jenkins`。我的毕业设计就是基于 `Jenkins` 搭建的一个自动化部署平台，[维基百科上对Jenkins的介绍](https://zh.wikipedia.org/wiki/Jenkins_(%E8%BD%AF%E4%BB%B6)) 如下：
> Jenkins是一款由Java编写的开源的持续集成工具。它提供了软件开发的持续集成服务，它运行在Servlet容器中（例如Apache Tomcat）。它支持软件配置管理（SCM）工具（包括AccuRev SCM、CVS、Subversion、Git、Perforce、Clearcase和RTC），可以执行基于Apache Ant和Apache Maven的项目，以及任意的Shell脚本和Windows批处理命令。可以通过各种手段触发构建，例如提交给版本控制系统时被触发。也可以通过类似Cron的机制调度，也可以在其他的构建已经完成时，还可以通过一个特定的URL进行请求。

按照我的理解，Jenkins可以看做是一个插件调度中心。比如上面的三步操作，第一步用到了`maven`，第二步用到了`ssh/ftp`，第三步需要执行`bat/shell`脚本。通过合理的配置，`Jenkins`就可以将这三部操作整合为一个流水`job`，只需要运行`job`就能实现一键部署操作。

---

## Jenkins的安装
### 安装
`Jenkins`有两种安装方式，`war`包和`msi`安装程序。通过`war`包安装，只需要将`war`包放入`tomcat`中对应位置，然后启动`tomcat`即可。我使用的是`msi`安装程序的方式，下面将介绍。

安装之前首先需要保证系统中已经安装了`Java`。

访问 [Jenkins下载地址](https://www.jenkins.io/download/)，找到对应的安装方式进行下载。
![](https://i.loli.net/2021/07/12/abmjnPkG23SIqDg.png)

接着打开安装程序，一路`next`。
![](https://i.loli.net/2021/07/12/uE2OxZklo7bfMCd.png)

碰到一个需要配置用户名密码的选项，选择不需要配置的那个选项。
![](https://i.loli.net/2021/07/12/7GCsXhYDFi5blO3.png)

还需要设置一下对应的端口，我设置的是`8888`。
![](https://i.loli.net/2021/07/12/BLOV4Cqr578YiXK.png)

配置`Java`
![](https://i.loli.net/2021/07/12/7XOyCpLew2FkcSb.png)

之后一路`next`，安装完毕。

### 自定义工作目录
访问 `localhost:8888`，等待一段时间，会出现如下界面。
![](https://i.loli.net/2021/07/12/7C1xyGwkgsIlYBX.png)

注意红框中的内容，对应的地址是C盘，这是`Jenkins`默认的工作目录，以后创建的`Job`以及其他的一些数据都会存放在这儿。由于C盘是启动盘，这是患有"系统洁癖"的我不能忍受的。因此在进行下一步的`Jenkins`配置之前，先将对应的工作目录修改一下。

打开Jenkins安装目录(安装程序时选择的位置)，找到`jenkins.xml`
![](https://i.loli.net/2021/07/12/7FfoaDVB1NvuSGm.png)

找到三处 `%LocalAppData%`，将其修改为自定义地址，我改成了F盘
![](https://i.loli.net/2021/07/12/7acWilqN1YmMnQK.png)
![](https://i.loli.net/2021/07/12/G3ypUL6DRNw7c2s.png)

接着，重启`Jenkins`。打开控制台，进入`Jenkins`安装目录，按对应命令进行重启：
```cmd
::重启Jenkins
jenkins.exe restart

::停止Jenkins
jenkins.exe stop

::启动Jenkins
jenkins.exe start
```
![](https://i.loli.net/2021/07/12/fsrxP3FlY1zMeWu.png)

配置完毕。

### 初始化Jenkins
再次访问`localhost:8888`
![](https://i.loli.net/2021/07/12/FyYINxhVr2lecMA.png)

找到红框中的文件，填充对应的密码，进入插件安装页面，选择安装推荐的插件，等待插件安装完成
![](https://i.loli.net/2021/07/12/nTEMxdsyhNpaHli.png)
![](https://i.loli.net/2021/07/12/6J7BOUIYwjreLlM.png)

注意：
1. 有一些插件可能会下载失败，直接点击继续即可，之后可以手动到插件管理中将下载失败的插件重新下载一下。
2. 如果没配置账号密码，选择了以admin账户继续，则后续登录对应的账号是`admin`，密码是上一步中拿到的密码

### 配置安全策略
`Jenkins`初始化完毕后，进入主页面，首先来配置一下`Jenkins`的安全配置
![](https://i.loli.net/2021/07/12/yMd6r2WoZhftJ7c.png)

下面是我的配置，也就是忽略了安全配置，不需要登录即可操作`Jenkins`
![](https://i.loli.net/2021/07/12/NHb4ODX5MT6rAcp.png)

### 下载插件
之后进入插件管理页，下载几个插件，如果有下载失败的插件，顺便也重新下载一下。
![](https://i.loli.net/2021/07/12/ou5YewQG7fXBLO4.png)
我使用的版本控制工具是`svn`，因此下载一个 `Subversion` 插件。后面会用到 `ssh` 连接服务器，再下载一个 `Publish Over SSH` 插件。

下载失败的插件按照如下步骤重新下载
![](https://i.loli.net/2021/07/12/wYgCEiKyMekjd42.png)
勾选下载完毕重启`Jenkins`
![](https://i.loli.net/2021/07/12/uAzclvpYW7kBnHj.png)

### 配置Java、Maven
接着打开全局工具配置，配置一下`Java`、`Maven`环境
![](https://i.loli.net/2021/07/12/c3RGvb9MIsNCpAH.png)
![](https://i.loli.net/2021/07/12/SsWCLbeq1EIlX3t.png)

### 配置SSH
如果需要配置`SSH`，首先需要测试目标服务器是否支持`SSH`连接。在控制台进行测试：
```cmd
ssh 登录名@ip
```
如下就是不支持
![](https://i.loli.net/2021/07/12/Dozpy7vKRkqdSib.png)

一般`linux`服务器是默认开启的，只有在`windows`服务器才会出现这种，`windows`下开启方法参考链接：[Windows服务器配置支持SSH连接](https://wujun.org/install-openssh-on-windows-server/)

进入如下菜单
![](https://i.loli.net/2021/07/12/WC9KeNohgGnJA6V.png)

滚动条划到最底部，点击新增
![](https://i.loli.net/2021/07/12/M2n3eD4HwKzrGsx.png)

按照如下方式配置
![](https://i.loli.net/2021/07/12/NH5EdTAfMjgZpzY.png)

配置完毕，测试联通性
![](https://i.loli.net/2021/07/12/ELCQu8XO4K9yYhd.png)

### 报错解决
在`Manage Jenkins`可能看到这个报错，点击进去配置一下
![](https://i.loli.net/2021/07/12/iCtU8MqF14JNTcp.png)
![](https://i.loli.net/2021/07/12/71sZWVxfO3nkDdU.png)

---

## 部署方式确定
TODO 介绍本地部署和远程部署

---

## 创建部署流水Job
创建`Job`
![](https://i.loli.net/2021/07/12/OvWPor5gtj7kT24.png)

配置对历史构建记录的保留策略
![](https://i.loli.net/2021/07/12/SBPg3ajVH2vqxWT.png)

配置代码仓库，需要添加一条凭据，凭据就是登陆代码仓库的账号密码。添加完之后，在下拉框中选择对应的凭据。
![](https://i.loli.net/2021/07/12/jwky745EvhflDBW.png)
![](https://i.loli.net/2021/07/12/onZEIzB5Lbkrjlm.png)

添加`Maven`配置
![](https://i.loli.net/2021/07/12/GZhfpVTPLloQvBd.png)
![](https://i.loli.net/2021/07/12/86ORrpnXNCjgf5y.png)

接着，配置部署脚本。我已经将几个脚本抽象出来了，因为我开发的是微服务项目，抽象出来之后可以实现脚本的复用。另外要注意的是，脚本中的路径都要写绝对路径。
![](https://i.loli.net/2021/07/12/5Tyqvp8lWZh7SM6.png)
![](https://i.loli.net/2021/07/12/jTR5np31lk7NDL4.png)

关于命令的解释如下
![](https://i.loli.net/2021/07/12/8oZmRTLBb6NXJUE.png)

下面放上几个脚本
`backup.bat`---`Jar`包备份脚本
```cmd
@echo off
::备份jar包
set prefix=%1
set jarFile=g:\rsdun-cloudfish\%prefix%.jar
echo =========================================== 备份 %prefix%.jar ===========================================
copy %prefix%\target\%prefix%.jar %jarFile%
echo =========================================== 成功备份至 %jarFile% ===========================================
```

`deploy.bat`---部署脚本
```cmd
@echo off

::1.jar包、启动日志、启动脚本、占用端口、启动成功标志
set prefix=%1
set port=%2
set profile=%3
set Xmx=%4
set successFlag=%5
set jarFile=g:\rsdun-cloudfish\%prefix%.jar
set startBat=g:\rsdun-cloudfish\jenkins\startJar.bat
set startLog=g:\rsdun-cloudfish\startLogs\%prefix%-%port%.log

::2.杀死正在运行的项目进程
echo =========================================== kill端口：%port% ===========================================
setlocal enabledelayedexpansion
for /f "tokens=1-5" %%a in ('netstat -ano ^| findstr "%port%"') do (
    if "%%e%" == "" (
        set pid=%%d
    ) else (
        set pid=%%e
    )
)
if NOT "!pid!" == "" (
   taskkill /f /pid !pid!
)

::3.删除旧的日志文件
echo =========================================== 删除日志文件：%startLog% ===========================================
:delFile
if exist %startLog% (
  del %startLog%>nul 2>nul
  goto delFile
)


::4.重启项目
echo =========================================== 重启项目 ===========================================
set BUILD_ID=dontKillMe
start %startBat% %Xmx% %jarFile% %profile% %startLog%

::5.打印启动日志
echo =========================================== 开始打印启动日志 ===========================================
set line=0
:while
set content=0
@for /f "tokens=1* delims=:" %%i in ('findstr/n .* %startLog%') do (
    @if %%i GTR %line% (
        set line=%%i
        set content=%%j
        echo %%j
    )
)
::检查项目是否输出启动成功标志
set exists_flag=false
echo %content%|find %successFlag%>nul&&set exists_flag=true
if "%exists_flag%"=="true" (
   echo =========================================== 项目启动成功！ ===========================================
   exit
)
goto while

exit
```

`startJar.bat`---`Jar`包启动脚本
```cmd
@echo off
set Xmx=%1
set jarFile=%2
set options=%3
set startLogs=%4
::由于bat中无法将=作为参数传入，因此传入@，这里替换为=
set "options=%options:@==%"
java %Xmx% -jar %jarFile% %options% > %startLogs%
```

--- 

## 遇到的一些坑






