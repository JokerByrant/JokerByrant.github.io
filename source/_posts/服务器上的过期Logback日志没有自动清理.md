---
title: 服务器上的过期Logback日志没有自动清理
tags: Logback
categories: 后端技术
abbrlink: 40553
date: 2021-12-02 15:06:19
---
### 问题描述

目前项目中使用的日志是 `Logback` 插件，在配置文件中配了只保留最近 `30` 天的日志：

```xml
<maxHistory>30</maxHistory>
```

但是最近发现服务器上存在超过 `30` 天的日志文件，并且后缀很杂乱：

<!--more-->

![1690267951233f62b296b8c9f9073715fd5a34a535bbe.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690267951233f62b296b8c9f9073715fd5a34a535bbe.png)

从上面的截图也可以看出，配置的 `maxHistory` (日志文件的保存期限) 并未生效，当前时间是 `2021-11-24`，服务器上存在超过 `30` 天的日志文件。

### 历史日志清理流程分析

先来看一下 `Logback` 的历史日志清理操作是如何触发的。首先说下分析源码后的结论：**日志文件的备份操作和历史日志的清理是一同触发的**。下面看一下源码：

首先在项目启动时，会加载日志配置文件中的配置 --- `TimeBasedRollingPolicy$start()`

![169026796623256ee3702fd2c22065a1ac8e1196cca6c.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026796623256ee3702fd2c22065a1ac8e1196cca6c.png)

![169026797522883b528bcc8cab1b0897db14675b1e2d2.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026797522883b528bcc8cab1b0897db14675b1e2d2.png)

日志文件后缀的计算在 `SizeAndTimeBasedFNATP$start()` 中进行，日志文件后缀通过一个计数器 `currentPeriodsCounter` 保存，在后面进行日志文件备份会用到。

![1690267983232437075874926feb7091e315c2ed821d7.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690267983232437075874926feb7091e315c2ed821d7.png)

上面提到了在 `logback.xml` 中，我们配置的滚动策略是 `TimeBasedRollingPolicy`，而我们配置的写日志的组件是 `RollingFileAppender`：

```xml
<!-- RollingFileAppender：滚动记录文件，先将日志记录到指定文件，当符合某个条件时，将日志记录到其他文件 -->
<appender name="syslog" class="ch.qos.logback.core.rolling.RollingFileAppender">
```

当有日志写入时，会执行 `RollingFileAppender` 的 `subAppend()` 方法：

![16902679972322b504df3f1afc3ec367e0ee76d89b646.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902679972322b504df3f1afc3ec367e0ee76d89b646.png)

`isTriggerEvent` 方法执行的操作是 **判断是否需要执行 [备份日志] 和 [清理历史日志] 的操作**

![1690268006231e60779e526f424702caae32ae4924ae8.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268006231e60779e526f424702caae32ae4924ae8.png)

如果满足条件，那么执行 **[备份日志]** 和 **[清理历史日志]** 的操作：`roller()` 方法。这个方法比较重要，因为这是触发 **[备份日志]** 和 **[清理历史日志]** 的入口。

![16902680162291073f6106023616e43f4177c8255545b.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902680162291073f6106023616e43f4177c8255545b.png)

我们这里要分析的是历史文件清理的操作，因此直接看 `archiveRemover.cleanAsynchronously()` 方法。这里将代码分成两块进行分析：

```java
public Future<?> cleanAsynchronously(Date now) {
    ArhiveRemoverRunnable runnable = new ArhiveRemoverRunnable(now);
    ExecutorService executorService = context.getScheduledExecutorService();
    Future<?> future = executorService.submit(runnable);
    return future;
}

public class ArhiveRemoverRunnable implements Runnable {
    Date now;

    ArhiveRemoverRunnable(Date now) {
        this.now = now;
    }

    @Override
    public void run() {
        // #1
        clean(now);
        // #2
        if (totalSizeCap != UNBOUNDED_TOTAL_SIZE_CAP && totalSizeCap > 0) {
            capTotalSize(now);
        }
    }
}
```

### 历史日志未被清理的原因

先来看下 `#1` 端代码：`clean()` 方法。这个方法执行的操作是 **清理超出指定时间范围的日志文件**：

![1690268032229d9f331ba93c3c6afd90dfbab6e3c1529.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268032229d9f331ba93c3c6afd90dfbab6e3c1529.png)

注意其中的 `periodsElapsed` 参数，这个参数代表了一个时间范围差值，通过判断 **当前清理操作是否是 [服务重启后的第一次清理]** 操作，返回不同的值：

- 在 `Logback` 的源码中定义了一个 `periodsElapsed` 参数，默认值是 `32`。如果是服务重启后执行的第一次清理，清理的时间范围就是 `32` 天。

- 如果不是服务重启后执行的第一次清理，清理范围是 **上一次清理时间和当前清理时间的差值**。

进到源码里看一下，看下 `computeElapsedPeriodsSinceLastClean()` 方法：

![16902680402600aacc03e8ef8375837294c5bd2c43b4b.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902680402600aacc03e8ef8375837294c5bd2c43b4b.png)

