---
title: Mybatis整合Mybatis Generator
tags:
  - Mybatis
  - 后端技术
categories: 后端技术
abbrlink: 28783
date: 2024-06-28 16:56:22
---

`MyBatis Generator (MBG)` 是一个用于自动生成 `MyBatis` 相关代码的工具。`MyBatis` 是一个持久层框架，它将 `Java` 对象与 `SQL` 数据库映射起来，而 `MyBatis Generator` 则帮助开发者自动生成这些映射所需的代码，包括模型类（`POJO`）、`SQL` 映射文件（`XML` 或注解形式）以及 `MyBatis` 接口（`Mapper`）。

<!--more-->

本文总结一下两种接入 `MBG` 的方式：

1. 通过 `Maven` 运行 `MBG` 工具
2. 在代码中运行 `MBG` 工具

## 接入 `MBG`

### 前期准备

环境说明：

- `JDK21`
- `Spring Boot 3.3.1`
- `Mybatis Generator 1.4.2`

在 `resources` 文件夹下创建 `Mybatis Generaor` 的配置

![1719976745829893ff2a17784239daec080ca512c4e62.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719976745829893ff2a17784239daec080ca512c4e62.png)

`generator.properties` 文件配置了数据库连接信息

```properties
jdbc.driverClass=com.mysql.cj.jdbc.Driver
jdbc.connectionURL=jdbc:mysql://localhost:3306/im?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
jdbc.userId=root
jdbc.password=123456
```

`generatorConfig.xml` 文件如下：（*注：下面的配置文件在 `Maven` 运行 `MBG` 的方式下可以直接运行，通过代码运行 `MBG` 的方式需要调整下 `targetProject` 属性的值*）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE generatorConfiguration
        PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN"
        "http://mybatis.org/dtd/mybatis-generator-config_1_0.dtd">

