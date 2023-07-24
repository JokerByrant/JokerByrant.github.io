---
title: 频繁的大文件IO导致服务器卡顿
tags: Jenkins
categories: 后端技术
abbrlink: 54234
date: 2023-07-24 15:41:20
---
### 问题描述

之前搭建的 `jenkins` 平台，为了在 `jenkins` 的 `job` 中打印项目的启动日志，在 `jar` 包启动时使用了将日志输出到指定文件的方式。这种方式存在一个问题：**日志文件的大小会无限的增大下去**。而 `java` 写日志是一个频繁的 `I/O` 操作，日志文件大小越大，`I/O` 操作越费时，并且会导致服务器卡顿。所以之前有几次定位到服务器异常的卡顿，可能就是这个问题引起的。

<!--more-->

### 之前的处理

这个日志文件作用不大，我们平常定位问题都是通过 `logback` 输出的日志来定位，而这个日志的作用就是在 `jenkins` 的 `job` 中渲染出启动日志，方便定位启动失败的原因。

之前有尝试过去解决这个问题，当时使用的几种方法如下：

1. 最理想的办法。在启动日志打印完毕之后，停止 `java` 日志的输出，但是 `java` 和 `windows` 下并没有支持这个操作的命令， 搜遍了各种博客都没找到解决办法。
2. 通过定时任务，定期的将日志文件内容清空。但是 `windows` 下无法对被进程的占用的文件进行修改，而这个日志文件会一直被对应的 `java` 服务进程占用，直到对应的 `java` 服务进程关闭，所以这个办法也无法应用。
3. 直接移除日志打印这个功能。(***并没有使用，移除很简单，但是启动时将无法打印日志***)

### 目前的解决办法

这周又出现了服务器卡死的情况，猜测也是上面的问题引起的。于是又重新去寻找了一遍解决方案，然后就看到了这篇博客：[windows 下 cronolog 进行日志切割](https://blog.joden123.top/2020/06/03/Java/cronolog-win/)。可以利用 `cronolog` 命令实现日志的分割，这样就可以有效避免出现文件过大的情况。其中的关键是修改 `java` 的启动命令：

```batchfile
javaw -jar xxx.jar | d:\cronolog\cronolog.exe 日志输出路径\xxx-%%Y%%m%%d.log
```

上面的命令可以实现对日志按日进行分割，将其应用到 `jenkins` 命令中，如下:

`deploy.bat`

```batchfile
@echo off

::1.jar包、启动日志、启动脚本、占用端口、启动成功标志
set prefix=%1
set port=%2
set profile=%3
set Xmx=%4
set successFlag=%5
set jarFile=g:\rsdun-cloudfish\%prefix%.jar
set startBat=g:\rsdun-cloudfish\jenkins\startJar.bat
set startLog=%prefix%-%port%.log
set currentDate=%date:~0,4%-%date:~5,2%-%date:~8,2%
set logPath=g:\rsdun-cloudfish\startLogs\%currentDate%
set logFile=%logPath%\%startLog%

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
echo =========================================== 删除日志文件：%logFile% ===========================================
:delFile
if exist %logFile% (
  del %logFile%>nul 2>nul
  goto delFile
)

::cronolog不会自动创建文件夹，需要手动创建
if not exist %logPath% (
  md %logPath%
)

::4.重启项目
echo =========================================== 重启项目 ===========================================
start %startBat% %Xmx% %jarFile% %profile% %startLog%

::5.打印启动日志
echo =========================================== 开始打印启动日志 ===========================================
set line=0
:while
::检查日志文件是否存在
if not exist %logFile% (
  goto while
)
set content=
@for /f "tokens=1* delims=:" %%i in ('findstr/n .* %logFile%') do (
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

`startJar.bat`

```batchfile
@echo off
set Xmx=%1
set jarFile=%2
set options=%3
set startLog=%4
::由于bat中无法将=作为参数传入，因此传入@，这里替换为=
set "options=%options:@==%"
set BUILD_ID=dontKillMe
::使用cronolog来对日志进行分割
java %Xmx% -jar %jarFile% %options% | G:\rsdun-cloudfish\jenkins\cronolog.exe G:\rsdun-cloudfish\startLogs\%%Y-%%m-%%d\%startLog%
exit
```

### 进一步优化

在测试过程中发现一个意外惊喜：** `cronolog` 进行分割的文件夹必须存在，如果对应的文件夹不存在，那么 `cronolog` 会自动退出进程，但是 `java` 进程不会受影响，且日志将不再进行打印！**

根据上面的现象进行一个猜测：**`cronolog.exe` 进程的中断可以停止 `java` 日志的打印，但是不会影响 `java` 进程的运行。**

#### 验证猜测

上面的猜测需要通过测试来验证，以 `rsdun-articles` 项目作为测试，先查看服务器上这个服务的进程，对应的 `pid` 是 `573412`

![1687747251730165504890a20f0e2f25937b8d0662e26.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747251730165504890a20f0e2f25937b8d0662e26.png)

尝试将 `rsdun-articles` 的日志文件删除，提示文件被占用：

![1687747262730c78bb4c1659f326224edb241cb45b68f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747262730c78bb4c1659f326224edb241cb45b68f.png)

然后通过 `windows` 的 **资源监视器** 找到这个日志文件对应的 `cronolog.exe` 进程的 `pid`，如下：

![1687747269732bf50966b0052da8415b4b5ae8d4a4a3f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747269732bf50966b0052da8415b4b5ae8d4a4a3f.png)

然后通过下面的命令将这个进程终止：

```batchfile
takkill /f /pid 572480
```

![168774727573214d39ae559c03d55f6b57efa1962ac96.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/168774727573214d39ae559c03d55f6b57efa1962ac96.png)

到这里正常来说 `cronolog.exe` 的进程就被终止了，然后再看 `rsdun-articles` 对应的进程是否还存在：

![1687747283730a745650d58dcff4701072518040bcf29.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747283730a745650d58dcff4701072518040bcf29.png)

下面的是在终止 `cronolog.exe` 进程之后进行的查询，可以看到 `rsdun-articles` 没有中断。接着再尝试删除 `rsdun-articles` 的日志文件，移除成功！

#### 最终优化

到了具体实施环节，优化想法如下：**在 `jenkins` 的 `job` 判定项目启动成功后，终止对应的 `cronolog.exe` 进程。**

补充一点，每一个项目的日志文件都对应一个 `cronolog.exe` 进程，相互之间是独立的。而这里的难点是如何拿到日志文件对应的 `cronolog.exe` 的 `pid`，之前的测试是通过 `windows` 自带的工具来完成搜搜索的。搜索了相关博客，在 [bat 搜索进程名并kill](https://www.cnblogs.com/xzf-o-/p/11319587.html) 这篇文章中找到了解决办法，可以使用如下命令：

```batchfile
tasklist /fi "imagename eq cronolog.exe"
```

![1687747289730045ce8981043178ae2a579f6b1e5ade3.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1687747289730045ce8981043178ae2a579f6b1e5ade3.png)

也可以使用下面的命令直接拿到指定日志的对应的 `cronolog.exe` 的 `pid`，来源：[cmd命令行查找进程并杀进程](https://blog.51cto.com/lishuoboy/5438229)

```batchfile
wmic process where "Name='cronolog.exe' and CommandLine like '%rsdun-config-center%'" get processid
```

![16877472997319fdb8e15d14521bf9f319a41e3372b13.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16877472997319fdb8e15d14521bf9f319a41e3372b13.png)

经过不断的试验，决定使用第二种 `wmic` 的方式来终止 `cronolog.exe` 进程，对应的命令如下：

```batchfile
wmic process where "Name='cronolog.exe' and CommandLine like '%%%prefix%%%'" delete
```

最终优化版如下：`deploy.bat`

```batchfile
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
::检查日志文件是否存在
if not exist %startLog% (
  goto while
)
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
   goto end
)
goto while

