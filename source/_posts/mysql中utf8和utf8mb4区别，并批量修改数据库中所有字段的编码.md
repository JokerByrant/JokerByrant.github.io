---
title: mysql中utf8和utf8mb4区别，并批量修改数据库中所有字段的编码
tags: mysql
categories: 后端技术
abbrlink: 12113
date: 2021-07-02 09:10:08
---

> 写在前面，昨晚睡前突然意识到一件事儿，以前看的那些书已经在潜移默化间改变了我的思维和言行。比如现在我思考一件事儿，会在脑海中自动将从前书中的一些经验映射到现实，像是我曾经经历过一样。在与人谈话时它们的影响最明显，"腹有诗书气自华"大概就是这种感觉。

<!--more-->

## utf8和utf8mb4
`utf8`编码最大字符长度为3字节，三个字节的`UTF-8`最大能编码的 `Unicode`字符是`0xffff`，也就是`Unicode`中的基本多文种平面（BMP）。也就是说：**任何不在基本多文本平面的`Unicode`字符，都无法使用`Mysql`的`utf8`字符集存储。包括`Emoji`表情，和很多不常用的汉字，以及任何新增的 `Unicode`字符等等**。

`mysql`最早只支持`utf8`，`utf8mb4`是在`Mysql-5.5.3`版本后引入的，`mb4`就是`most bytes 4`的意思，专门用来兼容四字节的`unicode`。`utf8mb4`是`utf8`的超集，因此将字符编码从`utf8`变更为`utf8mb4`对原先的数据没有任何影响。

另外关于`utf8`和`utf8mb4`的排序规则问题，参考[mysql中utf8和utf8mb4的区别-癫Point](https://juejin.cn/post/6844903733034221576)的解释：
>`utf8_unicode_ci` 比较准确，`utf8_general_ci` 速度比较快，通常情况下 `utf8_general_ci` 的准确性就够我们用的了。如果是`utf8mb4`那么对应的就是 `utf8mb4_general_ci`、`utf8mb4_unicode_ci`。

## 批量修改数据库中所有字段的编码
开始的时候我是一个个手动改的，但是改了两个表之后，发现后面居然还有几十张表等着我，不由瑟瑟发抖...

直接使用下面的`sql`可以生成`alert`语句，
```sql
SELECT
	CONCAT(
		'ALTER TABLE ',
		TABLE_NAME,
		' CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;'
	)
FROM
	information_schema.`TABLES`
WHERE
	TABLE_SCHEMA = '这里填数据库名';
```
执行上面语句后的结果，直接复制并执行，或者导出为`sql`文件然后执行即可。
![](https://i.loli.net/2021/07/02/TkbMaYZnwGom9Ag.png)

## 参考文章
[mysql中utf8和utf8mb4的区别-癫Point](https://juejin.cn/post/6844903733034221576)
[Mysql中utf8和utf8mb4区别-朽木自雕](https://www.huaweicloud.com/articles/5fece55be68259e89d87989ca69ee9ce.html)