<generatorConfiguration>
    <!--引入外部配置文件-->
    <properties resource="generator.properties"/>
    <context id="MySqlContext" targetRuntime="MyBatis3" defaultModelType="flat">
        <property name="beginningDelimiter" value="`"/>
        <property name="endingDelimiter" value="`"/>
        <property name="javaFileEncoding" value="UTF-8"/>
        <!-- 为模型生成序列化方法-->
        <plugin type="org.mybatis.generator.plugins.SerializablePlugin"/>
        <!-- 为生成的Java模型创建一个toString方法 -->
        <plugin type="org.mybatis.generator.plugins.ToStringPlugin"/>
        <!--生成mapper.xml时覆盖原文件-->
        <plugin type="org.mybatis.generator.plugins.UnmergeableXmlMappersPlugin" />
        <!--配置生成的注释-->
        <commentGenerator>
            <!-- 是否去除自动生成的注释 true：是 ： false:否 -->
            <property name="suppressAllComments" value="true"/>
            <!-- 是否去除自动生成的日期 true：是 ： false:否 -->
            <property name="suppressDate" value="true"/>
            <!-- 是否去除自动生成的数据库中的注释 true：是 ： false:否 -->
            <property name="addRemarkComments" value="true"/>
        </commentGenerator>

        <!--配置数据库连接-->
        <jdbcConnection driverClass="${jdbc.driverClass}"
                        connectionURL="${jdbc.connectionURL}"
                        userId="${jdbc.userId}"
                        password="${jdbc.password}">
            <!--解决mysql驱动升级到8.0后不生成指定数据库代码的问题，分析见：https://www.jianshu.com/p/dbeeac29ff27-->
            <property name="nullCatalogMeansCurrent" value="true" />
        </jdbcConnection>

        <!--数据库字段类型到Java字段类型的转换规则-->
        <javaTypeResolver>
            <!-- 强制DECIMAL和NUMERIC类型转换为BigDecimal -->
            <property name="forceBigDecimals" value="true"/>

            <!-- 设置时间类型的转换，默认 false，将所有 JDBC 的时间类型解析为 java.util.Date；
                设置为 true 时，将 JDBC 的时间类型按如下规则解析：
                  DATE        -> java.time.LocalDate
                  TIME        -> java.time.LocalTime
                  TIMESTAMP      -> java.time.LocalDateTime
                  TIME_WITH_TIMEZONE      -> java.time.OffsetTime
                  TIMESTAMP_WITH_TIMEZONE     -> java.time.OffsetDateTime
               -->
            <property name="useJSR310Types" value="true"/>
        </javaTypeResolver>


        <!-- javaBean的生成 -->
        <!-- 注：关于targetProject属性  -->
        <!-- 如果是通过Maven工具运行的，那么这里targetProject只需要填src\main\java即可 -->
        <!-- 项目结构如果是父子结构，并且是通过Java代码运行的，那么这里targetProject需要填上对应子项目的路径，路径为：子项目名\src\main\java -->
        <javaModelGenerator targetPackage="com.sxh.entity" targetProject="src\main\java">
            <!-- 为JavaBean创建构造方法，构造方法包含了所有的 field -->
            <property name="constructorBased" value="false"/>
            <!-- 在 targetPackage 的基础上，根据数据库的 schema 再生成一层 package，最终生成的类放在这个package下 -->
            <property name="enableSubPackages" value="false"/>
            <!-- 创建一个不可变的类。如果为true，那么生成的JavaBean中会创建一个包含所有field的构造方法，没有setter方法 -->
            <property name="immutable" value="false"/>
            <!-- 在 getter 方法中，String 类型的字段添加 trim() 方法处理 -->
            <property name="trimStrings" value="true"/>
        </javaModelGenerator>

        <!-- XML文件的生成，如果javaClientGenerator中配置type会生成XML，那么这个参数必须要配置 -->
        <sqlMapGenerator targetPackage="mapper" targetProject="src\main\resources">
            <!-- 在 targetPackage 的基础上，根据数据库的 schema 再生成一层 package，最终生成的类放在这个package下 -->
            <property name="enableSubPackages" value="false"/>
        </sqlMapGenerator>

        <!-- Mapper接口的生成，type有如下几个值：ANNOTATEDMAPPER -> SQL以注解的形式生成在Mapper接口文件中；XMLMAPPER -> SQL生成在XML文件中；MIXEDMAPPER -> SQL会同时生成为注解和XML -->
        <javaClientGenerator type="XMLMAPPER" targetPackage="com.sxh.mapper" targetProject="src\main\java"/>
        <!--生成全部表tableName设为%-->
        <!--<table tableName="%"/>-->
        <!-- 配置需要生成代码的数据库表 -->
        <table tableName="user" domainObjectName="User"
               enableCountByExample="false" enableUpdateByExample="false"
               enableDeleteByExample="false" enableSelectByExample="false"
               selectByExampleQueryId="false">

            <!-- 指定是否只生成 domain 类，默认为 false；
               如果设置为 true，则只生成 domain 类，如果还配置了sqlMapGenerator，那么
               在 mapper.xml 文件中，只生成 resultMap 元素 -->
            <property name="modelOnly" value="false"/>

            <!-- 默认为 false；如果设置为 true，生成的 model 类会直接使用 column 本身的名字，而不会再使用驼峰命名方法。比如 CREATE_DATE，生成的属性名字就是 CREATE_DATE,而不会是 createDate -->
            <property name="useActualColumnNames" value="false"/>

            <!-- 生成主键的方法，如果设置了该元素，MBG 会在生成的 <insert> 元素中生成一条正确的 <selectKey> 元素 -->
            <!--<generatedKey column="user_uid" sqlStatement="MySql" identity="true"/>-->

            <!-- 用来修改表中某个列的属性，MBG 会根据修改后的配置来生成 domain 的属性；
               column：要重新设置的列名；一个 table 元素中可以定义多个 columnOverride 元素 -->
            <!-- 注：但我尝试了下没有生效，原因未知 -->
            <columnOverride column="var_1">
                <!-- 使用 property 属性来指定列要生成的属性名称 -->
                <property name="property" value="MySingleVar"/>

                <!-- javaType 用于指定生成的 domain 的属性类型，使用类型的全限定名-->
                <property name="javaType" value="java.lang.Integer"/>

                <!-- jdbcType用于指定该列的JDBC类型 -->
               <!--<property name="jdbcType" value=""/>-->
            </columnOverride>
        </table>
    </context>
</generatorConfiguration>

```

### 方式一：通过 `Maven` 运行 `MBG` 工具

添加如下依赖：

```xml
<!-- 方式一：通过Maven工具运行 MyBatis-Generator 工具 -->
<build>
    <plugins>
        <plugin>
            <groupId>org.mybatis.generator</groupId>
            <artifactId>mybatis-generator-maven-plugin</artifactId>
            <version>1.4.2</version>
            <configuration>
                <!--  引入 MyBatis-Generator 的配置文件 -->
                <configurationFile>${project.basedir}/src/main/resources/generatorConfig.xml</configurationFile>
                <!--  允许 MBG 将构建消息写入日志中  -->
                <verbose>true</verbose>
                <!--  再次运行 MBG 时，允许覆盖已生成的文件，但是不会覆盖 xml 文件  -->
                <overwrite>true</overwrite>
            </configuration>
            <dependencies>
                <!--  引入 mysql 的 JDBC 驱动，否则会报错找不到驱动  -->
                <dependency>
                    <groupId>com.mysql</groupId>
                    <artifactId>mysql-connector-j</artifactId>
                    <version>8.3.0</version>
                </dependency>
            </dependencies>
        </plugin>
    </plugins>
