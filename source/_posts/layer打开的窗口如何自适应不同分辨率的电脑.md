---
title: layer打开的窗口如何自适应不同分辨率的电脑
tags: JS
categories: 前端技术
abbrlink: 27734
date: 2023-07-24 13:24:59
---

### 前言

这个问题困扰了我许久，对于代码和页面我一直有一种洁癖心理，代码格式一定要正，页面的排布也一定要看着舒服。这个问题的起因是前年公司给重新配了一台电脑，连带着显示器也一并进行了更换，新显示器的分辨率是 `2k` 的，而原先的显示器是 `1080p` 的，之后我的代码都是在这台 `2k` 显示器上调试运行。然而在我的显示器上显示正常的页面，到了旧的电脑上就排版错乱了，而其中出现问题频率最高的就是这个 `layer` 弹出子页面的宽高问题。

<!-- more -->

### 问题描述

之前 `layer` 弹出层的宽高都是通过手动指定的方式来处理，如下：

```javascript
commonSelf.layerOpenCustome = function (title, content, width, height) {
  layer.open({
      type: 2,
      title: title,
      shadeClose: false,
      shade: 0.3,
      maxmin: true, //开启最大化最小化按钮
      area: [width, height],
      content: content,
      success: onIframeLoadSuccessEvent
  });
};
```

其中 `width` 和 `height` 就是指定的宽度和高度，之前指定的值是百分比。但是这个问题就是在不同分辨率的电脑下，百分比对应的值是不同的，这就导致可能在 `2k` 显示器下显示正常，到了 `1080p` 显示器下就排版错乱了。

### 处理办法

`layer` 窗口由两部分构成，标题栏和内容栏，其中标题栏高度是固定的 - `42px`，内容栏的高度则可以自己调整，而宽度则可以自由指定。因此，可以按照下面的方法进行处理：**在 `layer` 窗口打开后，计算页面所占的高度和宽度，然后再重新调整窗口的大小。**

对于我们的页面，只能拿到页面的高度，无法拿到宽度。因为我们页面中的表单都是通过 `Bootstrap` 的栅格系统进行布局的，这种布局无法确定页面的具体宽度。因此下面的处理都是对窗口高度的调整。

说了思路，就直接上代码了：

```javascript
/**
 * 调整窗口大小，针对layer弹出层，根据弹出页面的表单高度自适应
 */
function adjustLayerIframeHeight () {
    let height = $('.ibox').height() + 90;
    // 在不超过父页面高度的情况下，子页面的高度不能低于250
    height = (height < 250) ? 250 : height;
    let parentPageHeight = $('body', window.parent.document).height();
    // 限制窗口高度不会超过父页面面板的高度
    if (height > parentPageHeight - 20) {
        height = parentPageHeight - 20;
    }
    let $layerWindow = $('.layui-layer-iframe', window.parent.document);
    let $iframe = $('.layui-layer-iframe iframe', window.parent.document);
    // 窗口高度
    $layerWindow.height(height);
    // 窗口内iframe高度(去除标题栏)
    $iframe.height(height - 45);
    // 窗口与顶部的距离
    let iframeTop = (parentPageHeight - height) / 2;
    // 限制与顶部的距离不小于10
    if (iframeTop < 10) {
        iframeTop = 10;
    }
    $layerWindow.css('top', iframeTop + 'px');

    // 父页面宽高发生变化，调整窗口大小
    parent.window.onresize = function () {
        adjustLayerIframeHeight();
    }
    // 窗口的高度如果发生变化，那么调整窗口大小
    let pageHeight = $('.ibox').height();
    window.onmouseup = function () {
        // 延迟1ms执行，页面事件优先处理
        setTimeout(function () {
            let currentPageHeight = $('.ibox').height();
            if (pageHeight !== currentPageHeight) {
                adjustLayerIframeHeight();
            }
        }, 1);
    }
}
```

注意上面添加了一个 `onmouseup` 事件，这时因为在我们的页面中，存在一些点击某个按钮会将某些表单 \[显示/隐藏] 的情况，这会导致页面高度发生变化，因此这里就重新调整页面的高度。

调整窗口大小的方法写完了，那么应该在什么时候触发呢？开始的时候我想的是在每个页面对应的代码中加上这个方法的调用，但是页面过多，这么处理太过麻烦。因此就想有没有这么一个事件：`layer` 窗口加载完毕后会回调它。搜索了相关博客，发现有一个 `suceess` 回调事件，因此处理如下：

```javascript
commonSelf.layerOpenCustome = function (title, content, width, height) {
  layer.open({
      type: 2,
      title: title,
      shadeClose: false,
      shade: 0.3,
      maxmin: true, //开启最大化最小化按钮
      area: [width, height],
      content: content,
      success: onIframeLoadSuccessEvent
  });
};

/**
 * 窗口页面加载成功后处理的事件(这里主要是重新调整窗口的高度)
 * @param layero
 */
function onIframeLoadSuccessEvent(layero) {
  // 这里的方法会在子页面加载完毕后触发，因此这时子页面的页面高度已经确定了，直接调用子页面的changeWindowSize()方法即可
  let $childIframe = $(layero).find("iframe")[0].contentWindow;
  $childIframe.adjustLayerIframeHeight();
  // 子页面中可能存在表格，表格的数据加载需要一段时间，因此等待表格数据加载完毕，再重新调整一次页面高度
  $childIframe.$('.ibox table').each(function (index, item) {
      let $item = $childIframe.$(item);
      // 只处理有id的和没有隐藏的表格
      if ($item[0].id && $item.is(':visible')) {
          // 表格加载成功后，重新调整页面高度
          $item.on('load-success.bs.table', function(e, data) {
              $childIframe.adjustLayerIframeHeight();
          });
      }
  });
}
```

这里再补充一下，上面的 `onIframeLoadSuccessEvent` 方法中，额外处理了一种情况：**页面中有表格加载完成后重新调整窗口大小**。在测试时，我发现如果子页面存在表格，那么会出现页面高度渲染异常的情况，因此这里的处理是：\*\*在子页面存在没有隐藏且 `id` 不为空的表格时，表格的数据渲染完成后，再重新调整一次页面的高度。\*\*而这里父页面对子页面资源的调用有必要额外记录一下，因为我在这里卡了许久，必须按照下面的方式调用才能拿到子页面的表格数据：

```javascript
let $childIframe = $(layero).find("iframe")[0].contentWindow;
// 如果想拿到子页面的表格数据，必须按照下面的方式调用
$childIframe.$(item).bootStrapTable('getData');
```

