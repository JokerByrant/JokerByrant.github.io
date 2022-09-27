---
title: Mysql分组并返回每组里最新的数据
tags:
  - Mysql
  - 后端技术
categories: 后端技术
abbrlink: 7035
date: 2022-07-23 11:48:18
---

在开发中经常会碰到这个问题，之前自己写的 `sql` 在测试后发现都是有问题的，下面放上一个比较好的解决方案。

<!--more-->

代码如下：

```sql
select t1.*
FROM t_app_seal_user t1
LEFT JOIN t_app_seal_user t2
ON t1.user_uid = t2.user_uid
       and t1.seal_type = t2.seal_type
       and t1.seal_time < t2.seal_time
where t2.seal_uid is null
order by seal_time desc;
```

此方法来自: [Retrieving the last record in each group](https://thispointer.com/retrieving-the-last-record-in-each-group-mysql/)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664257669049b7825202754ab637e0ce14012694a448.png)

这个方法没有使用 `group by` ，但是达到了分组的效果，很巧妙。
