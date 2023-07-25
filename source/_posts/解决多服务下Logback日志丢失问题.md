---
title: 解决多服务下Logback日志丢失问题
tags: Logback
categories: 后端技术
abbrlink: 11081
date: 2021-12-10 13:08:04
---
### 问题描述

在上一篇文章中：{% post_link 服务器上的过期Logback日志没有自动清理 %}，发现日志文件后缀错乱的问题与启动了多服务有关。在解决了这个问题后，对 **[日志备份] 和 [历史日志清理]** 又进行了几次测试，发现部分日志文件中存在 **日志丢失** 的问题。

这个问题应该只有 **多服务共享一个日志文件** 时会产生。在执行备份文件时，对文件重命名，它们使用的后缀是各自单独维护的。**比如现在有ABC三个服务，A的后缀可能累加到了34，B的只有15，C的只有20。如果文件备份恰好在服务B进行，并且 xxx.15.log 已经由A备份过，那么B备份的 xxx.15.log 将会覆盖掉A备份的，导致日志丢失。**

这个问题可以通过修改源码解决，在进行文件备份时，首先判断文件名是否已经存在，如果存在了就不重复执行了，交给别的服务来处理。

<!--more-->

### 处理办法

修改源码 `TimeBasedRollingPolicy.class` 的 `rollover()` 方法

![169026830622864e7b10031241b49589e154ca1f94ba6.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026830622864e7b10031241b49589e154ca1f94ba6.png)

修改后的源码如下

![169026832423185abf04b4daada177b741a608294e991.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026832423185abf04b4daada177b741a608294e991.png)

将 `logback.xml` 中 `maxFileSize` 的配置调整至 `5KB`，进行测试：

![1690268330229ca23ae6346c6a203e031785a938800f2.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268330229ca23ae6346c6a203e031785a938800f2.png)

日志文件生成正常

![1690268340228a7b08d961d9d920f4ed78fb24e08c8ff.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268340228a7b08d961d9d920f4ed78fb24e08c8ff.png)

依次查看历史日志的内容，寻找是否存在丢失的日志，就目前检查的情况而言，暂未发现日志丢失的情况。

但是也存在一个问题，部分日志中打印的时间错乱，个人认为不影响阅读，如下：

后缀为32的日志最后几条日志的时间如下

![1690268347233dfa1243d419215837f23c39a2e82f966.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268347233dfa1243d419215837f23c39a2e82f966.png)

后缀为33的日志前几条日志的时间如下：

![16902683532297b9556d5c7c35b233e1e4064d96ae16f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902683532297b9556d5c7c35b233e1e4064d96ae16f.png)

完整的 `TimeBasedRollingPolicy.java` 内容如下：

