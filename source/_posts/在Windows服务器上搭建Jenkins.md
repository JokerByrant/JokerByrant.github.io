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
```bat
@echo off
::备份jar包
set prefix=%1
set jarFile=g:\rsdun-cloudfish\%prefix%.jar
echo =========================================== 备份 %prefix%.jar ===========================================
copy %prefix%\target\%prefix%.jar %jarFile%
echo =========================================== 成功备份至 %jarFile% ===========================================
```

`deploy.bat`---部署脚本
```bat
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
start %startBat% %Xmx% %jarFile% %profile% %startLog%

::5.打印启动日志
echo =========================================== 开始打印启动日志 ===========================================
set line=0
:while
set content=
@for /f "tokens=1* delims=:" %%i in ('findstr/n .* %startLog%') do (
    @if %%i GTR %line% (
        set line=%%i
        set content=!content!%%j
        set content=!content:~-2000!
        echo %%j
    )
)
::检查项目是否输出启动成功标志
set exists_flag=false
echo !content!|find %successFlag%>nul&&set exists_flag=true
if "%exists_flag%"=="true" (
   echo =========================================== 项目启动成功！ ===========================================
   exit
)
goto while

exit
```

`startJar.bat`---`Jar`包启动脚本
```bat
@echo off
set Xmx=%1
set jarFile=%2
set options=%3
set startLogs=%4
::由于bat中无法将=作为参数传入，因此传入@，这里替换为=
set "options=%options:@==%"
set BUILD_ID=dontKillMe
java %Xmx% -jar %jarFile% %options% > %startLogs%
exit
```

--- 

## 遇到的一些坑

