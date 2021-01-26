---
title: Mybatis鉴别器-discriminator
tags: Mybatis
categories: 后端技术
abbrlink: 18074
date: 2021-01-20 11:44:53
---

# 前言
新接了一个需求，从数据库查询出的数据实体，需要根据某个字段值的变化而变化。

<!-- more -->

举个简单的例子，`SQL` 数据如下：
`User`表:

|| id | username | sex |
| --- | --- | --- | ---- |
| 1 | 001 | 张三 | 男 |
| 2 | 002 | 小红 | 女 |
| 3 | 003 | 李四 | 男 |

`Male`表:

||id|user_id|remark|
|----|----|----|----|
|1|1|001|这是001的remark|
|2|2|003|这是003的remark|

`Female`表:

||id|user_id|remark|
|----|----|----|----|
|1|1|002|这是002的remark|

现在需要查询用户信息，并附带remark，最终结果如下：

||id|username|sex|remark|
|----|----|----|----|----|
|1|001|张三|男|这是001的remark|
|2|002|小红|女|这是002的remark|
|3|003|李四|男|这是003的remark|

可以看到，`remark` 来自多张表，需要根据查询结果中的 `sex` 来判断跟哪张表进行关联。如果 `sex` 是男，就要跟 `Male` 关联；如果是女，则需要跟 `Female` 进行关联。

## 使用鉴别器
可以通过 `Mybatis` 的鉴别器-`discriminator`来完成这个操作：
```xml
    <select id="selectAll" resultMap="UserResultMap">
        select * from user;
    </select>
    <select id="selectRemarkByIdFromMale" parameterType="java.lang.String" resultType="java.lang.String">
        select remark from male
        where user_id = #{userId}
    </select>
    <select id="selectRemarkByIdFromFemale" resultType="java.lang.String">
        select remark from female
        where user_id = #{userId}
    </select>
    <resultMap id="UserResultMap" type="com.sxh.entity.User">
        <id column="id" property="id" jdbcType="VARCHAR"/>
        <result column="username" property="username" jdbcType="VARCHAR"/>
        <result column="sex" property="sex" jdbcType="VARCHAR"/>
        <discriminator column="sex" javaType="java.lang.String">
            <case value="男" resultType="com.sxh.entity.User">
                <association property="remark" column="id" select="selectRemarkByIdFromMale"/>
            </case>
            <case value="女" resultType="com.sxh.entity.User">
                <association property="remark" column="{userId=id}" select="selectRemarkByIdFromFemale"/>
            </case>
        </discriminator>
</mapper>
```
注意点: `<discriminator>` 中 `<case>` 的 `resultType` 应该与 `<resultMap>` 的 `type` 一致，例如上面例子中都是 `com.sxh.entity.User`

## 通过sql处理
除了在 `Mybatis` 端进行处理外，也可以直接通过 `sql` 进行处理，使用 `case when` 语法。
```sql
select A.*,
case
    when A.sex = '男' then B.remark
    when A.sex = '女' then C.remark
end as remark
from user A
left join male B
on A.id = B.user_id
and A.sex = '男'
left join female C
on A.id = C.user_id
and A.sex = '女';
```