```java
/**
 * Logback: the reliable, generic, fast and flexible logging framework.
 * Copyright (C) 1999-2015, QOS.ch. All rights reserved.
 *
 * This program and the accompanying materials are dual-licensed under
 * either the terms of the Eclipse Public License v1.0 as published by
 * the Eclipse Foundation
 *
 *   or (per the licensee's choosing)
 *
 * under the terms of the GNU Lesser General Public License version 2.1
 * as published by the Free Software Foundation.
 */
package ch.qos.logback.core.rolling;

import ch.qos.logback.core.CoreConstants;
import ch.qos.logback.core.rolling.helper.*;
import ch.qos.logback.core.util.FileSize;

import java.io.File;
import java.util.Date;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static ch.qos.logback.core.CoreConstants.UNBOUNDED_TOTAL_SIZE_CAP;
import static ch.qos.logback.core.CoreConstants.UNBOUND_HISTORY;

/**
 * <code>TimeBasedRollingPolicy</code> is both easy to configure and quite
 * powerful. It allows the roll over to be made based on time. It is possible to
 * specify that the roll over occur once per day, per week or per month.
 *
 * <p>For more information, please refer to the online manual at
 * http://logback.qos.ch/manual/appenders.html#TimeBasedRollingPolicy
 *
 * @author Ceki G&uuml;lc&uuml;
 */
public class TimeBasedRollingPolicy<E> extends RollingPolicyBase implements TriggeringPolicy<E> {
    static final String FNP_NOT_SET = "The FileNamePattern option must be set before using TimeBasedRollingPolicy. ";
    // WCS: without compression suffix
    FileNamePattern fileNamePatternWithoutCompSuffix;

    private Compressor compressor;
    private RenameUtil renameUtil = new RenameUtil();
    Future<?> compressionFuture;
    Future<?> cleanUpFuture;

    private int maxHistory = UNBOUND_HISTORY;
    protected FileSize totalSizeCap = new FileSize(UNBOUNDED_TOTAL_SIZE_CAP);

    private ArchiveRemover archiveRemover;

    TimeBasedFileNamingAndTriggeringPolicy<E> timeBasedFileNamingAndTriggeringPolicy;

    boolean cleanHistoryOnStart = false;

    public void start() {
        // set the LR for our utility object
        renameUtil.setContext(this.context);

        // find out period from the filename pattern
        if (fileNamePatternStr != null) {
            fileNamePattern = new FileNamePattern(fileNamePatternStr, this.context);
            determineCompressionMode();
        } else {
            addWarn(FNP_NOT_SET);
            addWarn(CoreConstants.SEE_FNP_NOT_SET);
            throw new IllegalStateException(FNP_NOT_SET + CoreConstants.SEE_FNP_NOT_SET);
        }

        compressor = new Compressor(compressionMode);
        compressor.setContext(context);

        // wcs : without compression suffix
        fileNamePatternWithoutCompSuffix = new FileNamePattern(Compressor.computeFileNameStrWithoutCompSuffix(fileNamePatternStr, compressionMode), this.context);

        addInfo("Will use the pattern " + fileNamePatternWithoutCompSuffix + " for the active file");

        if (compressionMode == CompressionMode.ZIP) {
            String zipEntryFileNamePatternStr = transformFileNamePattern2ZipEntry(fileNamePatternStr);
            zipEntryFileNamePattern = new FileNamePattern(zipEntryFileNamePatternStr, context);
        }

        if (timeBasedFileNamingAndTriggeringPolicy == null) {
            timeBasedFileNamingAndTriggeringPolicy = new DefaultTimeBasedFileNamingAndTriggeringPolicy<E>();
        }
        timeBasedFileNamingAndTriggeringPolicy.setContext(context);
        timeBasedFileNamingAndTriggeringPolicy.setTimeBasedRollingPolicy(this);
        timeBasedFileNamingAndTriggeringPolicy.start();

        if (!timeBasedFileNamingAndTriggeringPolicy.isStarted()) {
            addWarn("Subcomponent did not start. TimeBasedRollingPolicy will not start.");
            return;
        }

        // the maxHistory property is given to TimeBasedRollingPolicy instead of to
        // the TimeBasedFileNamingAndTriggeringPolicy. This makes it more convenient
        // for the user at the cost of inconsistency here.
        if (maxHistory != UNBOUND_HISTORY) {
            archiveRemover = timeBasedFileNamingAndTriggeringPolicy.getArchiveRemover();
            archiveRemover.setMaxHistory(maxHistory);
            archiveRemover.setTotalSizeCap(totalSizeCap.getSize());
            if (cleanHistoryOnStart) {
                addInfo("Cleaning on start up");
                Date now = new Date(timeBasedFileNamingAndTriggeringPolicy.getCurrentTime());
                cleanUpFuture = archiveRemover.cleanAsynchronously(now);
            }
        } else if (!isUnboundedTotalSizeCap()) {
            addWarn("'maxHistory' is not set, ignoring 'totalSizeCap' option with value ["+totalSizeCap+"]");
        }

        super.start();
    }

    protected boolean isUnboundedTotalSizeCap() {
        return totalSizeCap.getSize() == UNBOUNDED_TOTAL_SIZE_CAP;
    }

    @Override
    public void stop() {
        if (!isStarted())
            return;
        waitForAsynchronousJobToStop(compressionFuture, "compression");
        waitForAsynchronousJobToStop(cleanUpFuture, "clean-up");
        super.stop();
    }

    private void waitForAsynchronousJobToStop(Future<?> aFuture, String jobDescription) {
        if (aFuture != null) {
            try {
                aFuture.get(CoreConstants.SECONDS_TO_WAIT_FOR_COMPRESSION_JOBS, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                addError("Timeout while waiting for " + jobDescription + " job to finish", e);
            } catch (Exception e) {
                addError("Unexpected exception while waiting for " + jobDescription + " job to finish", e);
            }
        }
    }

    private String transformFileNamePattern2ZipEntry(String fileNamePatternStr) {
        String slashified = FileFilterUtil.slashify(fileNamePatternStr);
        return FileFilterUtil.afterLastSlash(slashified);
    }

    public void setTimeBasedFileNamingAndTriggeringPolicy(TimeBasedFileNamingAndTriggeringPolicy<E> timeBasedTriggering) {
        this.timeBasedFileNamingAndTriggeringPolicy = timeBasedTriggering;
    }

    public TimeBasedFileNamingAndTriggeringPolicy<E> getTimeBasedFileNamingAndTriggeringPolicy() {
        return timeBasedFileNamingAndTriggeringPolicy;
    }

    public void rollover() throws RolloverFailure {

        // when rollover is called the elapsed period's file has
        // been already closed. This is a working assumption of this method.

        String elapsedPeriodsFileName = timeBasedFileNamingAndTriggeringPolicy.getElapsedPeriodsFileName();

        String elapsedPeriodStem = FileFilterUtil.afterLastSlash(elapsedPeriodsFileName);

        if (compressionMode == CompressionMode.NONE) {
            /*
             * ========================================================================================
             * 源码修改处：如果已存在目标文件则不用重命名
             * ========================================================================================
             */
            if (getParentsRawFileProperty() != null && !new File(elapsedPeriodsFileName).exists()) {
                renameUtil.rename(getParentsRawFileProperty(), elapsedPeriodsFileName);
            } // else { nothing to do if CompressionMode == NONE and parentsRawFileProperty == null }
        } else {
            if (getParentsRawFileProperty() == null) {
                compressionFuture = compressor.asyncCompress(elapsedPeriodsFileName, elapsedPeriodsFileName, elapsedPeriodStem);
            } else {
                compressionFuture = renameRawAndAsyncCompress(elapsedPeriodsFileName, elapsedPeriodStem);
            }
        }

        if (archiveRemover != null) {
            Date now = new Date(timeBasedFileNamingAndTriggeringPolicy.getCurrentTime());
            this.cleanUpFuture = archiveRemover.cleanAsynchronously(now);
        }
    }

    Future<?> renameRawAndAsyncCompress(String nameOfCompressedFile, String innerEntryName) throws RolloverFailure {
        String parentsRawFile = getParentsRawFileProperty();
        String tmpTarget = nameOfCompressedFile + System.nanoTime() + ".tmp";
        renameUtil.rename(parentsRawFile, tmpTarget);
        return compressor.asyncCompress(tmpTarget, nameOfCompressedFile, innerEntryName);
    }

    /**
     *
     * The active log file is determined by the value of the parent's filename
     * option. However, in case the file name is left blank, then, the active log
     * file equals the file name for the current period as computed by the
     * <b>FileNamePattern</b> option.
     *
     * <p>The RollingPolicy must know whether it is responsible for changing the
     * name of the active file or not. If the active file name is set by the user
     * via the configuration file, then the RollingPolicy must let it like it is.
     * If the user does not specify an active file name, then the RollingPolicy
     * generates one.
     *
     * <p> To be sure that the file name used by the parent class has been
     * generated by the RollingPolicy and not specified by the user, we keep track
     * of the last generated name object and compare its reference to the parent
     * file name. If they match, then the RollingPolicy knows it's responsible for
     * the change of the file name.
     *
     */
    public String getActiveFileName() {
        String parentsRawFileProperty = getParentsRawFileProperty();
        if (parentsRawFileProperty != null) {
            return parentsRawFileProperty;
        } else {
            return timeBasedFileNamingAndTriggeringPolicy.getCurrentPeriodsFileNameWithoutCompressionSuffix();
        }
    }

    public boolean isTriggeringEvent(File activeFile, final E event) {
        return timeBasedFileNamingAndTriggeringPolicy.isTriggeringEvent(activeFile, event);
    }

    /**
     * Get the number of archive files to keep.
     *
     * @return number of archive files to keep
     */
    public int getMaxHistory() {
        return maxHistory;
    }

    /**
     * Set the maximum number of archive files to keep.
     *
     * @param maxHistory
     *                number of archive files to keep
     */
    public void setMaxHistory(int maxHistory) {
        this.maxHistory = maxHistory;
    }

    public boolean isCleanHistoryOnStart() {
        return cleanHistoryOnStart;
    }

    /**
     * Should archive removal be attempted on application start up? Default is false.
     * @since 1.0.1
     * @param cleanHistoryOnStart
     */
    public void setCleanHistoryOnStart(boolean cleanHistoryOnStart) {
        this.cleanHistoryOnStart = cleanHistoryOnStart;
    }

    @Override
    public String toString() {
        return "c.q.l.core.rolling.TimeBasedRollingPolicy@"+this.hashCode();
    }

    public void setTotalSizeCap(FileSize totalSizeCap) {
        addInfo("setting totalSizeCap to "+totalSizeCap.toString());
        this.totalSizeCap = totalSizeCap;
    }
}

```