:end
::关闭cronolog.exe进程，停止日志打印
echo =========================================== 终止日志打印进程！ ===========================================
wmic process where "Name='cronolog.exe' and CommandLine like '%%%prefix%%%'" delete
::这一步是用来关闭 `cmd.exe` 进程的, `cmd.exe`需要主动`kill`，否则会一直运行
wmic process where "Name='cmd.exe' and CommandLine like '%%%prefix%%%'" delete

exit
```

`startJar.bat`

```batchfile
@echo off
set Xmx=%1
set jarFile=%2
set options=%3
set startLog=%4
::由于bat中无法将=作为参数传入，因此传入@，这里替换为=
set "options=%options:@==%"
set BUILD_ID=dontKillMe
::使用cronolog来对日志进行分割
java %Xmx% -jar %jarFile% %options% | G:\rsdun-cloudfish\jenkins\cronolog.exe %startLog%
exit
```

> 最终版与之前的区别就在于 `deploy.bat` 中的最后两行命令，它们的作用如下：①. 在项目启动完成后主动杀死 `cronolog.exe` 进程，这样可以终止日志打印。②. 第二行代码是为了杀死 `cmd.exe`，如果不执行这一步，那么每次执行 `Job` 都会产生一个 `cmd.exe` 进程，到后面会出现巨量的 `cmd.exe` 进程，拖垮服务器。
> 
> 最终版命令没有使用 `cronolog` 的文件分割功能，而是将其与日志进程绑定，这样可以将日志进程与 `java` 进程解耦。之后项目启动成功，直接将 `cronolog` 进程关闭，日志也就停止打印了，而且这样不会对 `java` 进程造成影响。

### 参考文档

[bat命令行：获取系统年月日和时间](https://blog.51cto.com/heboyme/3078323)

[windows 下 cronolog 进行日志切割](https://blog.joden123.top/2020/06/03/Java/cronolog-win/)

[cmd命令行查找进程并杀进程](https://blog.51cto.com/lishuoboy/5438229)

[bat 搜索进程名并kill](https://www.cnblogs.com/xzf-o-/p/11319587.html)

[Windows WMIC命令使用详解2](https://www.cnblogs.com/scotth/p/9434416.html)
