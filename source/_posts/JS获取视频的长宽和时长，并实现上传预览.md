---
title: JS获取视频的长宽和时长，并实现上传预览
date: 2022-02-21 23:10:15
tags: JS
categories: 前端技术
---
## 前言
新接到一个需求，需要在上传视频时，对视频的分辨率和时长做一个限制，如果不符合规范则无法上传。这个需求在前端和后端都可以完成，但为了用户体验，还是放在前端来完成比较好。
<!--more-->

## 解决方案

经过调查，可以使用如下的方法来处理：拿到 `file对象` 后，通过 `URL.createObjectURL` 将 `file对象` 转化为存放 `blob` 信息的 `url`。之后再创建一个 `video实体Dom`，然后通过 `loadedmetadata` 事件获取到视频的信息，该事件是异步的，所以封装成一个 `Promise` 处理，代码如下：

```javascript
new Promise(resolve => {
  let videoElement = document.createElement('video');
  // 注意，这里的file必须是`file`类型对象
  videoElement.src = URL.createObjectURL(new Blob([file]));
  console.log(videoElement, 'videoElement')
  videoElement.addEventListener('loadedmetadata', function() {
      // 释放createObjectURL创建的对象
      URL.revokeObjectURL(this.src);
      resolve({
          videoWidth: videoElement.videoWidth, // 尺寸宽
          videoHeight: videoElement.videoHeight, // 尺寸高
          duration: videoElement.duration, // 视频时长 1表示一秒
      });
  });
}).then(videoInfo => {
    console.log(videoInfo, "视频信息")
});
```

其中有一个注意点，就是 `URL.createObjectURL(new Blob([file]))` 中的 `file` 必须是文件类型的对象，如下：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/164580186909927918d62438f62e54da56939197a3bfc.png)

这个关键点卡了我很久，因为我传入的 `file` 经过了两层额外的封装，导致最终解析出的 `url` 如下，并非是 `blob` 信息：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1645801880091470ee16f09857a8d858b986711ff6228.png)

正常的 `url` 内容如下：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/164580188909324b86b25671d0140abb6b8fc34689bb9.png)

最终获取到的视频信息如下：

![](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/16458018980948a28c30549935501e0a1efd763d65844.png)

## 实现上传前预览

要实现这个效果也很简单，只需要将上面一步中`URL.createObjectURL(new Blob([file]))` 生成的 `图片/视频` Url 放入指定的网页元素中然后渲染到页面上即可。

## 参考文档

[FileReader与URL.createObjectURL实现图片、视频上传预览](https://xiaotianxia.github.io/blog/vuepress/js/upload_using_filereader_createobjecturl.html)

[前端上传视频文件获取分辨率与时长](https://juejin.cn/post/6873033200244506638)