### 文件备份由重命名调整为复制清空导致的日志丢失问题

这个问题是在上面的问题解决后的一年后才发生的，日志文件又出现了丢失的问题：

![169026837623095967877665574a6150b87574c56ac19.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026837623095967877665574a6150b87574c56ac19.png)

将单个日志文件大小调整为 `20KB`

![1690268390229c21bd7c862b0fa90b4da46668c19676a.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268390229c21bd7c862b0fa90b4da46668c19676a.png)

在本地启动两个服务进行测试

![169026839723033fae895db5a104aaf64584d00a8c89a.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026839723033fae895db5a104aaf64584d00a8c89a.png)

服务1的日志备份完成后，磁盘中的日志文件如下，是正常的：

![169026840622910805fb53112f793a3f041858c457868.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026840622910805fb53112f793a3f041858c457868.png)

开始调试服务2的断点，发现文件重命名失败了，进入文件的复制清空逻辑，这里就是日志文件丢失问题产生的原因所在：

![1690268414255a88f465a3f6bd6eb3e475e8ecd40c92a.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268414255a88f465a3f6bd6eb3e475e8ecd40c92a.png)

`FileCopyUtils.copy(srcFile, targetFile)` 代码执行完后，磁盘中的日志文件如下：

![169026842423194df5d8622fff9c9cdb79b0c6c83d351.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026842423194df5d8622fff9c9cdb79b0c6c83d351.png)