</build>
```

之后在 `IDEA` 的 `Maven` 工具栏中，执行下面的操作即可完成

![17199767688304edfeb6adeabb6438a78c651d8a49da4.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17199767688304edfeb6adeabb6438a78c651d8a49da4.png)

### 方式二：在代码中运行 `MBG` 工具

添加如下依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>3.0.3</version>
    </dependency>
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
    <!--方式二：在代码中运行 MyBatis-Generator 工具-->
    <dependency>
        <groupId>org.mybatis.generator</groupId>
        <artifactId>mybatis-generator-core</artifactId>
        <version>1.4.2</version>
    </dependency>
</dependencies>
```

新增一个 `Generator.java` 类，之后每次生成直接运行这个类即可：

```java
/**
 * 生成MBG的代码
 *
 * @author sxh
 * @date 2024/6/21
 */
public class Generator {
    public static void main(String[] args) throws Exception {
        //MBG 执行过程中的警告信息
        List<String> warnings = new ArrayList<>();
        //读取 MBG 配置文件
        InputStream is = Generator.class.getResourceAsStream("/generatorConfig.xml");
        ConfigurationParser cp = new ConfigurationParser(warnings);
        Configuration config = cp.parseConfiguration(is);
        is.close();

        //当生成的代码重复时，覆盖原代码
        DefaultShellCallback callback = new DefaultShellCallback(true);
        //创建 MBG
        MyBatisGenerator myBatisGenerator = new MyBatisGenerator(config, callback, warnings);
        //执行生成代码
        myBatisGenerator.generate(null);
        //输出警告信息
        for (String warning : warnings) {
            System.out.println(warning);
        }
    }
}
```

## 自定义 `MBG` 配置

在 `generatorConfig.xml` 中，配置了很多标签，比如 `<javaTypeResolver>`、`<commentGenerator>`、`<javaModelGenerator>`，这些标签提供了一些属性用于定义 `MBG` 生成代码的规则。通过配置这些标签和属性，可以自定义生成代码的各种细节，从而满足特定项目的需求。

这些标签提供的可配置属性虽然丰富，但有时可能无法完全满足我们的需求。在这种情况下，我们可以通过自定义配置来实现更高级或更具体的功能，以便更好地适应项目的特殊要求。

**<u>注意：下面的自定义配置只有在通过代码运行 `MBG` 工具的情况下才能正常使用，通过 `Maven` 运行 `MBG` 工具时，需要把自定义的配置打包成 `jar` ，然后通过依赖引入才能正常运行。</u>**

### 自定义 `javaTypeResolver` 类型映射

在上面的 `generatorConfig.xml` 文件中，我们配置了 `<javaTypeResolver>` 标签，如下：

```xml
<!--数据库字段类型到Java字段类型的转换规则-->
<javaTypeResolver>
    <!-- 强制DECIMAL和NUMERIC类型转换为BigDecimal -->
    <property name="forceBigDecimals" value="true"/>

    <!-- 设置时间类型的转换，默认 false，将所有 JDBC 的时间类型解析为 java.util.Date；
        设置为 true 时，将 JDBC 的时间类型按如下规则解析：
          DATE        -> java.time.LocalDate
          TIME        -> java.time.LocalTime
          TIMESTAMP      -> java.time.LocalDateTime
          TIME_WITH_TIMEZONE      -> java.time.OffsetTime
          TIMESTAMP_WITH_TIMEZONE     -> java.time.OffsetDateTime
       -->
    <property name="useJSR310Types" value="true"/>
</javaTypeResolver>
```

这个标签的作用是 **配置 `JDBC` 字段类型到 `Java` 字段类型的映射规则**，`javaTypeResolver` 的 `DTD` 如下，其中有一个 `type` 属性，可以用来指定自定义配置类：

```xml
<!--
  The javaTypeResolver element is used to define properties of the Java Type Resolver.
  The Java Type Resolver is used to calculate Java types from database column information.
  The default Java Type Resolver attempts to make JDBC DECIMAL and NUMERIC types easier
  to use by substituting Integral types if possible (Long, Integer, Short, etc.)
-->
<!ELEMENT javaTypeResolver (property*)>
<!ATTLIST javaTypeResolver
  type CDATA #IMPLIED>
```

在添加自定义配置类前，先通过源码看下这个映射规则是如何生效的。在 `JavaTypeResolverDefaultImpl.java` 中，可以看到 `Mybatis` 配置的默认的类型转换规则：

