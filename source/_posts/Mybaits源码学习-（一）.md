---
title: Mybaits源码学习-（一）
tags:
  - Mybatis
  - 后端技术
categories: 后端技术
abbrlink: 31982
date: 2022-08-13 10:11:54
---
> 注：本文的内容大部分转载自 [Mybatis详解 - Java全栈知识体系](https://www.pdai.tech/md/framework/orm-mybatis/mybatis-overview.html)

这篇文章记录我在学习 `Mybaits` 源码的一些记录，包含两部分，这是第一部分，主要是学习一下 `Mybatis` 的总体设计。

<!--more-->

## 源码下载和构建

先把源码下载下来，可以参考这篇文章：[MyBatis源码阅读准备](https://www.jianshu.com/p/e739afb8fe31)。

在测试过程中使用的 `Demo` 来自 [mybatis-cache-demo](https://github.com/kailuncen/mybatis-cache-demo)，原文链接：[聊聊MyBatis缓存机制 - 美团技术团队](https://tech.meituan.com/2018/01/19/mybatis-cache.html)。

源码和 `Demo` 准备好之后，将源码导入到 `Demo` 的项目中，修改 `Demo` 依赖中的 `mybatis`，将其修改为我们下载下来的源码，如下：

```java
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.3.0-SNAPSHOT</version>
</dependency>
```

最终项目的结构如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424474393949db8d4f4fc24e43431c962a03e3e9d9.png)

## 总体设计

### 接口层

传统的 `Mybatis` 工作模式是使用 `SqlSession` 对象完成和数据库的交互：**创建一个 `SqlSession`，用来和数据库进行交互，然后根据 `Statement Id` 和参数来操作数据库。**

上面的方式比较简单：`new` 一个对象，然后调用这个对象的各个方法。但是它不符合面向对象语言的特性，为了适应这一特性，`Mybaits` 增加了一种支持接口的调用方式，也就是我们现在常用的方式。

如下图，`MyBatis` 将配置文件中的每一个 `<mapper>` 节点抽象为一个 `Mapper` 接口，而这个接口中声明的方法和跟 `<mapper>` 节点中的 `<select|update|delete|insert>` 节点相对应，即 `<select|update|delete|insert>` 节点的 `id` 值为 `Mapper` 接口中的方法名称，`parameterType` 值表示 `Mapper` 对应方法的入参类型，而 `resultMap` 值则对应了 `Mapper` 接口表示的返回值类型或者返回结果集的元素类型。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642447499409b78dccf9611ddecdb2bbd56d2b4ea57.png)

根据 `MyBatis` 的配置规范配置好后，通过 `SqlSession.getMapper(XXXMapper.class)` 方法，`MyBatis` 会根据相应的接口声明的方法信息，通过动态代理机制生成一个 `Mapper` 实例。

我们使用 `Mapper` 接口的某一个方法时，`MyBatis` 会根据这个方法的方法名和参数类型，确定 `Statement Id`，底层还是通过 `SqlSession.select("statementId",parameterObject)` 或者 `SqlSession.update("statementId",parameterObject)` 等等来实现对数据库的操作。

`MyBatis` 引用 `Mapper` 接口这种调用方式，纯粹是为了满足面向接口编程的需要。（其实还有一个原因是在于，面向接口的编程，使得用户在接口上可以使用注解来配置 `SQL` 语句，这样就可以脱离 `XML` 配置文件，实现“0配置”）。

### 数据处理层

主要包含三个功能：

- **参数映射。**
  
  这个是指对于 `java` 数据类型和 `jdbc` 数据类型之间的转换，包括两个过程：
  - 查询阶段：我们要将java类型的数据，转换成jdbc类型的数据，通过 `preparedStatement.setXXX()` 来设值；
  - 结果映射：对 `resultset` 查询结果集的 `jdbcType` 数据转换成 `java` 数据类型。
- **通过传入参数构建动态 `SQL` 语句。**
  
  `MyBatis` 通过传入的参数值，使用 `Ognl` 来动态地构造 `SQL` 语句。
- **`SQL` 语句的执行以及封装查询结果集成 `List<E>`**

### 框架支持层

- **事务管理机制** 
  
  事务管理机制对于 `ORM` 框架而言是不可缺少的一部分，事务管理机制的质量也是考量一个 `ORM` 框架是否优秀的一个标准。
- **连接池管理机制** 
  
  由于创建一个数据库连接所占用的资源比较大， 对于数据吞吐量大和访问量非常大的应用而言，连接池的设计就显得非常重要。 
- **缓存机制** 
  
  为了提高数据利用率和减小服务器和数据库的压力，`MyBatis` 会对于一些查询提供会话级别的数据缓存，会将对某一次查询，放置到 `SqlSession` 中，在允许的时间间隔内，对于完全相同的查询，`MyBatis` 会直接将缓存结果返回给用户，而不用再到数据库中查找。 
- **`SQL` 语句的配置方式** 
  
  传统的 `MyBatis` 配置 `SQL` 语句方式就是使用 `XML` 文件进行配置的，但是这种方式不能很好地支持面向接口编程的理念。为了支持面向接口的编程，`MyBatis` 引入了 `Mapper`接口的概念。面向接口的引入，对使用注解来配置 `SQL` 语句成为可能，用户只需要在接口上添加必要的注解即可，不用再去配置 `XML` 文件了。但是，目前的 `MyBatis` 只是对注解配置 `SQL` 语句提供了有限的支持，某些高级功能还是要依赖 `XML` 配置文件配置 `SQL` 语句。
  
### 引导层
  
  引导层是配置和启动MyBatis配置信息的方式。`MyBatis` 提供两种方式来引导 `MyBatis` ：基于 `XML` 配置文件的方式、基于 `Java API`的方式。

## `Mybatis` 初始化

首先按照传统方式来对 `Mybatis` 进行初始化：

```java
// mybatis初始化
String resource = "mybatis-config.xml";  
InputStream inputStream = Resources.getResourceAsStream(resource);  
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);

// 创建SqlSession
SqlSession sqlSession = sqlSessionFactory.openSession();  

// 执行SQL语句
List list = sqlSession.selectList("com.foo.bean.BlogMapper.queryAllBlogInfo");
```

根据下面的图看一下 `Mybatis` 的初始化流程：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664244767939cc0084c217909ad2a61d8023cdc73320.png)

