---
title: Java处理webp格式的图片
abbrlink: 49148
date: 2022-03-04 13:42:27
tags: 
  - Java
  - webp
categories: 后端技术
---
## 前言

最近在对 `App` 进行功能测试，测试到上传图片的功能，发现接口报错了。查看了提交的参数，原来是测试时上传了 `webp` 格式的图片导致的报错。

<!--more-->

出错的代码如下：

```java
// 对图片进行压缩，生成缩略图
BufferedImage bi = ImageIO.read(file);
if (bi.getWidth() > 200 || bi.getHeight() > 225) {
	// ...
}
```

这里获取拿到的 `bi` 为空，调查之后发现是 `ImageIO` 不支持读取 `webp` 格式的图片。

## Webp格式介绍

WebP 是 Google 的一种可以同时提供有损压缩（像 JPEG 一样）和透明度（像 PNG 一样）的图片文件格式，不过与 JPEG 或 PNG 相比，这种格式可以提供更好的压缩。Android 4.0（API 级别 14）及更高版本支持有损 WebP 图片，Android 4.3（API 级别 18）及更高版本支持无损且透明的 WebP 图片。

WebP 的优势体现在它具有更优的图像数据压缩算法，能带来更小的图片体积，而且拥有肉眼识别无差异的图像质量；同时具备了无损和有损的压缩模式、Alpha 透明以及动画的特性，在 JPEG 和 PNG 上的转化效果都非常优秀、稳定和统一。

### 快速查看webp格式

有些图片即使文件名是 `jpg`、`png` ，但实际上是 `webp` 格式，可以通过下面这中方式查看图片的真实格式：直接用记事本打开图片，查看第一行的内容，如果有 `WEBP` 之类的文字，那图片就是 `webp` 格式。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16544942093861db260b85228bd527659063f3e0f7fe5.png)

## 解决办法

目前项目中因为提交 `webp` 格式的图片导致报错的功能有两处：**获取图片的分辨率、对图片进行压缩。**

### 获取图片分辨率