```java
public JavaTypeResolverDefaultImpl() {
    super();
    properties = new Properties();
    typeMap = new HashMap<>();

    typeMap.put(Types.ARRAY, new JdbcTypeInformation("ARRAY", //$NON-NLS-1$
            new FullyQualifiedJavaType(Object.class.getName())));
    typeMap.put(Types.BIGINT, new JdbcTypeInformation("BIGINT", //$NON-NLS-1$
            new FullyQualifiedJavaType(Long.class.getName())));
    typeMap.put(Types.BINARY, new JdbcTypeInformation("BINARY", //$NON-NLS-1$
            new FullyQualifiedJavaType("byte[]"))); //$NON-NLS-1$
    typeMap.put(Types.BIT, new JdbcTypeInformation("BIT", //$NON-NLS-1$
            new FullyQualifiedJavaType(Boolean.class.getName())));
    typeMap.put(Types.BLOB, new JdbcTypeInformation("BLOB", //$NON-NLS-1$
            new FullyQualifiedJavaType("byte[]"))); //$NON-NLS-1$
    typeMap.put(Types.BOOLEAN, new JdbcTypeInformation("BOOLEAN", //$NON-NLS-1$
            new FullyQualifiedJavaType(Boolean.class.getName())));
    typeMap.put(Types.CHAR, new JdbcTypeInformation("CHAR", //$NON-NLS-1$
            new FullyQualifiedJavaType(String.class.getName())));
    typeMap.put(Types.CLOB, new JdbcTypeInformation("CLOB", //$NON-NLS-1$
            new FullyQualifiedJavaType(String.class.getName())));
    typeMap.put(Types.DATALINK, new JdbcTypeInformation("DATALINK", //$NON-NLS-1$
            new FullyQualifiedJavaType(Object.class.getName())));
    typeMap.put(Types.DATE, new JdbcTypeInformation("DATE", //$NON-NLS-1$
            new FullyQualifiedJavaType(Date.class.getName())));
    typeMap.put(Types.DECIMAL, new JdbcTypeInformation("DECIMAL", //$NON-NLS-1$
            new FullyQualifiedJavaType(BigDecimal.class.getName())));
    typeMap.put(Types.DISTINCT, new JdbcTypeInformation("DISTINCT", //$NON-NLS-1$
            new FullyQualifiedJavaType(Object.class.getName())));
    typeMap.put(Types.DOUBLE, new JdbcTypeInformation("DOUBLE", //$NON-NLS-1$
            new FullyQualifiedJavaType(Double.class.getName())));
    typeMap.put(Types.FLOAT, new JdbcTypeInformation("FLOAT", //$NON-NLS-1$
            new FullyQualifiedJavaType(Double.class.getName())));
    typeMap.put(Types.INTEGER, new JdbcTypeInformation("INTEGER", //$NON-NLS-1$
            new FullyQualifiedJavaType(Integer.class.getName())));
    typeMap.put(Types.JAVA_OBJECT, new JdbcTypeInformation("JAVA_OBJECT", //$NON-NLS-1$
            new FullyQualifiedJavaType(Object.class.getName())));
    typeMap.put(Types.LONGNVARCHAR, new JdbcTypeInformation("LONGNVARCHAR", //$NON-NLS-1$
            new FullyQualifiedJavaType(String.class.getName())));
    typeMap.put(Types.LONGVARBINARY, new JdbcTypeInformation(
            "LONGVARBINARY", //$NON-NLS-1$
            new FullyQualifiedJavaType("byte[]"))); //$NON-NLS-1$
    typeMap.put(Types.LONGVARCHAR, new JdbcTypeInformation("LONGVARCHAR", //$NON-NLS-1$
            new FullyQualifiedJavaType(String.class.getName())));
    typeMap.put(Types.NCHAR, new JdbcTypeInformation("NCHAR", //$NON-NLS-1$
            new FullyQualifiedJavaType(String.class.getName())));
    typeMap.put(Types.NCLOB, new JdbcTypeInformation("NCLOB", //$NON-NLS-1$
            new FullyQualifiedJavaType(String.class.getName())));
    typeMap.put(Types.NVARCHAR, new JdbcTypeInformation("NVARCHAR", //$NON-NLS-1$
            new FullyQualifiedJavaType(String.class.getName())));
    typeMap.put(Types.NULL, new JdbcTypeInformation("NULL", //$NON-NLS-1$
            new FullyQualifiedJavaType(Object.class.getName())));
    typeMap.put(Types.NUMERIC, new JdbcTypeInformation("NUMERIC", //$NON-NLS-1$
            new FullyQualifiedJavaType(BigDecimal.class.getName())));
    typeMap.put(Types.OTHER, new JdbcTypeInformation("OTHER", //$NON-NLS-1$
            new FullyQualifiedJavaType(Object.class.getName())));
    typeMap.put(Types.REAL, new JdbcTypeInformation("REAL", //$NON-NLS-1$
            new FullyQualifiedJavaType(Float.class.getName())));
    typeMap.put(Types.REF, new JdbcTypeInformation("REF", //$NON-NLS-1$
            new FullyQualifiedJavaType(Object.class.getName())));
    typeMap.put(Types.SMALLINT, new JdbcTypeInformation("SMALLINT", //$NON-NLS-1$
            new FullyQualifiedJavaType(Short.class.getName())));
    typeMap.put(Types.STRUCT, new JdbcTypeInformation("STRUCT", //$NON-NLS-1$
            new FullyQualifiedJavaType(Object.class.getName())));
    typeMap.put(Types.TIME, new JdbcTypeInformation("TIME", //$NON-NLS-1$
            new FullyQualifiedJavaType(Date.class.getName())));
    typeMap.put(Types.TIMESTAMP, new JdbcTypeInformation("TIMESTAMP", //$NON-NLS-1$
            new FullyQualifiedJavaType(Date.class.getName())));
    typeMap.put(Types.TINYINT, new JdbcTypeInformation("TINYINT", //$NON-NLS-1$
            new FullyQualifiedJavaType(Byte.class.getName())));
    typeMap.put(Types.VARBINARY, new JdbcTypeInformation("VARBINARY", //$NON-NLS-1$
            new FullyQualifiedJavaType("byte[]"))); //$NON-NLS-1$
    typeMap.put(Types.VARCHAR, new JdbcTypeInformation("VARCHAR", //$NON-NLS-1$
            new FullyQualifiedJavaType(String.class.getName())));
    // JDK 1.8 types
    typeMap.put(Types.TIME_WITH_TIMEZONE, new JdbcTypeInformation("TIME_WITH_TIMEZONE", //$NON-NLS-1$
            new FullyQualifiedJavaType("java.time.OffsetTime"))); //$NON-NLS-1$
    typeMap.put(Types.TIMESTAMP_WITH_TIMEZONE, new JdbcTypeInformation("TIMESTAMP_WITH_TIMEZONE", //$NON-NLS-1$
            new FullyQualifiedJavaType("java.time.OffsetDateTime"))); //$NON-NLS-1$
}
```