接着分析源码，看看初始化过程经历了什么：

```java
public SqlSessionFactory build(InputStream inputStream)  {  
    return build(inputStream, null, null);  
}  

public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties)  {  
    try  {  
        //1. 创建XMLConfigBuilder对象用来解析XML配置文件，生成Configuration对象  
        XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);  
        //2. 将XML配置文件内的信息解析成Java对象Configuration对象  
        Configuration config = parser.parse();  
        //3. 根据Configuration对象创建出SqlSessionFactory对象  
        return build(config);  
    } catch (Exception e) {  
        throw ExceptionFactory.wrapException("Error building SqlSession.", e);  
    } finally {  
        ErrorContext.instance().reset();  
        try {  
            inputStream.close();  
        } catch (IOException e) {  
            // Intentionally ignore. Prefer previous error.  
        }  
    }
}

// 从此处可以看出，MyBatis内部通过Configuration对象来创建SqlSessionFactory,用户也可以自己通过API构造好Configuration对象，调用此方法创SqlSessionFactory  
public SqlSessionFactory build(Configuration config) {  
    return new DefaultSqlSessionFactory(config);  
}  

```

初始化过程中涉及到以下几个对象：

- `SqlSessionFactoryBuilder` ： `SqlSessionFactory` 的构造器，用于创建 `SqlSessionFactory`，采用了 `Builder` 设计模式 
- `Configuration`：该对象包含了 `mybatis-config.xml` 文件中所有 `mybatis` 配置信息 
- `SqlSessionFactory`：`SqlSession` 工厂类，以工厂形式创建 `SqlSession` 对象，采用了 `Factory` 工厂设计模式 
- `XmlConfigParser`：负责将 `mybatis-config.xml` 配置文件解析成 `Configuration` 对象，供 `SqlSessonFactoryBuilder` 使用，创建 `SqlSessionFactory`

