---
title: Mybatis Plus使用
abbrlink: 51328
date: 2024-07-01 11:22:36
tags:
  - Mybatis
  - 后端技术
  - Mybatis Plus
categories: 后端技术
---

`MyBatis-Plus` 是一个基于 `MyBatis` 的增强工具，其目的是简化 `MyBatis` 的开发工作，提高开发效率。

本文记录一下 `SpringBoot` 引入 `Mybatis Plus` 的过程，以及 `Mybatis Plus` 的一些使用。

<!--more-->

### 接入过程

可以配合 [Mybatis Plus 官方指引](https://baomidou.com/getting-started/) 一起看

环境说明：

- `JDK21`
- `Spring Boot 3.3.1`
- `Mybatis Plus 3.5.7`

引入如下依赖：

```xml
<dependencies>
    <!--mybatis-plus依赖-->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-boot-starter</artifactId>
        <version>3.5.7</version>
    </dependency>
    <!--修复 Invalid value type for attribute 'factoryBeanObjectType' 报错-->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis-spring</artifactId>
        <version>3.0.3</version>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

在 `application.yml` 中添加数据库配置

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/im?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: 123456
```

创建数据库表对应的实体类：

```java
@Data
// 标记表名，非必填
@TableName("user")
public class User {
    // 标记主键，非必填，主键类型为分配uid
    @TableId(type = IdType.ASSIGN_UUID)
    private String userUid;

    // 标记表字段，非必填
    @TableField
    private String account;

    private String password;

    private String userName;

    private String userAvatar;

    private Integer sex;

    private String mobile;

    private LocalDateTime updateDate;

    private LocalDateTime createDate;

    private Integer isDelete;

    // 标记为乐观锁
    @Version
    private Integer version;
}
```

创建 `mapper` 文件

```java
public interface UserMapper extends BaseMapper<User> {
    // 被逻辑删除的数据也一并返回
    @Select("select * from user")
    List<User> selectListIncludeDelete();
}
```

创建 `Mybatis-plus` 配置类，添加 `@MapperScan` 注解，增加乐观锁的支持

```java
@Configurable
@MapperScan("com.sxh.dao")
public class MybatisPlusConfig {
    /**
     * 添加乐观锁支持
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return interceptor;
    }
}
```

之后我们编写一个测试类测试一下：

```java
package com.sxh;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.sxh.dao.UserMapper;
import com.sxh.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

@SpringBootTest
public class SampleTest {
    @Autowired
    private UserMapper userMapper;

    @Test
    public void testUpdate() {
        // 新增一条记录
        User user = new User();
        printEffectRowResult("新增", userMapper.insert(user));
        // 修改数据，版本号不匹配
        user.setVersion(0);
        printEffectRowResult("修改", userMapper.updateById(user));
        // 修改数据
        user.setUserName("张三");
        printEffectRowResult("修改", userMapper.updateById(user));
        // 删除数据
        // 如果添加了逻辑删除配置，那么这里只是将对应的删除字段置为 [已删除] 状态（这里是`isDelete`被置为 `1`），对应的数据不会被物理移除
        printEffectRowResult("删除", userMapper.deleteById(user));
        // 通过默认的查询方法无法查询出被逻辑删除的数据，下面几种查询都不会返回被逻辑删除的数据
        printQueryResult("查询被移除的数据", userMapper.selectById(user.getUserUid()));
        printQueryResult("查询所有数据", userMapper.selectList(null));
        printQueryResult("查询被移除的数据", userMapper.selectByMap(Map.of("user_uid", user.getUserUid(), "is_delete", 0)));
        // 下面的方法可以强制查询出已被逻辑删除的数据
        // 自定义sql
        printQueryResult("自定义Sql查询出被移出的数据", userMapper.selectListIncludeDelete());
        // 注：mybatis plus 官方并不建议将已经逻辑删除的数据查询出来，如果要查那么就不要使用@TableLogic，而是自己维护一个状态字段，通过update方法修改这个字段
    }

    @Test
    public void testQuery() {
        // 查询全部数据
        printQueryResult("查询全部数据", userMapper.selectList(null));
        // 以实体作为查询参数
        User query = new User();
        query.setUserName("张三");
        QueryWrapper<User> wrapper = new QueryWrapper<>(query);
        printQueryResult("以实体作为查询参数", userMapper.selectList(wrapper));
        // 根据map查询。key是表字段名，而不是实体字段名
        Map<String, Object> queryMap = Map.of("user_name", "张三");
        printQueryResult("根据Map查询", userMapper.selectByMap(queryMap));
        // 条件构造
        QueryWrapper<User> wrapper2 = new QueryWrapper<>();
        wrapper2.eq("user_name", "张三").orderByDesc("create_date");
        printQueryResult("条件构造查询", userMapper.selectList(wrapper2));
        // 组装sql
        // select * from user
        // where date_format(create_date, '%Y') = '2024'
        // and user_uid in (select user_uid from user where user_name like '%张%')
        QueryWrapper<User> wrapper3 = new QueryWrapper<>();
        wrapper3.apply("date_format(create_date, '%Y') = {0}", "2024").inSql("user_uid", "select user_uid from user where user_name like '%张%'");
        printQueryResult("组装sql", userMapper.selectList(wrapper3));
        // 传入lambda
        QueryWrapper<User> wrapper4 = new QueryWrapper<>();
        wrapper4.and(wq -> wq.eq("sex", 1));
        // 结尾拼接sql
        QueryWrapper<User> wrapper5 = new QueryWrapper<>();
        wrapper5.last("limit 1");
        printQueryResult("结尾拼接sql", userMapper.selectList(wrapper5));
        // 查询结果返回指定列
        QueryWrapper<User> wrapper6 = new QueryWrapper<>();
        wrapper6.select("user_uid", "user_name", "create_date");
        printQueryResult("查询结果返回指定列", userMapper.selectList(wrapper6));
        // 查询结果排除指定列
        QueryWrapper<User> wrapper7 = new QueryWrapper<>();
        wrapper7.select(User.class, info -> !info.isVersion() && !info.getColumn().equals("is_delete"));
        printQueryResult("查询结果排除指定列", userMapper.selectList(wrapper7));
        // lambda构造查询
        LambdaQueryWrapper<User> lambdaQueryWrapper = Wrappers.lambdaQuery();
        lambdaQueryWrapper.like(User::getUserName, "张").eq(User::getSex, 1);
        printQueryResult("lambda构造查询", userMapper.selectList(lambdaQueryWrapper));
    }

    private void printEffectRowResult(String actionName, int effectRow) {
        System.out.println("======================" + actionName + "======================");
        if (effectRow == 0) {
            System.err.println("操作失败！版本号不匹配！");
        } else {
            System.out.println("操作成功！");
        }
    }

    private void printQueryResult(String actionName, Object result) {
        System.out.println("============================================" + actionName + "============================================");
        if (result instanceof List<?> list) {
            list.forEach(System.out::println);
        } else {
            System.out.println(result);
        }
    }
}
```

在实际开发中，有如下几个建议：

1. 尽量使用 `Lambda` 开头的各种 `Wrapper`。有如下几个优点：具有更好的代码可读性、编译时检查、避免硬编码字段名称、减少列名变更带来的风险。
2. 较为复杂的 `sql` 还是直接在 `xml` 中手写比较好。

### `Invalid value type for attribute 'factoryBeanObjectType'` 报错

其中我们引入了 `mybatis-spring 3.0.3`，引入这个依赖是为了解决 `Invalid value type for attribute 'factoryBeanObjectType'` 报错：

![1719977021690479b54f8afcbef79618121b7f651ab10.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719977021690479b54f8afcbef79618121b7f651ab10.png)

`myabtis plus 3.5.7` 默认引入的 `mybatis-spring` 版本是 `2.1.2`，本地使用的 `spring boot` 版本是 `3.3.1`，在 `mybatis-spring` 的一个 `issue` 中提到了该问题已被修复：[mybatis-spring issue#865](https://github.com/mybatis/spring/pull/865)

![1719977062685c7701d7215df86637d2b04e251f8e8c3.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719977062685c7701d7215df86637d2b04e251f8e8c3.png)

![1719977173901d4b3df710bb6ebb399d1a670acbfc607.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719977173901d4b3df710bb6ebb399d1a670acbfc607.png)

因此，在 `Spring Boot 3` 中使用 `mybatis-plus`，需要将默认的 `mybatis-spring` 版本替换为 `3.0.3`

### 参考文档

[Mybatis Plus 官方文档](https://baomidou.com/)

[MyBatisPlus使用时报错Invalid value type for attribute ‘factoryBeanObjectType‘](https://blog.csdn.net/lonely__snow/article/details/134897066)

[Springboot 使用 Mybatis 启动失败排查定位](https://developer.aliyun.com/article/1103480)

[MyBatis 框架大家在使用的吗？](https://v2ex.com/t/931976)