类型映射逻辑在 `calculateJavaType()` 方法中：

```java
@Override
public FullyQualifiedJavaType calculateJavaType(
        IntrospectedColumn introspectedColumn) {
    FullyQualifiedJavaType answer = null;
    // 根据JDBC字段类型找对应的Java字段类型
    JdbcTypeInformation jdbcTypeInformation = typeMap
            .get(introspectedColumn.getJdbcType());

    if (jdbcTypeInformation != null) {
        // 这里拿到上面配置的默认的Java类型
        answer = jdbcTypeInformation.getFullyQualifiedJavaType();
        // 几种指定的JDBC字段类型需要额外处理一下
        answer = overrideDefaultType(introspectedColumn, answer);
    }

    return answer;
}
```

在 `overrideDefaultType()` 中，对几种指定的 `JDBC Type` 进行了转换，上面我们配置的 `useJSR310Types` 和 `forceBigDecimals` 属性，就是在这里处理的：

```java
protected FullyQualifiedJavaType overrideDefaultType(IntrospectedColumn column,
            FullyQualifiedJavaType defaultType) {
    FullyQualifiedJavaType answer = defaultType;

    switch (column.getJdbcType()) {
    case Types.BIT:
        answer = calculateBitReplacement(column, defaultType);
        break;
    case Types.DATE:
        answer = calculateDateType(column, defaultType);
        break;
    case Types.DECIMAL:
    case Types.NUMERIC:
        answer = calculateBigDecimalReplacement(column, defaultType);
        break;
    case Types.TIME:
        answer = calculateTimeType(column, defaultType);
        break;
    case Types.TIMESTAMP:
        answer = calculateTimestampType(column, defaultType);
        break;
    default:
        break;
    }

    return answer;
}

@Override
public void addConfigurationProperties(Properties properties) {
    // 从配置中拿到forceBigDecimals和useJSR310Types属性
    this.properties.putAll(properties);
    forceBigDecimals = StringUtility
            .isTrue(properties
                    .getProperty(PropertyRegistry.TYPE_RESOLVER_FORCE_BIG_DECIMALS));
    useJSR310Types = StringUtility
            .isTrue(properties
                    .getProperty(PropertyRegistry.TYPE_RESOLVER_USE_JSR310_TYPES));
}

```

下面是 `useJSR310Types` 关联的几种 `JDBC Type` 的处理，可以看到，如果该参数为 `true`，那么数据库类型和 `Java` 类型的映射关系如下： `Date` -> `LocalDate` 、`Time` -> `LocalTime`、`TimeStamp` -> `LocalDateTime`。

```java
protected FullyQualifiedJavaType calculateDateType(IntrospectedColumn column, FullyQualifiedJavaType defaultType) {
    FullyQualifiedJavaType answer;

    if (useJSR310Types) {
      // 数据库Date类型映射为Java的LocalDate类型
        answer = new FullyQualifiedJavaType("java.time.LocalDate"); //$NON-NLS-1$
    } else {
        answer = defaultType;
    }

    return answer;
}

protected FullyQualifiedJavaType calculateTimeType(IntrospectedColumn column, FullyQualifiedJavaType defaultType) {
    FullyQualifiedJavaType answer;

    if (useJSR310Types) {
        // 数据库Time类型映射为Java的LocalTime类型
        answer = new FullyQualifiedJavaType("java.time.LocalTime"); //$NON-NLS-1$
    } else {
        answer = defaultType;
    }

    return answer;
}

protected FullyQualifiedJavaType calculateTimestampType(IntrospectedColumn column,
        FullyQualifiedJavaType defaultType) {
    FullyQualifiedJavaType answer;

    if (useJSR310Types) {
      // 数据库Timestamp类型映射为Java的LocalDateTime类型
        answer = new FullyQualifiedJavaType("java.time.LocalDateTime"); //$NON-NLS-1$
    } else {
        answer = defaultType;
    }

    return answer;
}
```