重点看下 `mybatis` 是如何将 `xml` 配置文件转换成 `Configuration` 对象的，先看流程图：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664244779939e5b74cfd5367f08ca3ca65ce62ee9e45.png)

`XMLConfigBuilder` 会将 `XML` 配置文件的信息转换为 `Document` 对象 而 `XML` 配置定义文件 `DTD` 转换成 `XMLMapperEntityResolver` 对象，然后将二者封装到 `XpathParser` 对象中，`XpathParser` 的作用是提供根据 `Xpath` 表达式获取基本的 `DOM` 节点 `Node` 信息的操作。看下代码：

```java
public Configuration parse() {  
    if (parsed) {  
        throw new BuilderException("Each XMLConfigBuilder can only be used once.");  
    }  
    parsed = true;  
    //源码中没有这一句，只有 parseConfiguration(parser.evalNode("/configuration"));  
    //为了让读者看得更明晰，源码拆分为以下两句  
    XNode configurationNode = parser.evalNode("/configuration");  
    parseConfiguration(configurationNode);  
    return configuration;  
}  
/** 
 * 解析 "/configuration"节点下的子节点信息，然后将解析的结果设置到Configuration对象中 
 */  
private void parseConfiguration(XNode root) {  
    try {  
        //1.首先处理properties 节点     
        propertiesElement(root.evalNode("properties")); //issue #117 read properties first  
        //2.处理typeAliases  
        typeAliasesElement(root.evalNode("typeAliases"));  
        //3.处理插件  
        pluginElement(root.evalNode("plugins"));  
        //4.处理objectFactory  
        objectFactoryElement(root.evalNode("objectFactory"));  
        //5.objectWrapperFactory  
        objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));  
        //6.settings  
        settingsElement(root.evalNode("settings"));  
        //7.处理environments  
        environmentsElement(root.evalNode("environments")); // read it after objectFactory and objectWrapperFactory issue #631  
        //8.database  
        databaseIdProviderElement(root.evalNode("databaseIdProvider"));  
        //9.typeHandlers  
        typeHandlerElement(root.evalNode("typeHandlers"));  
        //10.mappers  
        mapperElement(root.evalNode("mappers"));  
    } catch (Exception e) {  
        throw new BuilderException("Error parsing SQL Mapper Configuration. Cause: " + e, e);  
    }  
} 
```

在上述代码中，有一个非常重要的地方，就是解析 `XML` 配置文件子节点 `<mappers>` 的方法 `mapperElements(root.evalNode("mappers"))`, 它将解析我们配置的 `Mapper.xml` 配置文件，`Mapper` 配置文件可以说是 `MyBatis` 的核心，`MyBatis` 的特性和理念都体现在此 `Mapper` 的配置和设计上。

从上述代码可知，节点解析有10步，我们重点看两个：对 `environments` 的解析、对 `mappers` 的解析。

先看对 `environments` 的解析，看下 `environments` 的配置，

```xml
<environments default="development">
    <environment id="development">
        <!--使用默认的JDBC事务管理-->
        <transactionManager type="JDBC"/>
        <!--使用连接池-->
        <dataSource type="POOLED">
            <!--这里会替换为local-mysql.properties中的对应字段的值-->
            <property name="driver" value="${driver}"/>
            <property name="url" value="${url}"/>
            <property name="username" value="${username}"/>
            <property name="password" value="${password}"/>
        </dataSource>
    </environment>
</environments>
```

然后结合上面的配置看下代码：

