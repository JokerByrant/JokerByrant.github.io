---
title: 解决多服务下Logback日志文件后缀顺序错乱问题
tags: Logback
categories: 后端技术
abbrlink: 10171
date: 2021-12-16 10:07:15
---
### 问题描述

上一篇文章分析了 `Logback` 对过期日志清理的流程：：{% post_link 解决多服务下Logback日志丢失问题 %}，找出了过期日志没有被清理的原因。其中提到了关于日志后缀顺序杂乱的问题，如下：

![1690268520229f62b296b8c9f9073715fd5a34a535bbe.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268520229f62b296b8c9f9073715fd5a34a535bbe.png)

这里就仍按上一篇文章的思路来分析，先结合源码梳理一下日志文件后缀生成的流程。

<!--more-->
### 问题定位

日志文件后缀生成的逻辑要与 [日志备份] 的逻辑结合起来看才行，这部分的代码与前一篇分析 [清除历史日志] 的代码稍有重合，这里仍然从最开始来分析。

首先在项目启动时，会加载日志配置文件中的配置 --- `TimeBasedRollingPolicy$start()`

![169026852822856ee3702fd2c22065a1ac8e1196cca6c.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026852822856ee3702fd2c22065a1ac8e1196cca6c.png)

![169026853522883b528bcc8cab1b0897db14675b1e2d2.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026853522883b528bcc8cab1b0897db14675b1e2d2.png)

日志文件后缀的计算在 `SizeAndTimeBasedFNATP$start()` 中进行，日志文件后缀通过一个计数器 `currentPeriodsCounter` 保存，在后面进行日志文件备份会用到。

![1690268541232437075874926feb7091e315c2ed821d7.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268541232437075874926feb7091e315c2ed821d7.png)

上面提到了在 `logback.xml` 中，我们配置的滚动策略是 `TimeBasedRollingPolicy`，而我们配置的写日志的组件是 `RollingFileAppender`：

```xml
<!-- RollingFileAppender：滚动记录文件，先将日志记录到指定文件，当符合某个条件时，将日志记录到其他文件 -->
<appender name="syslog" class="ch.qos.logback.core.rolling.RollingFileAppender">
```

当有日志写入时，会执行 `RollingFileAppender` 的 `subAppend()` 方法：

![16902685502312b504df3f1afc3ec367e0ee76d89b646.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902685502312b504df3f1afc3ec367e0ee76d89b646.png)

`isTriggerEvent` 方法执行的操作是 **判断是否需要执行 [备份日志] 和 [清理历史日志] 的操作**

![1690268560228e60779e526f424702caae32ae4924ae8.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268560228e60779e526f424702caae32ae4924ae8.png)

如果满足条件，那么执行 **[备份日志]** 和 **[清理历史日志]** 的操作：`roller()` 方法。这个方法比较重要，因为这是触发 **[备份日志]** 和 **[清理历史日志]** 的入口。

![16902685702281073f6106023616e43f4177c8255545b.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902685702281073f6106023616e43f4177c8255545b.png)

这里我们开始看 `renameUtil.rename()` 方法，这个方法执行的是 **[日志备份]** 的操作，备份的方法是：**根据上面获取到的日志文件后缀，对原文件重命名，之后新的日志输出到新的文件中去。**

![1690268580229b124bad154297d6e9a1a1fe0af9a5e4f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268580229b124bad154297d6e9a1a1fe0af9a5e4f.png)

上面红框标注的地方就是日志文件后缀错乱的原因：**当有日志写入文件时，会执行检查日志文件大小的判断。当日志文件大小达到设定值后，文件后缀计数+1，并执行备份操作。出于某种原因(可能与启动多个服务有关)，备份失败了。然后后续每次有日志写入时，都会重复的执行上面的步骤，后缀计数不断累加，最终在某次写入成功，但是此时后缀已经累加了n次。**

在我们的业务中，接口服务 `rsdun-app-api` 在测试环境运行了3个服务，但它们共享一个日志文件前缀，因此它们的日志都会输出到同一文件中。`Windows` 环境下，文件流被打开后，就无法进行修改操作，会提示被占用，如下：

![1690268588252ef4bce5fe66cb646380a912216341d11.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268588252ef4bce5fe66cb646380a912216341d11.png)