下面是 `forceBigDecimals` 关联的 `JDBC Type` 的处理，

```java
protected FullyQualifiedJavaType calculateBigDecimalReplacement(IntrospectedColumn column,
            FullyQualifiedJavaType defaultType) {
    FullyQualifiedJavaType answer;

    // 处理数据库DECIMAL和NUMERIC类型字段
    // 如果字段带小数位-比如 DECIMAL(2,1)、字段长度大于18、或forceBigDecimals为true，这两种类型会被映射为BigDecimal类型
    if (column.getScale() > 0 || column.getLength() > 18 || forceBigDecimals) {
        answer = defaultType;
    } else if (column.getLength() > 9) {
      // 字段长度大于9，映射为Long
        answer = new FullyQualifiedJavaType(Long.class.getName());
    } else if (column.getLength() > 4) {
      // 字段长度大于4，映射为Integer
        answer = new FullyQualifiedJavaType(Integer.class.getName());
    } else {
      // 字段长度小于等于4，映射为Short
        answer = new FullyQualifiedJavaType(Short.class.getName());
    }

    return answer;
}
```

如果我们想自定义类型映射规则，那么可以通过实现接口 `JavaTypeResolver`，完全重写映射规则。但一般我们需要沿用 `Mybatis` 的配置，因此直接继承 `JavaTypeResolverDefaultImpl` 方法重写部分逻辑即可。

比如我现在有一个需求：**将 `JDBC` 中 `SMALLINT` 类型映射为 `JAVA` 中的 `Integer` 类型**。`Mybatis` 的默认映射规则下，`SMALLINT` 默认会被映射为 `Short` 类型，如下：

```java
typeMap.put(Types.SMALLINT, new JdbcTypeInformation("SMALLINT", //$NON-NLS-1$
                new FullyQualifiedJavaType(Short.class.getName())));
```

添加自定义配置类 `CustomJavaTypeResolver.java`，有两种处理方式：

```java
/**
 * 自定义数据库字段类型到Java类型的映射转换规则
 *
 * @author sxh
 * @date 2024/6/21
 */
public class CustomJavaTypeResolver extends JavaTypeResolverDefaultImpl {

    // 1.修改默认的映射数据
    public CustomJavaTypeResolver() {
        super();
        typeMap.put(Types.SMALLINT, new JdbcTypeInformation("SMALLINT", //$NON-NLS-1$
                new FullyQualifiedJavaType(Integer.class.getName())));
    }

    // 2.修改映射转换逻辑
    @Override
    public FullyQualifiedJavaType calculateJavaType(IntrospectedColumn introspectedColumn) {
        // 如果是SMALLINT类型，直接映射为Integer类型
        if (introspectedColumn.getJdbcType() == Types.SMALLINT) {
            return new FullyQualifiedJavaType(Integer.class.getTypeName());
        }
        // 其他类型执行原来默认的逻辑
        return super.calculateJavaType(introspectedColumn);
    }
}
```

之后在 `generatorConfig.xml` 中将自定义配置类添加到 `<javaTypeResolver>` 标签中即可：

```xml
<javaTypeResolver type="com.sxh.CustomJavaTypeResolver">
```

### 自定义 `CommentGenerator`，为 `JavaBean` 生成 `Swagger` 注解

在 `generatorConfig.xml` 中，我们配置了一个 `<commentGenerator>` 标签，如下：

```xml
<!--配置生成的注释-->
<commentGenerator>
    <!-- 是否去除自动生成的注释 true：是 ： false:否 -->
    <property name="suppressAllComments" value="true"/>
    <!-- 是否去除自动生成的日期 true：是 ： false:否 -->
    <property name="suppressDate" value="true"/>
    <!-- 是否去除自动生成的数据库中的注释 true：是 ： false:否 -->
    <property name="addRemarkComments" value="true"/>
</commentGenerator>
```

这个标签的作用是配置注释的生成规则，它的 `DTD` 如下，其中也有一个 `type` 属性，可以用来指定自定义配置类：

```xml
<!--
  The commentGenerator element is used to define properties of the Comment Generator.
  The Comment Generator adds comments to generated elements.
-->
<!ELEMENT commentGenerator (property*)>
<!ATTLIST commentGenerator
  type CDATA #IMPLIED>
```

我们先看下默认的注释生成器有哪些规则可以配置，找到 `DefaultCommentGenerator.java` 类，它实现了 `CommentGenerator.java` 接口，这个接口定义了注释生成器可以配置的规则：