```java
/** 
 * 解析environments节点，并将结果设置到Configuration对象中 
 * 注意：创建envronment时，如果SqlSessionFactoryBuilder指定了特定的环境（即数据源）； 
 *      则返回指定环境（数据源）的Environment对象，否则返回默认的Environment对象； 
 *      这种方式实现了MyBatis可以连接多数据源 
 */  
private void environmentsElement(XNode context) throws Exception {  
    if (context != null)  {  
        if (environment == null)  { 
            // 解析environments节点的default属性值，例：<environments default="development">
            environment = context.getStringAttribute("default");  
        }  
        for (XNode child : context.getChildren())  {  
            // 获取environment子节点的id属性值，id值通常对应不同的环境(生产&测试)
            String id = child.getStringAttribute("id");  
            // 根据environments节点的default属性值选择对应的environment
            if (isSpecifiedEnvironment(id))  {  
                //1.创建事务工厂 TransactionFactory  
                TransactionFactory txFactory = transactionManagerElement(child.evalNode("transactionManager"));  
                DataSourceFactory dsFactory = dataSourceElement(child.evalNode("dataSource"));  
                //2.创建数据源DataSource  
                DataSource dataSource = dsFactory.getDataSource();  
                //3. 构造Environment对象  
                Environment.Builder environmentBuilder = new Environment.Builder(id)  
                .transactionFactory(txFactory)  
                .dataSource(dataSource);  
                //4. 将创建的Envronment对象设置到configuration 对象中  
                configuration.setEnvironment(environmentBuilder.build());  
            }  
        }  
    }  
}

private boolean isSpecifiedEnvironment(String id)  {  
    if (environment == null)  {  
        throw new BuilderException("No environment specified.");  
    }  
    else if (id == null)  {  
        throw new BuilderException("Environment requires an id attribute.");  
    }
    // environment值是<environments>节点下default属性的值
    else if (environment.equals(id))  {  
        return true;  
    }  
    return false;  
} 

// dataSource的解析方法
private DataSourceFactory dataSourceElement(XNode context) throws Exception {
    if (context != null) {
        //dataSource的连接池
        String type = context.getStringAttribute("type");
        //子节点 name, value属性set进一个properties对象
        Properties props = context.getChildrenAsProperties();
        //创建dataSourceFactory
        DataSourceFactory factory = (DataSourceFactory) resolveClass(type).newInstance();
        factory.setProperties(props);
        return factory;
    }
    throw new BuilderException("Environment declaration requires a DataSourceFactory.");
} 
```

在配置 `dataSource` 时使用了 `$driver` 这种表达式，它是通过 `PropertyParser` 来解析的：

```java
/**
 * 这个类解析${}这种形式的表达式
 */
public class PropertyParser {

    public static String parse(String string, Properties variables) {
        VariableTokenHandler handler = new VariableTokenHandler(variables);
        GenericTokenParser parser = new GenericTokenParser("${", "}", handler);
        return parser.parse(string);
    }

    private static class VariableTokenHandler implements TokenHandler {
        private Properties variables;

        public VariableTokenHandler(Properties variables) {
            this.variables = variables;
        }

        public String handleToken(String content) {
            if (variables != null && variables.containsKey(content)) {
                return variables.getProperty(content);
            }
            return "${" + content + "}";
        }
    }
}
```

再看下对 `mapper` 的解析：

```xml
<!--SQL映射文件,mybatis的核心-->
<mappers>
    <mapper resource="mapper/studentMapper.xml"/>
    <mapper resource="mapper/classMapper.xml"/>
</mappers>
```