### 服务器CPU占用率达到100%
这个情况是在运行了1个多月后发现的，服务器出现了大量`cmd.exe`和`conhost.exe`进程(大约有300多个)，占用了大量`CPU`资源。
![](https://i.loli.net/2021/08/27/L2NhYbXyf8CkMxl.png)

开始以为是服务器中病毒了，但是排查之后并没有发现相关迹象。之后猜测是不是`Jenkins`的原因，因为这段时间服务器也就加了`Jenkins`和`Nginx`两个服务。于是便对`Jenkins`进行了调查。
在进行Jenkins构建过程中，服务器会出现一些`cmd.exe`进程：
1. 进行`Maven`打包时会开启一个`cmd.exe`进程，打包结束该进程自动关闭。
2. 在打印日志时，开启一个`cmd.exe`进程，打印结束`cmd.exe`关闭。
3. 整个`Job`构建结束，会有一个`cmd.exe`进程仍然残留。在进行n次构建后，会残留n个该进程，这就是为什么`CPU`占用率会达到100%的原因。

出现进程残留，于是猜测是不是脚本执行完毕没有关闭？于是对脚本进行了排查，先分别单独测试只有其中一个步骤的情况，最后发现残留的进程是在 **启动Jar包** 的那一块出现的。接着再对这一块儿进行逐行测试，测出可能是 **`set BUILD_ID=dontKillMe`** 这一行命令导致的问题。如下(上面的完整命令已修复为正确版本，下面展示的是之前有问题的版本)：
```bat
::4.重启项目
echo =========================================== 重启项目 ===========================================
set BUILD_ID=dontKillMe
start %startBat% %Xmx% %jarFile% %profile% %startLog%
```
> 解释一下这行命令，这是为了防止`Jenkins`将启动`Jar包`的进程杀死，如果不加这一行，在`Job`执行完毕后，`Jar包`对应的进程也会一并被杀死。

这行命令还不能删，删除会导致`Jar包`无法启动，因此尝试将其换了个位置，将其放在了 `startJar.bat` 中，如下：
```bat
@echo off
set Xmx=%1
set jarFile=%2
set options=%3
set startLogs=%4
::由于bat中无法将=作为参数传入，因此传入@，这里替换为=
set "options=%options:@==%"
set BUILD_ID=dontKillMe
java %Xmx% -jar %jarFile% %options% > %startLogs%
exit
```
再次运行，发现仍然会有 `cmd.exe` 进程残留。运行n次，仍然只有一个 `cmd.exe` 进程残留，对服务器的影响已经很小了。并且，尝试将已经启动的`Jar`包程序杀死后，对应的`cmd.exe`进程也会停止。也就是说不会再出现上面的残留300多个进程的情况，**最多只会出现与启动服务数量相同的`cmd.exe`进程**，而这完全是可以接受的。

最后分析一下上面问题产生的原因：
1. 将 `set BUILD_ID=dontKillMe` 放在 `start %startBat% %Xmx% %jarFile% %profile% %startLog%` 这行命令之前，意思就是告诉`Jenkins`不要杀死`start`启动的`cmd.exe`进程。每次服务启动前杀死之前`Jar`包进程的不会对之前的`cmd.exe`产生影响，因此残留的`cmd.exe`进程会越积越多，最后拖垮服务器。
2. 而将 `set BUILD_ID=dontKillMe` 放在 `startJar.bat` 中后，意思则是告诉`Jenkins`不要杀死`java -jar` 启动的`Jar`包进程。由于每次启动服务前都会将之前的`Jar`包进程杀死，因此上一次构建残留的`cmd.exe`进程也会被一并杀死，因此残留的`cmd.exe`进程只会有寥寥几个。


### 启动日志未检测到退出点，导致Job无法终止
这个问题在一开始就发现了， `windows` 没有 `linux` 那样多样的命令，因此打印启动日志是通过 `while` 循环实现的，检测到启动成功标志时，退出打印。这个成功标志是手动指定的。
先看一下之前的命令(上面完整的命令已修复为最新的，这里展示之前有问题的版本)：
```bat
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
::这里拿到的content是最后一行的数据
echo %content%|find %successFlag%>nul&&set exists_flag=true
if "%exists_flag%"=="true" (
   echo =========================================== 项目启动成功！ ===========================================
   exit
)
goto while
```
注意几个 `content`，上面的 `echo %content%|find %successFlag%>nul&&set exists_flag=true`，这行命令是检测是否打印退出标志的关键。 `content` 的值是当前循环打印出的最后一行日志的信息，**如果退出标志没有在当前循环的最后一行日志出现，那么就会出现无法退出日志打印的情况**。

我之前的解决办法是利用`Jenkins`中的超时设置，为构建增加一个最长响应时间，分析了历次的构建时间，确定了该时间为10分钟，如果整个构建时间超过10分钟，那么将自动退出构建。设置如下(需要对每个Job单独设置)：
![](https://i.loli.net/2021/09/01/jwiHQGVUvyN4qgu.png)

但是该项设置只是缓兵之计，之后的构建中出现了很多次日志无法退出的情况，让人抓狂。今天突然想起之前看过的 **延迟变量** 概念，之前也对这个做了记录，链接：{% post_link bat拼接字符变量，将文件内容赋值给变量保留换行 %}。

于是对打印日志的命令做了修改，之前检测启动成功标志只能根据当前循环的最后一行日志，修改后可以根据循环内的所有日志，这样就不会产生遗漏了。优化后的效果有点类似`Java`中的字符串拼接，之前也尝试过该办法，但是由于不了解**延迟变量**这个概念，因此没有达到理想的效果。修改后的命令如下：
```bat
::5.打印启动日志
echo =========================================== 开始打印启动日志 ===========================================
set line=0
:while
set content=
@for /f "tokens=1* delims=:" %%i in ('findstr/n .* %startLog%') do (
    @if %%i GTR %line% (
        set line=%%i
        set content=!content!%%j
        echo %%j
    )
)
::检查项目是否输出启动成功标志
set exists_flag=false
::这里拿到的content是最后一行的数据
echo !content!|find %successFlag%>nul&&set exists_flag=true
if "%exists_flag%"=="true" (
   echo =========================================== 项目启动成功！ ===========================================
   exit
)
goto while
```

上面已经基本能满足一般的项目打印日志的需求了，但是在实际使用期间仍然出现了问题：**日志输出了退出标志，但是Job仍在运行**。会出现两种情况：1.输出 **命令行过长** 的提示信息。2.无任何提示。

Google了一下发现Windows确实有最大字符限制：
![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1630559062972-1630559062971.png)

上面出现的两种情况都是这个限制导致的。由于上面利用了 **延迟变量** 实现了 **字符串拼接** 的拼接，导致 `content` 变量字符长度过长，超出了8191个，因此出现了命令行过长的提示。
而无任何提示则是因为，不知道出于什么原因，`content` 有时会将超出8191个字符长度的字符剔除，而启动成功标志也在其中，因此到结尾无法检测到。
![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1630559624664-1630559624652.png)

针对这一情况，我的解决办法如下：每次对 `content` 进行字符串拼接后，只取其中最后2000个字符，这样就不会出现上面的两种情况了，而启动成功标志基本也都会出现在这最后2000个字符中。最终代码如下：
```bat
::5.打印启动日志
echo =========================================== 开始打印启动日志 ===========================================
set line=0
:while
set content=
@for /f "tokens=1* delims=:" %%i in ('findstr/n .* %startLog%') do (
    @if %%i GTR %line% (
        set line=%%i
        set content=!content!%%j
        ::只取最后2000个字符，启动成功标志一般都会在其中
        set content=!content:~-2000!
        echo %%j
    )
)
::检查项目是否输出启动成功标志
set exists_flag=false
::这里拿到的content是最后一行的数据
echo !content!|find %successFlag%>nul&&set exists_flag=true
if "%exists_flag%"=="true" (
   echo =========================================== 项目启动成功！ ===========================================
   exit
)
goto while
```