```java
public interface CommentGenerator {

    /**
     * 从 CommentGenerator 配置中添加属性到此实例。
     * 
     * @param properties
     */
    void addConfigurationProperties(Properties properties);

    /**
     * 为字段添加注释
     *
     * @param field
     * @param introspectedTable
     * @param introspectedColumn
     */
    default void addFieldComment(Field field, IntrospectedTable introspectedTable, IntrospectedColumn introspectedColumn) {}

    /**
     * 添加字段注释
     *
     * @param field
     * @param introspectedTable
     */
    default void addFieldComment(Field field, IntrospectedTable introspectedTable) {}

    /**
     * 为模型类添加注释
     *
     * @param topLevelClass
     * @param introspectedTable
     */
    default void addModelClassComment(TopLevelClass topLevelClass, IntrospectedTable introspectedTable) {}

    /**
     * 为模型类添加注释
     *
     * @param modelClass
     * @param introspectedTable
     */
    default void addModelClassComment(KotlinType modelClass, IntrospectedTable introspectedTable) {}

    /**
     * 为内部类添加注释
     *
     * @param innerClass
     * @param introspectedTable
     */
    default void addClassComment(InnerClass innerClass, IntrospectedTable introspectedTable) {}

    /**
     * 为内部类添加注释
     *
     * @param innerClass
     * @param introspectedTable
     * @param markAsDoNotDelete
     */
    default void addClassComment(InnerClass innerClass, IntrospectedTable introspectedTable, boolean markAsDoNotDelete) {}

    /**
     * 为内部枚举类添加注释
     *
     * @param innerEnum
     * @param introspectedTable
     */
    default void addEnumComment(InnerEnum innerEnum, IntrospectedTable introspectedTable) {}

    /**
     * 为 getter 方法添加注释。
     *
     * @param method
     * @param introspectedTable
     * @param introspectedColumn
     */
    default void addGetterComment(Method method, IntrospectedTable introspectedTable, IntrospectedColumn introspectedColumn) {}

    /**
     * 为 setter 方法添加注释
     *
     * @param method
     * @param introspectedTable
     * @param introspectedColumn
     */
    default void addSetterComment(Method method, IntrospectedTable introspectedTable, IntrospectedColumn introspectedColumn) {}

    /**
     * 为一般方法添加注释
     *
     * @param method
     * @param introspectedTable
     */
    default void addGeneralMethodComment(Method method, IntrospectedTable introspectedTable) {}

    /**
     * 向生成的 java 文件添加文件级别的注释
     *
     * @param compilationUnit
     */
    default void addJavaFileComment(CompilationUnit compilationUnit) {}

    // 其他代码
    ...
}
```

我们可以通过继承 `DefaultCommentGenerator.java`，并重写这些方法，来实现自定义的注释生成器。

比如现在有一个需求：**项目中接入了 `Swagger`，每次生成完代码后，还需要手动为每个字段配置注解。**通过实现自定义注释生成器，我们就可以省去手动配置的操作。

添加 `CommentGenerator.java` 类：

```java
/**
 * 自定义注释生成器
 *
 * @author sxh
 * @date 2024/6/21
 */
public class CommentGenerator extends DefaultCommentGenerator {
    private boolean addRemarkComments = false;
    private static final String EXAMPLE_SUFFIX = "Example";
    private static final String MAPPER_SUFFIX = "Mapper";
    private static final String API_MODEL_PROPERTY_FULL_CLASS_NAME = "io.swagger.annotations.ApiModelProperty";

    /**
     * 设置用户配置的参数
     */
    @Override
    public void addConfigurationProperties(Properties properties) {
        super.addConfigurationProperties(properties);
        this.addRemarkComments = StringUtility.isTrue(properties.getProperty("addRemarkComments"));
    }

    /**
     * 给字段添加注释
     */
    @Override
    public void addFieldComment(Field field, IntrospectedTable introspectedTable, IntrospectedColumn introspectedColumn) {
        String remarks = introspectedColumn.getRemarks();
        //根据参数和备注信息判断是否添加swagger注解信息
        if (addRemarkComments && StringUtility.stringHasValue(remarks)) {
            //            addFieldJavaDoc(field, remarks);
            //数据库中特殊字符需要转义
            if (remarks.contains("\"")) {
                remarks = remarks.replace("\"", "'");
            }
            //给model的字段添加swagger注解
            field.addJavaDocLine("@ApiModelProperty(value = \"" + remarks + "\")");
        }
    }

    /**
     * 给model的字段添加注释
     */
    private void addFieldJavaDoc(Field field, String remarks) {
        //文档注释开始
        field.addJavaDocLine("/**");
        //获取数据库字段的备注信息
        String[] remarkLines = remarks.split(System.getProperty("line.separator"));
        for (String remarkLine : remarkLines) {
            field.addJavaDocLine(" * " + remarkLine);
        }
        addJavadocTag(field, false);
        field.addJavaDocLine(" */");
    }

    @Override
    public void addJavaFileComment(CompilationUnit compilationUnit) {
        super.addJavaFileComment(compilationUnit);
        //只在model中添加swagger注解类的导入
        if (!compilationUnit.getType().getFullyQualifiedName().contains(MAPPER_SUFFIX) && !compilationUnit.getType().getFullyQualifiedName().contains(EXAMPLE_SUFFIX)) {
            compilationUnit.addImportedType(new FullyQualifiedJavaType(API_MODEL_PROPERTY_FULL_CLASS_NAME));
        }
    }
}
```