```java
// 解析mapper节点
private void mapperElement(XNode parent) throws Exception {
  if (parent != null) {
    for (XNode child : parent.getChildren()) {
      if ("package".equals(child.getName())) {
        // 如果mappers节点的子节点是package, 那么就扫描package下的文件, 注入进configuration
        String mapperPackage = child.getStringAttribute("name");
        configuration.addMappers(mapperPackage);
      } else {
        String resource = child.getStringAttribute("resource");
        String url = child.getStringAttribute("url");
        String mapperClass = child.getStringAttribute("class");
        
        // resource, url, class 三选一
        if (resource != null && url == null && mapperClass == null) {
          // 只配置了resource
          ErrorContext.instance().resource(resource);
          try(InputStream inputStream = Resources.getResourceAsStream(resource)) {
            // mapper映射文件都是通过XMLMapperBuilder解析
            XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, resource, configuration.getSqlFragments());
            mapperParser.parse();
          }
        } else if (resource == null && url != null && mapperClass == null) {
          // 只配置了url
          ErrorContext.instance().resource(url);
          try(InputStream inputStream = Resources.getUrlAsStream(url)){
            XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, url, configuration.getSqlFragments());
            mapperParser.parse();
          }
        } else if (resource == null && url == null && mapperClass != null) {
          // 只配置了mapperClass
          Class<?> mapperInterface = Resources.classForName(mapperClass);
          configuration.addMapper(mapperInterface);
        } else {
          // resource、url、mapperClass只能配置一个，否则报错
          throw new BuilderException("A mapper element may only specify a url, resource or class, but not more than one.");
        }
      }
    }
  }
}
```

通过 `resource` 和 `url` 配置的 `mapper` 需要进行一步解析操作：`mapperParser.parse()`,相关代码如下：

```java
public void parse() {
  if (!configuration.isResourceLoaded(resource)) {
    // 将mapper节点的子节点解析到configuration对象中
    configurationElement(parser.evalNode("/mapper"));
    configuration.addLoadedResource(resource);
    // 将mapper节点加到Confiruration配置中
    bindMapperForNamespace();
  }
  // 解析<resultMap>节点
  parsePendingResultMaps();
  // 解析<cache-ref>节点(二级缓存的知识点)
  parsePendingCacheRefs();
  // 解析Statement：具体的sql语句
  parsePendingStatements();
}

// 将mapper节点的子节点解析到configuration对象中
private void configurationElement(XNode context) {
  try {
    String namespace = context.getStringAttribute("namespace");
    if (namespace == null || namespace.isEmpty()) {
      throw new BuilderException("Mapper's namespace cannot be empty");
    }
    builderAssistant.setCurrentNamespace(namespace);
    cacheRefElement(context.evalNode("cache-ref"));
    cacheElement(context.evalNode("cache"));
    parameterMapElement(context.evalNodes("/mapper/parameterMap"));
    resultMapElements(context.evalNodes("/mapper/resultMap"));
    sqlElement(context.evalNodes("/mapper/sql"));
    buildStatementFromContext(context.evalNodes("select|insert|update|delete"));
  } catch (Exception e) {
    throw new BuilderException("Error parsing Mapper XML. The XML location is '" + resource + "'. Cause: " + e, e);
  }
}

// 将mapper节点加到Confiruration配置中
private void bindMapperForNamespace() {
  String namespace = builderAssistant.getCurrentNamespace();
  if (namespace != null) {
    Class<?> boundType = null;
    try {
      boundType = Resources.classForName(namespace);
    } catch (ClassNotFoundException e) {
      // ignore, bound type is not required
    }
    if (boundType != null && !configuration.hasMapper(boundType)) {
      // Spring may not know the real resource name so we set a flag
      // to prevent loading again this resource from the mapper interface
      // look at MapperAnnotationBuilder#loadXmlResource
      configuration.addLoadedResource("namespace:" + namespace);
      configuration.addMapper(boundType);
    }
  }
}
```

最后，将上述 `Mybatis` 的初始化过程用序列图细化：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642448059404e30aaaa55b5f3d554bf780ddfb8c41a.png)

## 配置解析过程详解

上面说了构建 `configuration` 对象的过程，但是其中详细的配置解析过程并没有深入，这里就来看一下。先重新看下解析 `Configuration` 节点相关的代码：