问题的原因是，服务1和服务2同时检测到可以进行文件备份的操作，服务1先执行完了文件备份的操作，服务2之后又执行了一遍，导致历史日志被覆盖。

目前的处理办法是，在文件重命名失败准备执行文件的复制清空操作时，延迟 `1s` 执行（延迟 `1s` 是因为有时会出现服务1日志备份成功了，但是服务2调用 `file.exists()` 时返回了 `false`），并在执行前检查目标文件是否已经存在了，如果存在代表已经备份成功了。修改 `RenameUtil.java` 文件，如下：

![1690268430232fb6b7ea487a5a435329550a45f79450c.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268430232fb6b7ea487a5a435329550a45f79450c.png)

#### 补充

还有一种可能会导致上面的日志丢失问题，上一篇文章中提到过：**`Linux` 系统下允许对 【被占用的文件】进行重命名，这与 `Windows` 下不同**，具体见：[多项目写入同一 `Logback` 日志文件导致的滚动混乱问题（修改 `Logback` 源码）](https://blog.csdn.net/Abysscarry/article/details/102847754)

![1690268436232882c5f5e0979cb8f7c7b9c884e6b8287.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268436232882c5f5e0979cb8f7c7b9c884e6b8287.png)

在执行下面的代码时：

![169026844522912ef6aaf5629f96a162a406c48be620d.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026844522912ef6aaf5629f96a162a406c48be620d.png)

在 `Windows` 下测试，启动两个服务，服务1重命名成功，服务2会重命名失败。但是在 `Linux` 系统下，由于上面的特性，可能会出现两次都重命名成功的情况，这同样会导致日志丢失的问题。（***目前没有在 `Linux` 下验证这种情况***）