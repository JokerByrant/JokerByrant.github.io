---
title: bat拼接字符变量，将文件内容赋值给变量保留换行
tags: bat
categories: 后端技术
abbrlink: 7974
date: 2021-07-27 18:41:48
---

## 前言
前段时间在服务器搭建了 `Jenkins`, 过程见 {% post_link 在Windows服务器上搭建Jenkins %}。这个过程顺便也学习了 `windwos` 的批处理脚本的编写，但是仍然只是学了点皮毛。今天在群里碰到一个朋友询问关于 `bat` 脚本的问题，是 `for` 循环中字符拼接的问题。正好之前在解决 `windows` 服务器上实时打印 `SpringBoot` 项目启动日志时，也碰到类似的问题，就直接按照我的解决办法回答了他。但他的场景与我有所不同，我了解的也只是皮毛，但是想着帮人帮到底，正好借此也能学习深入一点。这个主要涉及的是 `bat`脚本中变量延迟加载的知识点。

<!-- more -->

## 问题解决
碰到的问题如下：
![ed743ade48ff5b1cd3a4ada04ec6d93.png](https://img02.sogoucdn.com/app/a/100520146/19a9403aa1440db062b6d36e59bc931b)

最终的打印结果只有文件的最后一行内容，一开始我想到应该是字符没有进行拼接，便尝试了如下的代码：
```bat
@echo off
set param=
for /f %%i in (d:\1.txt) do (
    set param=%param%%%i
)
echo %param%
```

但是输出的内容与先无二，查询博客，发现了一个概念：**延迟变量**。使用了延迟变量后，代码如下：
```bat
@echo off
@setlocal enabledelayedexpansion
set param=
for /f %%i in (d:\1.txt) do (
    set param=!param!%%i
)
echo !param!
```
输出内容正是我想要的。注意其中的 `!param!`, 之前写脚本时也用到过这个，注意这个与 `%param%` 作用有些差异。在开启变量延迟后，使用`!param!`，`param`后期被修改的值才能在`for`循环中被读取到。如果没开启，那么只能等到`for`循环结束，才能拿到`param`的值。不光是在`for`循环中，在各种复合语句皆是如此，比如`if`。如果还是没明白，可以看下这篇文章的解释：[ 批处理延迟变量(通俗解释)](http://bbs.bathome.net/thread-354-1-1.html)。

上面的代码还需要改进一下，因为没有输出换行符，最终版本如下：
```bat
@echo off
@setlocal enabledelayedexpansion
::换行符，下面空出两行
set wrap=^


set param=
for /f %%i in (d:\1.txt) do (
    set param=!param!%%i!wrap!
)
echo !param!
```
注意上面的换行符定义，下面必须空出两行，具体原因我也不清楚，参考的这篇文章：[扩展ASCII码字符集0x00~0xff 批处理获取函数](http://bbs.bathome.net/thread-12347-1-1.html)

## 附：实时打印日志内容，并在指定位置退出
顺便贴一下上次实时打印日志的脚本
```bat
@echo off
set line=0
set content=0
:while
@for /f "tokens=1* delims=:" %%i in ('findstr/n .* 1.log') do (
    @if %%i GTR %line% (
        set line=%%i
        set content=%%j
        echo %%j
    )
)
set exists_flag=false
echo %content%|find "JVMrunningfor">nul&&set exists_flag=true
if "%exists_flag%"=="true" (
     exit
)
goto while
```

## 后记
通过这次问题回答，发现帮人解决问题好处颇多。如果正好是自己不太熟悉的方面，也可以促使自己去学习。如果自己已经觉得掌握了，也可以帮自己巩固。

顺便记录一下这次发现的批处理脚本的论坛：[批处理之家](http://bbs.bathome.net/index.php)

## 参考文章
[bat字符串拼接](https://blog.csdn.net/brucezong/article/details/91386522)
[批处理命令echo怎样输出换行符到文本？](http://www.bathome.net/thread-17366-1-1.html)
[扩展ASCII码字符集0x00~0xff 批处理获取函数](http://bbs.bathome.net/thread-12347-1-1.html)
[批处理延迟变量(通俗解释)](http://bbs.bathome.net/thread-354-1-1.html)
[BAT 延迟变量](https://www.cnblogs.com/habibah-chang/p/3532125.html)