```java
public Configuration parse() {  
    if (parsed) {  
        throw new BuilderException("Each XMLConfigBuilder can only be used once.");  
    }  
    parsed = true;  
    //源码中没有这一句，只有 parseConfiguration(parser.evalNode("/configuration"));  
    //为了让读者看得更明晰，源码拆分为以下两句  
    XNode configurationNode = parser.evalNode("/configuration");  
    parseConfiguration(configurationNode);  
    return configuration;  
}  
/** 
 * 解析 "/configuration"节点下的子节点信息，然后将解析的结果设置到Configuration对象中 
 */  
private void parseConfiguration(XNode root) {  
    try {  
        //1.首先处理properties 节点     
        propertiesElement(root.evalNode("properties")); //issue #117 read properties first  
        //2.处理typeAliases  
        typeAliasesElement(root.evalNode("typeAliases"));  
        //3.处理插件  
        pluginElement(root.evalNode("plugins"));  
        //4.处理objectFactory  
        objectFactoryElement(root.evalNode("objectFactory"));  
        //5.objectWrapperFactory  
        objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));  
        //6.settings  
        settingsElement(root.evalNode("settings"));  
        //7.处理environments  
        environmentsElement(root.evalNode("environments")); // read it after objectFactory and objectWrapperFactory issue #631  
        //8.database  
        databaseIdProviderElement(root.evalNode("databaseIdProvider"));  
        //9.typeHandlers  
        typeHandlerElement(root.evalNode("typeHandlers"));  
        //10.mappers  
        mapperElement(root.evalNode("mappers"));  
    } catch (Exception e) {  
        throw new BuilderException("Error parsing SQL Mapper Configuration. Cause: " + e, e);  
    }  
} 
```

`configuration` 中包含10个子节点，分别是：`properties`、`typeAliases`、`plugins`、`objectFactory`、`objectWrapperFactory`、`settings`、`environments`、`databaseIdProvider`、`typeHandlers`、`mappers`。

### `properties`

```xml
<!-- 方法一： 从外部指定properties配置文件, 除了使用resource属性指定外，还可通过url属性指定url  
    <properties resource="dbConfig.properties"></properties> 
-->
<!-- 方法二： 直接配置为xml -->
<properties>
    <property name="driver" value="com.mysql.jdbc.Driver"/>
    <property name="url" value="jdbc:mysql://localhost:3306/test1"/>
    <property name="username" value="root"/>
    <property name="password" value="root"/>
</properties>
```

`properties` 节点可以进行两种配置，如上所述。

> 如果两种方法同时配置了，那么 **首先会加载文件中的xml配置，其次是加载外部指定的properties，最后加载Java Configuration的配置**。
> 
> 因为配置存放在 `Properties`，它继承自 `HashTable` 类，当依次将上述几种配置源 `put` 进去时，后加载的配置会覆盖先加载的配置。所以，最终应用配置时 **`Configuration` 配置优先级最高，其次是外部的 `properties` 配置文件，最后是当前 `xml` 中的配置**。

### `TypeHandler`

可以利用这个实现一个自定义的 **[`java` 类型 <-> `jdbc` 类型] 转换器**，如下示例，只需要实现 `BaseTypeHandler.class` 即可：

```java
// 此处如果不用注解指定jdbcType, 那么，就可以在配置文件中通过"jdbcType"属性指定， 同理， javaType 也可通过 @MappedTypes指定
@MappedJdbcTypes(JdbcType.VARCHAR)
@MappedTypes(String.class)
public class MySimpleTypeHandler extends BaseTypeHandler<String> {
    /*
        这个方法是在往数据库插入时，将java类型数据转换为jdbc数据的过程
     */
    public void setNonNullParameter(PreparedStatement ps, int i, String parameter, JdbcType jdbcType) throws SQLException {
        ps.setString(i, parameter + "@自定义Handler存储");
    }

    /*
        下面三个方法是将从数据库查询出的数据，转换为指定数据的处理过程
     */
    public String getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return rs.getString(columnName).split("@")[0] + "@自定义Handler返回";
    }

    public String getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return rs.getString(columnIndex).split("@")[0] + "@自定义Handler返回";
    }

    public String getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return cs.getString(columnIndex).split("@")[0] + "@自定义Handler返回";
    }
}
```

