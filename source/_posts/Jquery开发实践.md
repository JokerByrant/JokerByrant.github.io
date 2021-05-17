---
title: Jquery开发实践
tags: Jquery
categories: 前端技术
abbrlink: 53737
date: 2021-02-24 16:33:08
---
## 前言
这篇Blog主要用来记录前端开发中碰到的一些问题，以及一些开发技巧的备忘。

<!--more-->

## 调用子IFrame页面上的方法
```js
$(element)[0].contentWindow.methodName();
```

在使用这个方法前，我碰到一个问题。因为子Iframe中的方法只有一行，我就想直接在父页面定义这个方法，但是测试时发现这样方法并不能执行。代码如下：
```js
// 代码只有一行，因此我尝试直接在父Iframe执行，失败。
// 原因可能时父Iframe无法直接拿到子Iframe的element
$($("#auditFlowNav li")[authType]).find('a').click();
```
后续修改为：
```js
// 父页面
$(_self)[0].contentWindow.doChangeTab(authType);

// 子Iframe
function doChangeTab(i) {
  $($("#auditFlowNav li")[i]).find('a').click();
}
```

## 使用闭包管理变量作用域
``` js
(function(window, $) {
    // 将指定方法暴露给全局
    window.baseUtil = {
        add: add
    };

    // 其他未暴露的方法和变量的作用域仅限当前闭包内
    let tmpArg = '';

    function add(arg1, arg2) {
        return arg1 + arg2;
    }
})(window, jQuery);
```

## requireJs的使用
参考Demo：[链接](https://github.com/JokerByrant/requirejs-demo)