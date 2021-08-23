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
    ajaxFlag = !isStrEmpty(elementHtml); // 加入这个判断，防止数据已拉取完仍在不断请求后台
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

// 字符是否为空
function isStrEmpty(str) {
	return str == '' || str == undefined || str == null;
}
```

## css实现鼠标悬浮文字提示
```js
// html element
<span data-tips="查看" class="fa fa-search-plus detail"></span>
```
```css
<style>
	.detail {
		color: #91BD91;
		font-size: 18px;
		float: right;
		position: relative;
	}
	.detail:hover {
		color: #C8DBC8;
		cursor: pointer;
	}
	/*悬停文字*/
	.detail:after {
		font-size: 14px;
		color: #91BD91;
		content: attr(data-tips);
		position: absolute;
		left: -7px;
		white-space: nowrap;
		opacity: 0;
		transform: translateY(-120%);
		transition: .1s;
	}
	.detail:hover:after {
		opacity: 1;
		transform: translateY(-100%);
	}
</style>
```

如果需要动态修改 `content` 值，在 `js` 中调用下面代码即可
```js
$(element).attr("data-tips", "修改后的内容");
```

## 利用Promise管理多个异步请求
浏览器端的渲染效果想要达到体验最佳，那就需要对请求进行异步处理，如果想等到所有的异步请求全部执行完毕再进行下一步操作的话，可以引入 `Promise`，Demo如下：
```js
// 执行Promise方法
function executePromiseFun(urls) {
  let apiDatas = [];
  urls.forEach(function(url) {
    let apiItem = getPromiseFun(url);
    apiDatas.push(apiItem)
  });
  // 这里.all会将所有的异步操作一起放在队列中，等待所有异步执行完毕后才会执行.then，这就保证了我们的同步获取数据
  return Promise.all(apiDatas).then(function (data) {
    return data;
  })
}

// 组装Promise方法
function getPromiseFun(url) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      type: "get",
      url: url,
      async: true, // 异步操作
      success: function(json) {
        resolve(json);
      }
    })
  })
}
```

## innerHTML存在的问题
> innerHTML的修改和添加，元素中旧的内容被移除新的内容会被重新写入元素。innerHTML内容将会被重新解析和构建元素。例如: innerHTML+ = '' 时，内容”归零” 重写，所有的图片和资源重新加载，这样会消耗更多的时间。[@[js] innerHTML有什么缺点？](https://blog.csdn.net/weixin_43392489/article/details/112142847)

在 滚动条下拉加载数据 中，渲染数据是通过 `innerHTML` 完成的，如下
![](https://i.loli.net/2021/06/18/vo24TJCPxpR78GE.png)

上次的需求中加载的数据没有图片和音视频资源，因此没有问题。这次又收到一个相似的需求，但加载的数据中多了图片和音视频资源，因此出现了问题。每次加载数据后，所有的图片音视频资源都会重新加载一遍。
因此，可以使用替代方案，我这里使用的是 `jQuery.append()` 方法，替换之后页面资源没有重新加载。

`innerHTML` 方式页面资源加载情况
![](https://i.loli.net/2021/06/18/JdHCEKVQnPxR1jT.png)


替换为 `Jquery.append()` 后，页面资源加载情况
![](https://i.loli.net/2021/06/18/F78AG45CIDehtqX.png)

## CSS子元素浮动导致父元素高度坍塌
具体事例详解见：[子元素浮动导致父元素高度不够问题的解决方案](https://www.jianshu.com/p/d146f531c317)
解决方案如下：为父元素加上 `display: flow-root`。

## 页面元素垂直居中
推荐下面的方法，不用考虑父元素是否设置的`height`值，代码如下：
```css
.parent{
  position: relative;
}
.child{
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
```

其他的一些情况，参考：[CSS垂直居中的12种实现方式](https://juejin.cn/post/6844903550909153287)

## jQuery.data() 方法
有一个 `input` 表单，注意 `data-value`
```html
<input type="text" class="form-control" id="publishRegion" name="publishRegion" data-value="" placeholder="选择地区" readonly/>
```
`jQuery.data()` 就是操作这种 `data-xxx` 的方法，下面给出示例：
```js
let dataValue = $('#publishRegion').data("value"); // 获取data-value的值
$('#publishRegion').data("value", "测试"); // 给data-value赋值
```

## 文本溢出显示省略号，鼠标浮动查看全部内容
```css
.ellipse {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /*控制显示几行*/
    -webkit-box-orient: vertical;
}
```
```html
<p class="ellipse" title="这里填写字符串内容">{{this.message}}</p>
```

## JS下载文件
第一种，弹出一个新页面进行下载
```js
window.open(url, "_blank");
```

第二种，在当前页面下载
```js
function fileDownload(url) {
	let $form = $('<form>');
	$form.attr("target","");
	$form.attr("method","get");
	$form.attr("style","display:none");
	$form.attr('action', url);
	$('body').append($form);
	$form.submit();
}
```

## 在页面引入代码编辑器
经过调研，发现了两款插件：[Ace](https://ace.c9.io/) 和 [Monaco Editor](https://microsoft.github.io/monaco-editor/)。

我使用的是Ace，下面是相关代码：
``` html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<div th:replace="common/layout :: headerCss"></div>
</head>
<body>
		 <div class="form-group">
			 <label class="col-sm-3 control-label">代码编辑</label>
			 <div class="col-sm-10">
				 <pre class="ace_editor" id="ace_editor" style="min-height:400px"></pre>
			 </div>
		 </div>
	 </form>
   <div th:replace="common/layout :: footerJs"></div>
	 <script th:src="@{/webjars/hplus/js/plugins/ace/ace.js}"></script>
	 <script th:src="@{/webjars/hplus/js/plugins/ace/ext-language_tools.js}"></script>
	 <script th:src="@{/webjars/hplus/js/plugins/ace/mode-html.js}"></script>
	 <script th:src="@{/webjars/hplus/js/plugins/ace/worker-html.js}"></script>
	 <script th:src="@{/webjars/hplus/js/plugins/ace/html.js}"></script>
	 <script th:src="@{/webjars/hplus/js/plugins/ace/theme-sqlserver.js}"></script>
	 <script th:inline="javascript">
		 let editor;
		 initAceCode();

		 // 初始化ace代码编辑器
		 function initAceCode() {
			 editor = ace.edit("ace_editor");
			 editor.setTheme("ace/theme/sqlserver"); // 风格
			 editor.session.setMode("ace/mode/html"); // 语言
			 editor.setFontSize(14);
			 editor.setReadOnly(false); // true表示只读
			 editor.setOption("wrap", "free"); //自动换行,设置为off关闭
			 ace.require("ace/ext/language_tools"); //启用提示菜单
			 editor.setOptions({
				 enableBasicAutocompletion: true,
				 enableSnippets: true,
				 enableLiveAutocompletion: true
			 });
		 }
	 </script>
</body>
</html>
```

`Demo`并不完善，只是方便理解，引入方式大致就是如此。相关的js文件去 [Ace插件包下载地址](https://pagecdn.com/lib/ace) 下载即可。其中可以设置语言和代码样式，这些也可以自定义，关于代码样式的可以参考 [Ace主题](https://www.jianshu.com/p/b21d8562d2e3)。其他相关的操作参考 [Ace Editor中文文档](https://segmentfault.com/a/1190000021386202)。

实现效果如下：![1629702939259.png](https://i.loli.net/2021/08/23/XO8shQogrNaCY9L.png)