在 `mybatis` 中的配置如下，这里的配置是全局生效的：

```xml
<typeHandlers>
    <typeHandler handler="typehandler.MySimpleTypeHandler" />
</typeHandlers>
```

也可以在 `Mapper` 文件中加上对 `TypeHandler` 的配置，实现局部配置：

```xml
<resultMap id="BaseResultMap" type="Student">
    <!--typeHandler的使用，局部使用-->
    <result column="name" property="name" jdbcType="VARCHAR"  typeHandler="typehandler.MySimpleTypeHandler"/>
    <result column="id" property="id" jdbcType="INTEGER"/>
    <result column="age" property="age" jdbcType="TINYINT"/>
</resultMap>

<select id="getStudentById" parameterType="int" resultMap="BaseResultMap" useCache="true">
    SELECT id,name,age FROM student WHERE id = #{id}
</select>
```

详细介绍见 [Mybatis(四): 类型转换器模块详解](https://juejin.cn/post/7002875022654078989)  和 [TypeHandler - Java全栈知识体系](https://www.pdai.tech/md/framework/orm-mybatis/mybatis-y-config-load.html#%E5%85%83%E7%B4%A04%EF%BC%9Atypehandler)

关于 `typeHandler` 实现类有几个注意点还需要提一下：

> **通过类型处理器的泛型，`MyBatis` 可以得知该类型处理器处理的 `Java` 类型**，不过这种行为可以通过两种方法改变： 
> 
> - 在类型处理器的配置元素（`typeHandler` 元素）上增加一个 `javaType` 属性（比如：`javaType="String"`）
> - 在类型处理器的类上增加一个 `@MappedTypes` 注解指定与其关联的 `Java` 类型列表。 如果在  `javaType` 属性中也同时指定，则注解上的配置将被忽略。
> 
> 可以通过两种方式来指定关联的 `JDBC` 类型： 
> 
> - 在类型处理器的配置元素上增加一个 `jdbcType` 属性（比如：`jdbcType="VARCHAR"`）
> - 在类型处理器的类上增加一个 `@MappedJdbcTypes` 注解指定与其关联的 `JDBC` 类型列表。 如果在 `jdbcType` 属性中也同时指定，则注解上的配置将被忽略。

如果配置 `jdbcType` 属性或者 `@MappedJdbcTypes` 注解之后，`insert/update` 语句没有走 `typeHandler`。那么就检查一下 `insert/update` 语句中变更的属性值是否加上了 `jdbcType` 的配置，如果没有配置就不会生效，如下：

```xml
<insert id="addStudent" parameterType="entity.StudentEntity" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO student(name,age) VALUES(#{name, jdbcType=VARCHAR}, #{age})
</insert>
```

除了最基础的 `BaseTypeHandler` 外，`mybatis` 还默认实现了许多特定类型的 `TypeHandler`，如 `EnumTypeHandler`，这里有一个案例介绍如何实现一个自己的 `EnumTypeHandler`，优雅的实现枚举类型与 `sql` 的交互：[如何在MyBatis中优雅的使用枚举](https://segmentfault.com/a/1190000010755321)。

## 参考文章

[Mybatis详解 - Java全栈知识体系](https://www.pdai.tech/md/framework/orm-mybatis/mybatis-overview.html)

[Mybatis(四): 类型转换器模块详解](https://juejin.cn/post/7002875022654078989)

[如何在MyBatis中优雅的使用枚举](https://segmentfault.com/a/1190000010755321)