上面开启了3个服务，如果其中一个服务发现日志文件大小超出限制了，开始执行文件备份操作，对这个日志进行重命名操作。但是这个文件仍然被另外两个服务占用着，因此就会出现重命名失败的情况，进而导致上面说的后缀不断累加。最终备份成功时，文件后缀就会发生错乱的请情况。

![1690268610229181bfaf8a84dbf7ffd35f4a572fa43e1.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268610229181bfaf8a84dbf7ffd35f4a572fa43e1.png)

### 解决思路

目前有两种思路：

1. 简单的办法，修改日志配置，按照端口号，为每个服务创建不同的日志文件：[参考文章](https://blog.csdn.net/qq_35549286/article/details/115915665)。配置如下：
![16902686372292ed3b4c0bbe8f23757ec0632bda32045.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902686372292ed3b4c0bbe8f23757ec0632bda32045.png)
但是测试发现这种方法不可取，会导致日志被分割成多个，可读性会变得很差。
![1690268617228908653ae07e15abcd6443523dcf53f0d.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268617228908653ae07e15abcd6443523dcf53f0d.png)
2. 想办法解决其他进程占用日志文件导致日志文件命名失败的问题。

### 文件重命名失败问题解决

上面提到出现这个问题的情况是运行了多个服务，在本地进行了测试，如果运行的是单服务，文件的重命名操作就没有问题，后缀也是正常的。

查阅了 `renameTo()` 相关的文档，**在每次调用该方法前都要保证文件流是关闭的**。在日志相关的源码中，也有对应的操作：**每次调用 `rollover()` 方法，都会开启一个同步锁，然后关闭文件流，因此单服务重命名文件不会失败。**但是如果是多服务，该同步锁就失去作用了，因为同步锁只能作用于当前服务，别的服务可以正常通行。

![1690268644228139fdfc332a0bf5e06542a399e36f17f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268644228139fdfc332a0bf5e06542a399e36f17f.png)

注解中也提到，`windows` 平台下无法重命名打开的文件！在 [多项目写入同一 `Logback` 日志文件导致的滚动混乱问题（修改 `Logback` 源码）](https://blog.csdn.net/Abysscarry/article/details/102847754) 文章中，进行了相应的测试

![1690268666229882c5f5e0979cb8f7c7b9c884e6b8287.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268666229882c5f5e0979cb8f7c7b9c884e6b8287.png)

按照上面的说法，在 `linux` 平台下并不存在这个问题，这个需要后面进行测试。在 `windows` 平台上还是会有类似的问题，目前想到的办法是修改源码，利用**分布式锁**解决。下面进行尝试：

#### 增加分布式锁(失败)

按照上面文档给出的修改源码方式，在已有项目中创建对应包，将要修改的文件从源码中复制过来，对应的文件是 `RollingFileAppender.java`：

![1690268680235c539f1fb5e6890e428a38fd92578dde6.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268680235c539f1fb5e6890e428a38fd92578dde6.png)

然后直接修改源码中的 `rollover()` 方法，将原先的同步锁修改为分布式锁：

![16902686852299b54b3664e9e1ca9652a8ac0f22476f5.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16902686852299b54b3664e9e1ca9652a8ac0f22476f5.png)

之后进行测试，发现添加分布式锁并没有用。分析了一下，要保证文件能够重命名成功，关键是要将所有服务中的文件流都关闭，而添加分布式锁并不能做到这一点。

#### 文件重命名操作修改为先复制再清空

换个思路，最终要实现的功能是将文件备份，那么可以先将文件进行复制，然后再将其删除。测试发现，删除操作也无法进行，但是清空文件的操作可以进行。

因此，修改源码 `RenameUtil.class` 中的 `rename()` 方法，建立文件

![1690268692229b50667edb6dd3395bd7f2f02ca28012d.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1690268692229b50667edb6dd3395bd7f2f02ca28012d.png)

对重命名操作进行补充，如下：

![169026870023271dd16e9dff3e0ea2f7f6600439745c2.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026870023271dd16e9dff3e0ea2f7f6600439745c2.png)

修改后再进行测试，文件备份成功，并且后缀没有错乱！

![169026870823027317affebc977df28bb0aafb98b982e.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169026870823027317affebc977df28bb0aafb98b982e.png)

完整的 `RenameUtil.java` 文件如下：

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
package ch.qos.logback.core.rolling.helper;

import ch.qos.logback.core.CoreConstants;
import ch.qos.logback.core.rolling.RollingFileAppender;
import ch.qos.logback.core.rolling.RolloverFailure;
import ch.qos.logback.core.spi.ContextAwareBase;
import ch.qos.logback.core.util.EnvUtil;
import ch.qos.logback.core.util.FileUtil;
import org.springframework.util.FileCopyUtils;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * Utility class to help solving problems encountered while renaming files.
 *
 * @author Ceki Gulcu
 */
public class RenameUtil extends ContextAwareBase {

    static String RENAMING_ERROR_URL = CoreConstants.CODES_URL + "#renamingError";

    /**
     * A relatively robust file renaming method which in case of failure due to
     * src and target being on different volumes, falls back onto
     * renaming by copying.
     *
     * @param src
     * @param target
     * @throws RolloverFailure
     */
    public void rename(String src, String target) throws RolloverFailure {
        if (src.equals(target)) {
            addWarn("Source and target files are the same [" + src + "]. Skipping.");
            return;
        }
        File srcFile = new File(src);

        if (srcFile.exists()) {
            File targetFile = new File(target);
            createMissingTargetDirsIfNecessary(targetFile);

            addInfo("Renaming file [" + srcFile + "] to [" + targetFile + "]");

            // 首先，尝试直接重命名
            boolean result = srcFile.renameTo(targetFile);

            if (!result) {
                // 如果重命名失败，对文件执行复制清空操作
                try {
                    FileCopyUtils.copy(srcFile, targetFile);
                    FileWriter fileWriter = new FileWriter(srcFile);
                    fileWriter.write("");
                    fileWriter.flush();
                    fileWriter.close();
                } catch (IOException e) {
                    // 如果复制清空操作也执行失败，执行其原本的重试机制
                    addWarn("Failed to rename file [" + srcFile + "] as [" + targetFile + "].");
                    Boolean areOnDifferentVolumes = areOnDifferentVolumes(srcFile, targetFile);
                    if (Boolean.TRUE.equals(areOnDifferentVolumes)) {
                        addWarn("Detected different file systems for source [" + src + "] and target [" + target + "]. Attempting rename by copying.");
                        renameByCopying(src, target);
                        return;
                    } else {
                        addWarn("Please consider leaving the [file] option of " + RollingFileAppender.class.getSimpleName() + " empty.");
                        addWarn("See also " + RENAMING_ERROR_URL);
                    }
                }
            }
        } else {
            throw new RolloverFailure("File [" + src + "] does not exist.");
        }
    }



    /**
     * Attempts to determine whether both files are on different volumes. Returns true if we could determine that
     * the files are on different volumes. Returns false otherwise or if an error occurred while doing the check.
     *
     * @param srcFile
     * @param targetFile
     * @return true if on different volumes, false otherwise or if an error occurred
     */
    Boolean areOnDifferentVolumes(File srcFile, File targetFile) throws RolloverFailure {
        if (!EnvUtil.isJDK7OrHigher())
            return false;

        // target file is not certain to exist but its parent has to exist given the call hierarchy of this method
        File parentOfTarget = targetFile.getAbsoluteFile().getParentFile();

        if(parentOfTarget == null) {
            addWarn("Parent of target file ["+targetFile+"] is null");
            return null;
        }
        if(!parentOfTarget.exists()) {
            addWarn("Parent of target file ["+targetFile+"] does not exist");
            return null;
        }

        try {
            boolean onSameFileStore = FileStoreUtil.areOnSameFileStore(srcFile, parentOfTarget);
            return !onSameFileStore;
        } catch (RolloverFailure rf) {
            addWarn("Error while checking file store equality", rf);
            return null;
        }
    }

    public void renameByCopying(String src, String target) throws RolloverFailure {

        FileUtil fileUtil = new FileUtil(getContext());
        fileUtil.copy(src, target);

        File srcFile = new File(src);
        if (!srcFile.delete()) {
            addWarn("Could not delete " + src);
        }

    }

    void createMissingTargetDirsIfNecessary(File toFile) throws RolloverFailure {
        boolean result = FileUtil.createMissingParentDirectories(toFile);
        if (!result) {
            throw new RolloverFailure("Failed to create parent directories for [" + toFile.getAbsolutePath() + "]");
        }
    }

    @Override
    public String toString() {
        return "c.q.l.co.rolling.helper.RenameUtil";
    }
}
```
