---
title: 文件Hash算法MD5和SHA-256耗时对比
abbrlink: 57696
date: 2024-06-27 11:33:40
tags: 后端技术
categories: 后端技术
---
之前在 {% post_link 图片上传逻辑改造 %} 这篇文章中提到过两种文件 `Hash` 算法：`MD5` 和 `SHA-256`，这里就测试下通过这两种算法获取文件 `Hash` 值的速度对比。 

<!--more-->

测试代码如下：

```java
import org.apache.commons.codec.binary.Hex;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;

/**
 * @author sxh
 * @date 2024/6/27
 */
public class Test {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("E:\\cloudfish\\images\\app\\circle\\20221124140242114_o.jpg");
        list.add("E:\\cloudfish\\images\\app\\carInfo\\7f5e3c3b339b4f588eef0f89f51be0b6.jpg");
        list.add("E:\\cloudfish\\images\\app\\circle\\20230202094555256_o.mp4");
        list.add("C:\\Users\\DELL\\Pictures\\1.mp4");
        list.add("C:\\Users\\DELL\\Pictures\\10min.mp4");
        list.add("E:\\软件\\mysql-5.7.20-winx64.zip");
        list.add("E:\\软件\\ideaIU-2024.1.3.exe");
        list.add("E:\\软件\\android-studio-2023.3.1.18-windows.exe");
        list.add("F:\\系统镜像\\macos\\macOS Catalina 10.15.5(19F96).cdr");

        for (String path : list) {
            System.out.println("文件路径：" + path);
            System.out.println("文件大小：" + (new File(path).length() / 1024 / 1024f) + "MB");
            fileHashTest(path, "MD5");
            fileHashTest(path, "SHA-256");
            System.out.println("=============================================");
        }
    }

    private static void fileHashTest(String filePath, String algorithm) {
        long t1 = System.currentTimeMillis();
        String hash = getFileHash_Test(filePath, algorithm);
        long t2 = System.currentTimeMillis();
        System.out.printf("Hash算法：%s，Hash结果：%s，耗时：%dms \n", algorithm, hash, (t2 - t1));
    }

    private static String getFileHash_Test(String filePath, String algorithm) {
        try {
            MessageDigest digest = MessageDigest.getInstance(algorithm);
            BufferedInputStream bis = new BufferedInputStream(Files.newInputStream(Paths.get(filePath)));
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = bis.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            return Hex.encodeHexString(digest.digest());
        } catch (NoSuchAlgorithmException | IOException e) {
            throw new RuntimeException(e);
        }
    }
}
```

测试结果如下：

```text
文件路径：E:\cloudfish\images\app\circle\20221124140242114_o.jpg
文件大小：0.81640625MB
Hash算法：MD5，Hash结果：3c6a531d3d0fcf13bb2199fdda1c9e05，耗时：37ms 
Hash算法：SHA-256，Hash结果：933fc9a14858efd74fc32ca881350429b4be4aae16229b768aa2a2395063596e，耗时：20ms 
=============================================
文件路径：E:\cloudfish\images\app\carInfo\7f5e3c3b339b4f588eef0f89f51be0b6.jpg
文件大小：3.2480469MB
Hash算法：MD5，Hash结果：0eb7d48241d37299708f7dd1771b7c2e，耗时：14ms 
Hash算法：SHA-256，Hash结果：8d1e5d610c600f8a78c3c07fb3001a0a92d5e7fe487455beded6bbaee85fead4，耗时：24ms 
=============================================
文件路径：E:\cloudfish\images\app\circle\20230202094555256_o.mp4
文件大小：11.847656MB
Hash算法：MD5，Hash结果：03abd2805ab9b47c58d0d73b85c03479，耗时：45ms 
Hash算法：SHA-256，Hash结果：15a59805ffe1d50186af78bc1a2176ad76a03f1d36c0e0caa3e35493cb0239e6，耗时：118ms 
=============================================
文件路径：C:\Users\DELL\Pictures\1.mp4
文件大小：37.359375MB
Hash算法：MD5，Hash结果：ec12f3ab59efe54534e8bd8bca0d0624，耗时：130ms 
Hash算法：SHA-256，Hash结果：cc057ba07fafddd1ba3ef4758fed114c4b4b3b4cc74263eaf6da7c8938c65a0a，耗时：204ms 
=============================================
文件路径：C:\Users\DELL\Pictures\10min.mp4
文件大小：65.74219MB
Hash算法：MD5，Hash结果：ed65af32bb60c42bc4e6ab18b9fedc69，耗时：176ms 
Hash算法：SHA-256，Hash结果：843bf4c1f4140dc7e53b01e02b2ae9e796bf4cb100366120a43603e7f9834ffa，耗时：487ms 
=============================================
文件路径：E:\软件\mysql-5.7.20-winx64.zip
文件大小：318.55957MB
Hash算法：MD5，Hash结果：92560f0be480eff66101c10c3c0c5434，耗时：1095ms 
Hash算法：SHA-256，Hash结果：2f7fbebac1d679a5e154b7dcb2a91970c9450ba52fe39df90df1e7dbfdcc339c，耗时：1822ms 
=============================================
文件路径：E:\软件\ideaIU-2024.1.3.exe
文件大小：954.67285MB
Hash算法：MD5，Hash结果：78a32e98838edac5474f8db0e8bbf8c7，耗时：2418ms 
Hash算法：SHA-256，Hash结果：e54a4a7e43f69dcb4fba61e2da5959f6f766ba1b8ac7b7d20d37b0f33586cbf0，耗时：5007ms 
=============================================
文件路径：E:\软件\android-studio-2023.3.1.18-windows.exe
文件大小：1139.752MB
Hash算法：MD5，Hash结果：8a5ecf163c593e85f278d8d0493172ef，耗时：2886ms 
Hash算法：SHA-256，Hash结果：2e64d6f97003aece59960f9823667c918ebefc4c65902377972e3f7a415d5076，耗时：5965ms 
=============================================
文件路径：F:\系统镜像\macos\macOS Catalina 10.15.5(19F96).cdr
文件大小：8500.0MB
Hash算法：MD5，Hash结果：9c4e7034e3c243f7bf20f4581b521306，耗时：57935ms 
Hash算法：SHA-256，Hash结果：fcfacc794c4954721aebd85659e27c136acc7721fbabe5a30425d630ae568589，耗时：71533ms 
=============================================
```
