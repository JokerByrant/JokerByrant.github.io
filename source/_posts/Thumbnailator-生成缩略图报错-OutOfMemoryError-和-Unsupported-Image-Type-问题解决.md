---
title: Thumbnailator 生成缩略图报错 OutOfMemoryError 和 Unsupported Image Type 问题解决
tags: Java
categories: 后端技术
abbrlink: 25740
date: 2023-10-17 13:58:48
---
生产环境最近出现一个问题：**聊天中发送图片会出现 `OutOfMemoryError` 报错**，经过调查是服务端的图片压缩方法导致的。目前的图片压缩方法使用的是 `Thumbnailator` 库：[Github地址](https://github.com/coobird/thumbnailator)。

<!--more-->

## 问题调查

在本地打开 `JProfile` 工具，发现在上传问题图片时，会触发 `Full GC`，而触发 `Full GC` 会把程序的内存回收掉，应该不会触发 `OutOfMemoryError`。这里猜想可能在上传了问题图片后，**图片压缩算法占用内存特别大，超出了 `JVM` 中设置的最大堆内存大小，并且这个内存短时间内回收不掉，所以导致了 `OutOfMemoryError` 报错**。
![169958724982590b47d49c5c89e2ea59f3f7c10e8f3f2.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169958724982590b47d49c5c89e2ea59f3f7c10e8f3f2.png)

在 [官方给出的 FAQ](https://github.com/coobird/thumbnailator/wiki/FAQ) 中找到了 `thumbnailator` 导致内存溢出的原因，如下：
![1699587262824fdd54ec3e9d761540f06a17f060d6546.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1699587262824fdd54ec3e9d761540f06a17f060d6546.png)

文档中给出的解决办法是 **增加 `JVM` 堆内存大小**，或者使用 `-Dthumbnailator.conserveMemoryWorkaround=true` 来减少图片压缩造成的内存占用，两种办法都是通过调整 `JVM` 配置来处理。

## 处理办法

最简单的处理方式，直接增加 `JVM` 的堆内存大小。以测试环境为例，目前设置的堆内存大小是 `512M`
![169958727282750f3d4159cb36fcda0eb0da0bfb337cd.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/169958727282750f3d4159cb36fcda0eb0da0bfb337cd.png)

将这个大小提高至 `1024M`，重新对图片进行测试，上传成功。

`FAQ` 中提到：**内存占用与图片的大小成正比，如果图片大小过大，那么还是会出现内存溢出的问题**。

而我们在后台有对图片的大小做限制，生产环境中限制了最大上传图片大小为 `14M`，因此在本地使用一张 `14M` 的图片进行测试，没有发生内存溢出，上传成功。

## 其他处理办法

在 [关于图片压缩的一些调查](https://segmentfault.com/a/1190000039992267) 这篇文章中提到了另外两款压缩图片的插件：[ImageMagick](http://www.graphicsmagick.org/)、[GraphicsMagick](https://imagemagick.org/script/index.php)。

`Thumbnailator` 是通过将图片加载到内存的方式来完成对图片的处理，这会占用程序大量堆内存。而上面两个插件是通过在程序中调用第三方插件的方式来处理，图片的处理在第三方插件中进行，不会占用程序的内存。

## `Unsupported Image Type`

在进行测试时，发现有一张图片报了 `Unsupported Image Type` 的错误，图片文件见附件。
![16995872878272f6dc9cf37fd1cf54407ca102d214907.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16995872878272f6dc9cf37fd1cf54407ca102d214907.png)

查看了本地的文件系统，原图上传成功，压缩图没有上传，问题仍然是图片压缩算法导致的。

查阅了博客，原因是图片的色彩模式是 `CMYK` 导致的，常规的图片色彩模式都是 `RGB` 的，而 `thumbnailator` 不支持对 `CMYK` 模式的图片进行处理。
![1699587302825dffd9737a27adbb1c02e781cd83e51a7.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1699587302825dffd9737a27adbb1c02e781cd83e51a7.png)

在官方给出的 `FAQ` 中也提到了这个问题，可以通过引入第三方依赖的方式来解决：
![1699587316827a0a9ea02794fe04c6afd31001436e932.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1699587316827a0a9ea02794fe04c6afd31001436e932.png)

引入依赖：

```xml
<dependency>
   <groupId>com.twelvemonkeys.imageio</groupId>
   <artifactId>imageio-jpeg</artifactId>
   <version>3.9.4</version>
</dependency>    
```

之后再进行测试，又出现了 `OutOfMemoryError` 报错，仍然是图片压缩算法导致的。

并且 `App` 端在上传这张图片时，选择了这张图片后，需要等待很久才会有反应，见附件视频。

本来考虑对这类 `CMYK` 的图片，先由 `App` 端转成 `RGB` 再上传至服务端，但是 **调查发现 `CMYK` 转成 `RGB` 后可能会出现颜色失衡的情况**。并且测试了微信了聊天图片发送，发送这张图片并没有将 `CMYK` 转换成 `RGB`。

在上面的 `FAQ` 中提到可以使用 `-Dthumbnailator.conserveMemoryWorkaround=true` 来减少图片压缩造成的内存占用，在这里尝试加上
![1699587339824fe18d9a247fb2bea52bc739f8aa4effc.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1699587339824fe18d9a247fb2bea52bc739f8aa4effc.png)

之后再进行测试，图片上传成功，缩略图也正常生成。

## Dthumbnailator.conserveMemoryWorkaround 参数的作用

在 `Thumbnailator` 的源码中，可以找到关于这个参数的作用，如下：

```java
/*
 * FIXME Workaround to enable subsampling for large source images.
 *
 * Issue:
 * https://github.com/coobird/thumbnailator/issues/69
 */
if (param != null &&
		Boolean.getBoolean("thumbnailator.conserveMemoryWorkaround") &&
		width > 1800 && height > 1800 &&
		(width * height * 4L > Runtime.getRuntime().freeMemory() / 4)
) {
	int subsampling = 1;

	// Calculate the maximum subsampling that can be used.
	if (param.getSize() != null && (param.getSize().width * 2 < width && param.getSize().height * 2 < height)) {
		int targetWidth = param.getSize().width;
		int targetHeight = param.getSize().height;

		// Handle cases where .width() or .height() is called. (Issue 161)
		targetWidth = targetWidth != Integer.MAX_VALUE ? targetWidth : targetHeight;
		targetHeight = targetHeight != Integer.MAX_VALUE ? targetHeight : targetWidth;

		double widthScaling = (double)width / (double)targetWidth;
		double heightScaling = (double)height / (double)targetHeight;

		subsampling = (int)Math.floor(Math.min(widthScaling, heightScaling));

	} else if (param.getSize() == null) {
		subsampling = (int)Math.max(1, Math.floor(1 / Math.max(param.getHeightScalingFactor(), param.getWidthScalingFactor())));
	}

	// Prevent excessive subsampling that can ruin image quality.
	// This will ensure that at least a 600 x 600 image will be used as source.
	for (; (width / subsampling) < 600 || (height / subsampling) < 600; subsampling--);

	// If scaling factor based resize is used, need to change the scaling factor.
	if (param.getSize() == null) {
		try {
			Class<?> c = param.getClass();
			Field heightField = c.getDeclaredField("heightScalingFactor");
			Field widthField = c.getDeclaredField("widthScalingFactor");
			heightField.setAccessible(true);
			widthField.setAccessible(true);
			heightField.set(param, param.getHeightScalingFactor() * (double)subsampling);
			widthField.set(param, param.getWidthScalingFactor() * (double)subsampling);

		} catch (Exception e) {
			// If we can't update the parameter, then disable subsampling.
			subsampling = 1;
		}
	}

	irParam.setSourceSubsampling(subsampling, subsampling, 0, 0);
}
```

在 [Issue#69](https://github.com/coobird/thumbnailator/issues/69) 中也提到，只要触发了下面3个条件，就会对图片进行进一步压缩，防止其出现 `OutOfMemoryError` 的报错：

1. `JVM` 以 `VM` 参数启动:  `-Dthumbnailator.Conservemoryworkaring = true`
2. 高度和宽度的尺寸大于 `1800` 像素
3. 图片的预期大小 (`width * height * 4`) 占用了 `JVM` 可用内存的 `1/4` 以上