查阅博客，在 [更高效率，Java快速获取图片尺寸宽高分辨率（支持webp）](https://www.cnblogs.com/xiaona/p/13869504.html) 中找到了获取 `webp` 格式图片分辨率的办法。

原先获取分辨率是通过 `ImageIO.read` 获取包含图片大小、尺寸宽高数据的 `BufferedImage` 对象，但这种方法不支持处理 `webp` 格式的图片。并且它需要把图片完全加载到内存中，对于某些只想要图片宽高信息的场景来说，这样会更占内存，效率较低。

目前使用的方法，是根据图片字节数组获取图片的宽高，这样性能更好一点:

```java
/**
 * 获取图片的分辨率(通过图片字节数组获取)
 * 支持 jpg、gif、png、bmp、webp、tiff 格式
 *
 * @author sxh
 * @date 2022/3/2
 * @link {https://www.cnblogs.com/xiaona/p/13869504.html}
 */
public class ImageResolutionUtil {
    private int height;
    private int width;
    private String mimeType;

    public ImageResolutionUtil(File file) throws IOException {
        try (InputStream is = new FileInputStream(file)) {
            processStream(is);
        }
    }

    public ImageResolutionUtil(InputStream is) throws IOException {
        processStream(is);
    }

    public ImageResolutionUtil(byte[] bytes) throws IOException {
        try (InputStream is = new ByteArrayInputStream(bytes)) {
            processStream(is);
        }
    }

    private void processStream(InputStream is) throws IOException {
        int c1 = is.read();
        int c2 = is.read();
        int c3 = is.read();

        mimeType = null;
        width = height = -1;

        if (c1 == 'G' && c2 == 'I' && c3 == 'F') { // GIF
            is.skip(3);
            width = readInt(is, 2, false);
            height = readInt(is, 2, false);
            mimeType = "image/gif";
        } else if (c1 == 0xFF && c2 == 0xD8) { // JPG
            while (c3 == 255) {
                int marker = is.read();
                int len = readInt(is, 2, true);
                if (marker == 192 || marker == 193 || marker == 194) {
                    is.skip(1);
                    height = readInt(is, 2, true);
                    width = readInt(is, 2, true);
                    mimeType = "image/jpeg";
                    break;
                }
                is.skip(len - 2);
                c3 = is.read();
            }
        } else if (c1 == 137 && c2 == 80 && c3 == 78) { // PNG
            is.skip(15);
            width = readInt(is, 2, true);
            is.skip(2);
            height = readInt(is, 2, true);
            mimeType = "image/png";
        } else if (c1 == 66 && c2 == 77) { // BMP
            is.skip(15);
            width = readInt(is, 2, false);
            is.skip(2);
            height = readInt(is, 2, false);
            mimeType = "image/bmp";
        } else if (c1 == 'R' && c2 == 'I' && c3 == 'F') { // WEBP
            byte[] bytes = new byte[27];
            is.read(bytes);
            width = ((int) bytes[24] & 0xff) << 8 | ((int) bytes[23] & 0xff);
            height = ((int) bytes[26] & 0xff) << 8 | ((int) bytes[25] & 0xff);
            mimeType = "image/webp";
        } else {
            int c4 = is.read();
            if ((c1 == 'M' && c2 == 'M' && c3 == 0 && c4 == 42) || (c1 == 'I' && c2 == 'I' && c3 == 42 && c4 == 0)) { //TIFF
                boolean bigEndian = c1 == 'M';
                int ifd = 0;
                int entries;
                ifd = readInt(is, 4, bigEndian);
                is.skip(ifd - 8);
                entries = readInt(is, 2, bigEndian);
                for (int i = 1; i <= entries; i++) {
                    int tag = readInt(is, 2, bigEndian);
                    int fieldType = readInt(is, 2, bigEndian);
                    int valOffset;
                    if ((fieldType == 3 || fieldType == 8)) {
                        valOffset = readInt(is, 2, bigEndian);
                        is.skip(2);
                    } else {
                        valOffset = readInt(is, 4, bigEndian);
                    }
                    if (tag == 256) {
                        width = valOffset;
                    } else if (tag == 257) {
                        height = valOffset;
                    }
                    if (width != -1 && height != -1) {
                        mimeType = "image/tiff";
                        break;
                    }
                }
            }
        }
        if (mimeType == null) {
            throw new IOException("Unsupported image type");
        }
    }

    private int readInt(InputStream is, int noOfBytes, boolean bigEndian) throws IOException {
        int ret = 0;
        int sv = bigEndian ? ((noOfBytes - 1) * 8) : 0;
        int cnt = bigEndian ? -8 : 8;
        for (int i = 0; i < noOfBytes; i++) {
            ret |= is.read() << sv;
            sv += cnt;
        }
        return ret;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    @Override
    public String toString() {
        return "MIME Type : " + mimeType + "\t Width : " + width + "\t Height : " + height;
    }
}
```

### 压缩图片

项目中图片压缩处理使用的是 `thumbnailator` 插件处理的，同样不支持处理 `webp` 格式的图片。

查阅了 `thumbnailator` 的文档，没有找到开启支持 `webp` 格式图片的配置。在 [关于图片压缩的一些调查](https://segmentfault.com/a/1190000039992267) 这篇文章中提到了另外两款压缩图片的插件：[ImageMagick](http://www.graphicsmagick.org/)、[GraphicsMagick](https://imagemagick.org/script/index.php)。这两款都是支持处理 `webp` 格式的，但考虑到更换插件可能会带来别的新问题，因此暂时没有使用这种方法处理。

现在的目标就是找到到方法，使 `thumbnailator` 支持处理 `webp` 格式的图片。在 [使用Java优雅地处理图片——图片转码和缩略图生成](https://www.mintimate.cn/2021/01/19/JavaDealWithImage/) 中找到了解决办法：引入 `webp-imageio-core` 插件。

`webp-imageio-core` 没有在 `Maven` 中央仓库发布，因此需要手动添加 `lib` 依赖。首先下载 `webp-imageio-core` 的 `jar` 包：[下载地址](https://github.com/nintha/webp-imageio-core/releases)。之后在 `pom` 中添加依赖：

```xml
<dependency>  
    <groupId>com.github.nintha</groupId>  
    <artifactId>webp-imageio-core</artifactId>  
    <version>{version}</version>  
    <scope>system</scope>  
    <systemPath>${pom.basedir}/libs/webp-imageio-core-{version}.jar</systemPath>  
</dependency>
```

如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16544941783864770862a3c473e59dc62beb534318dda.png)

添加成功之后，`imageIO` 方法就支持 `webp` 格式的图片了。同样的， `thumbnailator` 也支持处理 `webp` 格式的图片了，原先压缩图片的代码无需修改：

```java
/**
     * 图片压缩
     * 注：压缩png文件时，压缩后的图片大小与压缩尺寸有关。
     *
     * @param originPath  原图片路径
     * @param targetPath  压缩后图片路径
     * @param maxWidth    压缩后最大宽度
     * @param maxHeight   压缩后最大高度
     * @param quality     压缩质量
     * @param rotateAngle 旋转角度
     * @return
     */
    public static boolean compressImage(String originPath, String targetPath, Integer maxWidth, Integer maxHeight, Float quality, String rotateAngle) {
        try {
            // 获取图片后缀
            String suffix = targetPath.substring(targetPath.lastIndexOf(".") + 1);
            Thumbnails.Builder<File> fileBuilder = Thumbnails.of(originPath).outputFormat(suffix);
            // 画面发生了旋转
            if (StringUtils.isNotEmpty(rotateAngle)) {
                fileBuilder.rotate(Double.parseDouble(rotateAngle));
            }
            // 限制了最大宽度
            if (maxWidth != null) {
                fileBuilder.width(maxWidth);
            }
            // 限制了最大高度
            if (maxHeight != null) {
                fileBuilder.height(maxHeight);
            }
            if (quality != null) {
                fileBuilder.outputQuality(quality);
            }
            fileBuilder.toFile(targetPath);
            return true;
        } catch (Exception e) {
            logger.error("图片压缩失败！", e);
            return false;
        }
    }
```

有一个注意点需要说明，上面引入的 `webp-imageio-core` 依赖的版本是 `0.1.0` 的，目前的最新版是 `0.1.3` 。我引入 `0.1.3` 版本后，测试一直无法通过，因为一直有报错：

```log
Caused by: java.lang.UnsatisfiedLinkError: com.luciad.imageio.webp.WebPDecoderOptions.createDecoderOptions()J
	at com.luciad.imageio.webp.WebPDecoderOptions.createDecoderOptions(Native Method) ~[webp-imageio-core-0.1.1.jar:?]
	at com.luciad.imageio.webp.WebPDecoderOptions.<init>(WebPDecoderOptions.java:26) ~[webp-imageio-core-0.1.1.jar:?]
	at com.luciad.imageio.webp.WebPReadParam.<init>(WebPReadParam.java:24) ~[webp-imageio-core-0.1.1.jar:?]
	at com.aspirecn.kjcgkyg.controller.RecommendResultController.queryImageInfo(RecommendResultController.java:271) ~[classes/:?]
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:1.8.0_291]
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[?:1.8.0_291]
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[?:1.8.0_291]
	at java.lang.reflect.Method.invoke(Method.java:498) ~[?:1.8.0_291]
	at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:197) ~[spring-web-5.3.4.jar:5.3.4]
	at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:141) ~[spring-web-5.3.4.jar:5.3.4]
	at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:106) ~[spring-webmvc-5.3.4.jar:5.3.4]
	at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.invokeHandlerMethod(RequestMappingHandlerAdapter.java:894) ~[spring-webmvc-5.3.4.jar:5.3.4]
	at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.handleInternal(RequestMappingHandlerAdapter.java:808) ~[spring-webmvc-5.3.4.jar:5.3.4]
	at org.springframework.web.servlet.mvc.method.AbstractHandlerMethodAdapter.handle(AbstractHandlerMethodAdapter.java:87) ~[spring-webmvc-5.3.4.jar:5.3.4]
	at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1060) [spring-webmvc-5.3.4.jar:5.3.4]
	... 55 more
```

切换成 `0.1.2` 和 `0.1.1` 版本都无法解决问题，**最终在切换成 `0.1.0` 版本之后才测试通过！**相同的问题在这篇文章中也有提到：[如何用Java將PNG轉成webP](https://www.javainsoft.com/javase/java-png-trans-webp/)，使用的办法也是切换 `webp-imageio-core` 的版本。

## 参考文档

[如何用Java將PNG轉成webP](https://www.javainsoft.com/javase/java-png-trans-webp/)

[关于图片压缩的一些调查](https://segmentfault.com/a/1190000039992267)

[记录ImageIO读取文件为null的问题及Java获取图片的宽高](https://liquanhong.com/2021/11/21/imageio_read_file_is_null/)

[使用Java优雅地处理图片——图片转码和缩略图生成](https://www.mintimate.cn/2021/01/19/JavaDealWithImage/)

[更高效率，Java快速获取图片尺寸宽高分辨率（支持webp）](https://www.cnblogs.com/xiaona/p/13869504.html)