在 `generatorConfig.xml` 中添加自定义配置：

```xml
<commentGenerator type="com.sxh.CommentGenerator">
```

之后生成的 `JavaBean` 中就自带 `Swagger` 注解了。

### 解决 `Maven` 运行 `MBG` 工具时找不到自定义配置的问题

上面在 `generatorConfig.xml` 中添加自定义配置后，通过 `Maven` 运行 `MBG` 工具时，出现了报错提示：

![1719976835829ef811af4ccd02cec57d4d78a2a236e82.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719976835829ef811af4ccd02cec57d4d78a2a236e82.png)

找不到自定义的配置，搜索了一下处理方案，需要将对应的配置类打成 `jar` 包才行。

新建一个项目，引入依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.mybatis.generator</groupId>
        <artifactId>mybatis-generator-core</artifactId>
        <version>1.4.2</version>
    </dependency>
</dependencies>
```

将自定义配置复制过来，

![1719976806831be8d7abc95ca88aa52fd3d299917eba9.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719976806831be8d7abc95ca88aa52fd3d299917eba9.png)

然后使用 `maven` 打包这个项目。之后修改原项目中 `mybatis-generator-plugin` 配置信息，导入自定义注释插件的依赖

```xml
<!-- 方式二：通过Maven工具运行 MyBatis-Generator 工具 -->
<build>
    <plugins>
        <plugin>
            <groupId>org.mybatis.generator</groupId>
            <artifactId>mybatis-generator-maven-plugin</artifactId>
            <version>${mybatis-generator.version}</version>
            <configuration>
                <!--  引入 MyBatis-Generator 的配置文件 -->
                <configurationFile>${project.basedir}/src/main/resources/generatorConfig.xml</configurationFile>
                <!--  允许 MBG 将构建消息写入日志中  -->
                <verbose>true</verbose>
                <!--  再次运行 MBG 时，允许覆盖已生成的文件，但是不会覆盖 xml 文件  -->
                <overwrite>true</overwrite>
            </configuration>
            <dependencies>
                <!--  引入 mysql 的 JDBC 驱动，否则会报错找不到驱动  -->
                <dependency>
                    <groupId>com.mysql</groupId>
                    <artifactId>mysql-connector-j</artifactId>
                    <version>8.3.0</version>
                </dependency>
                <!--引入自定义配置对应的jar包-->
                <dependency>
                    <groupId>com.sxh</groupId>
                    <artifactId>MybatisGenerator-CustomPlugin</artifactId>
                    <version>1.0-SNAPSHOT</version>
                    <scope>system</scope>
                    <!--MybatisGenerator-CustomPlugin是与当前项目平级的项目，因此这里通过相对路径引入-->
                    <systemPath>${project.basedir}/../MybatisGenerator-CustomPlugin/target/MybatisGenerator-CustomPlugin-1.0-SNAPSHOT.jar</systemPath>
                </dependency>
            </dependencies>
        </plugin>
    </plugins>
</build>
```

之后在 `generatorConfig.xml` 中引入自定义的配置：

```xml
<javaTypeResolver type="com.sxh.CustomJavaTypeResolver">
  
<commentGenerator type="com.sxh.CommentGenerator">
```

再执行 `maven` 工具的 `mybatis-generator:generate` 操作就能正常运行了。

## 总结

本文总结了日常开发中引入 `Mybatis Generator` 的两种方式，并介绍了自定义 `Mybatis Generator` 配置的方法，最后给出了使用 `Maven` 运行 `MBG` 工具时找不到自定义配置问题的处理办法。

`MyBatis Generator` 自动生成数据访问层代码的功能，可以有效减少重复劳动，提高开发效率。

## 参考文章

- [MyBatis Generator 自定义生成注释](https://segmentfault.com/a/1190000016525887)
- [一文解析 MyBatis Generator 的使用及配置](https://juejin.cn/post/6844904116422983694)
- [SpringBoot(十一)：springboot2.0.2下配置mybatis generator环境，并自定义字段/getter/settetr注释](https://www.cnblogs.com/yy3b2007com/p/10397281.html)
- [如何在 Maven 中通过本地路径使用 JAR 包依赖](https://blog.csdn.net/wangpaiblog/article/details/127840334)
- [mybatis generator如何定制JavaTypeResolver，使smallint类型的数据库字段在po中的类型为Integer？ ](https://www.cnblogs.com/grey-wolf/p/9090337.html)
- [MybatisGenerator处理父子项目、多模块不生成文件的问题](https://blog.csdn.net/u013541707/article/details/109604989)