拿到时间范围后，代码对其进行了遍历，在循环中有一个获取日期的操作，通过日期可以拿到待清理日志的文件名，来看下这个日期是如何计算的，进入 `getPeriodOffsetForDeletionTarget()` 方法：

```java
protected int getPeriodOffsetForDeletionTarget() {
    return -maxHistory - 1;
}
```

这个 `maxHistory` 就是我们在 `logback.xml` 配置的值，也就是说，这里拿到的日期，是 **[当前时间 - `periodsElapsed` - `maxHistory` - 1]**。这个循环中清理的文件范围是 **[当前时间 - `periodsElapsed` - `maxHistory` - 1] ~ [当前时间 - `maxHistory` - 1]** 之间的文件。

比如今天的日期是 `11-24`，配置的 `maxHistory` 是 `30`。假设当前不是服务重启后的第一次清理，那么拿到的时间范围 `periodsElapsed` 就是 `32` 天，那么清理的范围就是 [`63` 天前] ~ [`31` 天前] 的日志，时间范围是 `09-23` ~ `10-25`。

拿到时间后，就执行删除指定时间下日志文件的操作 - `cleanPeriod()` 方法：

![16902680532305f9ab8c8243f69c7c3ae573daad2137d.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902680532305f9ab8c8243f69c7c3ae573daad2137d.png)

注意上面的 [查找指定日期日志文件] 方法 --- `getFilesInPeriod()`：**匹配的日志文件后缀范围是 0 - 999，后缀超过 1000 的日志文件将不会被筛选出来！**

![1690268068235fd1dba1d98fed463410cce4c703246b0.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268068235fd1dba1d98fed463410cce4c703246b0.png)

分析到这里，我们可以得出一个结论，有两种类型的历史日志不会被清除：

1. 后缀超过 `1000` 的历史日志。
2. 时间早于 **[当前时间 - `maxHistory` - `32` - `1`]** 的日志文件。

回到测试服务器，找到异常的历史日志，下面这一批 `rsdun-app-api` 的日志后缀都超过了`1000`，因此未被清理。

![1690268077233be15756202daca64c7ae08a87c0dee20.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268077233be15756202daca64c7ae08a87c0dee20.png)

再来看一下另一个项目的日志，这个项目是配置中心。它的日志文件后缀没有超过 `1000`，但是仍然没有正常的被移除。

![1690268087231826b3c6323f08ba46a17e0b4ebe40a43.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268087231826b3c6323f08ba46a17e0b4ebe40a43.png)

配置中心的项目一般不会打印日志，除非它进行了重启。但是实际测试发现，**重启时虽然能打印日志，但是并不会触发 [日志备份] 和 [历史日志清理]** 的操作。这时就需要添加一个配置：`cleanHistoryOnStart`。在项目启动后立刻执行一次 **[清理历史日志]** 的操作，但是因为这个服务基本不打印日志，如果隔了很久才重启，还是会出现部分历史日志不会被清理的情况。

```xml
<!--启动项目后清理历史日志-->
<cleanHistoryOnStart>true</cleanHistoryOnStart>
```

### `totalSizeCap` 的配置

再来看下 `#2` 段代码：`capTotalSize()`。这段代码执行的是判断 `maxHistory` 范围内日志文件的总大小是否超出限制，如果超出了限制，就将较早的日志移除。这段代码中，**`maxHistory` 必须和 `totalSizeCap` 配合使用才会生效！**

![16902680952282c4e09c6bccd4758856e15c21399f0b9.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902680952282c4e09c6bccd4758856e15c21399f0b9.png)

也就是下面两个配置：

```xml
<!-- 30天内的所有日志文件大小不能超过1GB -->
<maxHistory>30</maxHistory>
<totalSizeCap>1GB</totalSizeCap>
```

这两个配置配合使用的意义是：**限制 `maxHistory` 天内的总日志文件的大小在 `totalSizeCap` 内**。

再看下具体的处理过程：

![169026810822915cfc06479f75deca53fabe0419c1705.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026810822915cfc06479f75deca53fabe0419c1705.png)

### 优化手段

1. 为配置添加 `cleanHistoryOnStart` 属性，这能解决 `rsdun-config-center` 历史日志未清除的问题。
![169026811422950e260ed75967445512e20a3a692e5ab.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026811422950e260ed75967445512e20a3a692e5ab.png)
2. 32天的清理时间范围是默认的(`final`属性)，无法修改
![1690268122230965cc027a36ae9ffe6a8c714230c1b9f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268122230965cc027a36ae9ffe6a8c714230c1b9f.png)
3. 配置 `totalSizeCap`
![169026812823073e4b1f0c987af7614eec5875f29303d.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026812823073e4b1f0c987af7614eec5875f29303d.png)

配置完毕后，重启项目，日志后缀超过 `1000` 的文件，以及时间早于 **[当前时间 - `maxHistory` - `32` - `1`]** 的日志文件，仍然无法被删除，原因上面分析过，因此只能手动清理。

### 补充

开头提到了日志文件后缀杂乱的问题，这个问题的分析放在下一篇文章中分析。
