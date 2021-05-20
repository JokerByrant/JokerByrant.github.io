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

## 合并两个数组
参考链接：[JS合并两个数组的方法](https://blog.csdn.net/sunshinezx8023/article/details/80080803)
```js
let arr1 = [1,2,3];
let arr2 = [4,5,6];

// 1.concat
let arr3 = arr1.concat(arr2); // c=[1,2,3,4,5,6]

// 2. for循环
for(let i in arr2) {
    arr1.push(arr2[i]); // arr1=[1,2,3,4,5,6]
}

// 3. apply
arr1.push.apply(arr1, arr2); // arr1=[1,2,3,4,5,6]
```

## 滚动条下拉加载数据
参考链接：[js实现 web页面的滚动条下拉时加载更多](https://segmentfault.com/a/1190000016197930)
```js
let pageSize = 15; //每页数量
let pageNo = 1; //当前页数
let C = 10; //滚动条距离底部的距离
let ajaxFlag = true; //节流处理，防止滚动事件多次触发
let dataList = []; // 数据

// 绑定拉取滚动条事件
function bindScrollEvent() {
  let $currentElement = $('#elementId');
    $currentElement.unbind("scroll").scroll(function () {
        let scrollTop = $(this)[0].scrollTop; // 滚动条滚动的距离
        let scrollHeight = $(this)[0].scrollHeight; // 滚动条包含的总距离
        let clientHeight = $(this)[0].clientHeight; // clientHeight = scrollHeight - scrollTop
        let leftHeight = (scrollTop + clientHeight) - scrollHeight; // 剩余滚动条距离
        if (leftHeight >= -C && ajaxFlag) { // 这里的判断条件为>=，如果设置为==，可能不会触发
            ajaxFlag = false;
            pageNo++;
            addHtmlElement($currentElement);
        }
    });
}

// 加载数据并渲染到页面
function addHtmlElement($currentElement) {
    let elementHtml = '';
    let lastIndex = $currentElement.find('li').length;
    let rows = getData();
    dataList.push.apply(dataList, rows); // 合并数组
    rows.forEach(function (data, index) {
        elementHtml += assembleHtmlElement(data); // 组装html
    });
    $currentElement[0].innerHTML += elementHtml;
    ajaxFlag = true;
}

// 拉取数据
function getData() {
  let params = {
      condition: $("#searchForm").serializeObject(),
      pageSize: pageSize,
      page: pageNo,
  };
  let rows = [];
  $.ajax({
      type: "get",
      url: "xxx",
      data: params,
      dataType: "json",
      async: false,
      success: function (data) {
          if (data.code == 200) {
              rows = data.rows;
          }
      }
  });
  pageNo++;
  return rows;
}
```