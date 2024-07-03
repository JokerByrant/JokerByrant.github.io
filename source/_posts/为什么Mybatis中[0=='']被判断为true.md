---
title: 为什么Mybatis中 [0==''] 被判断为true
abbrlink: 35743
date: 2024-04-08 11:58:07
tags:
  - Mybatis
  - 后端技术
categories: 后端技术
---
在使用 `Mybatis` 过程中碰到了一个问题，当使用 `<if test="sex != null and sex != ''">` 判空操作时，如果 `sex` 是数值类型的参数，并且值为 `0` 时，该判断条件的值为 `false`。

搜寻相关博客，得知出现该问题的原因是：`Mybatis` 语法中 `0` 是等于空字符串的

<!--more-->

### 源码分析

我们从源码角度看下为什么会这样，直接看 `XMLScriptBuilder.java` 这个类，在这个类内部，定义了一个 `NodeHandler` 接口：

```java
private interface NodeHandler {
  void handleNode(XNode nodeToHandle, List<SqlNode> targetContents);
}
```

在 `Mybatis` 语句中存在的 `<if>`、`<where>` 等标签是通过各个 `NodeHandler`实现类来完成解析的，如下：

![171998287627065584bb8e5f6d0f90ea8a5d07656e563.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/171998287627065584bb8e5f6d0f90ea8a5d07656e563.png)

如下，在类创建时，标签和对应的 `NodeHandler` 会被放入一个 `Map` 中 

```java
public XMLScriptBuilder(Configuration configuration, XNode context, Class<?> parameterType) {
  super(configuration);
  this.context = context;
  this.parameterType = parameterType;
  initNodeHandlerMap();
}
  
private void initNodeHandlerMap() {
  nodeHandlerMap.put("trim", new TrimHandler());
  nodeHandlerMap.put("where", new WhereHandler());
  nodeHandlerMap.put("set", new SetHandler());
  nodeHandlerMap.put("foreach", new ForEachHandler());
  nodeHandlerMap.put("if", new IfHandler());
  nodeHandlerMap.put("choose", new ChooseHandler());
  nodeHandlerMap.put("when", new IfHandler());
  nodeHandlerMap.put("otherwise", new OtherwiseHandler());
  nodeHandlerMap.put("bind", new BindHandler());
}
```

之后我们看下解析 `Sql` 的步骤：

```java
public SqlSource parseScriptNode() {
  // 解析动态标签
  MixedSqlNode rootSqlNode = parseDynamicTags(context);
  // 构造sqlSource，sqlSource会构建最终的Sql语句，其中#{}会在这里被解析
  SqlSource sqlSource = null;
  if (isDynamic) {
    // 动态Sql处理
    sqlSource = new DynamicSqlSource(configuration, rootSqlNode);
  } else {
    // 静态Sql处理
    sqlSource = new RawSqlSource(configuration, rootSqlNode, parameterType);
  }
  return sqlSource;
}
  
protected MixedSqlNode parseDynamicTags(XNode node) {
  List<SqlNode> contents = new ArrayList<SqlNode>();
  // 获取所有的标签
  NodeList children = node.getNode().getChildNodes();
  for (int i = 0; i < children.getLength(); i++) {
    XNode child = node.newXNode(children.item(i));
     // 普通sql处理
    if (child.getNode().getNodeType() == Node.CDATA_SECTION_NODE || child.getNode().getNodeType() == Node.TEXT_NODE) {
      String data = child.getStringBody("");
      // 判断语句中是否包含${}，${}的内容需要替换
      TextSqlNode textSqlNode = new TextSqlNode(data);
      if (textSqlNode.isDynamic()) {
        contents.add(textSqlNode);
        isDynamic = true;
      } else {
        contents.add(new StaticTextSqlNode(data));
      }
    } else if (child.getNode().getNodeType() == Node.ELEMENT_NODE) {// issue #628
      // 动态Sql处理
      String nodeName = child.getNode().getNodeName();
      // 根据nodeName获取对应的NodeHandler
      NodeHandler handler = nodeHandlerMap.get(nodeName);
      if (handler == null) {
        throw new BuilderException("Unknown element <" + nodeName + "> in SQL statement.");
      }
      // 对动态sql进行解析
      handler.handleNode(child, contents);
      isDynamic = true;
    }
  }
  return new MixedSqlNode(contents);
}
```

其中每种 `NodeHandler` 的处理方式大致类似：先将动态标签的一些属性解析出来，然后根据这些属性构造一个 `SqlNode`，之后在 `SqlNode` 中处理具体逻辑。

比如我们要找的 `<if>` 标签，它对应的 `NodeHanler` 是 `IfHandler`：

```java
private class IfHandler implements NodeHandler {
  public IfHandler() {
    // Prevent Synthetic Access
  }

  @Override
  public void handleNode(XNode nodeToHandle, List<SqlNode> targetContents) {
    // 解析<if>标签
    MixedSqlNode mixedSqlNode = parseDynamicTags(nodeToHandle);
    // 获取test属性的值
    String test = nodeToHandle.getStringAttribute("test");
    // 相关属性构造成一个SqlNode
    IfSqlNode ifSqlNode = new IfSqlNode(mixedSqlNode, test);
    targetContents.add(ifSqlNode);
  }
}
```

看下具体的处理逻辑，在 `IfSqlNode` 中：

```java
public class IfSqlNode implements SqlNode {
  // <if>标签解析处理类
  private final ExpressionEvaluator evaluator;
  // test属性值
  private final String test;
  // 解析出的<if>标签信息
  private final SqlNode contents;

  public IfSqlNode(SqlNode contents, String test) {
    this.test = test;
    this.contents = contents;
    this.evaluator = new ExpressionEvaluator();
  }

  @Override
  public boolean apply(DynamicContext context) {
    // 逻辑判断在这里进行
    if (evaluator.evaluateBoolean(test, context.getBindings())) {
      contents.apply(context);
      return true;
    }
    return false;
  }
}
```

`ExpressionEvaluator` 使用了 `ognl` 表达式来获取 `test` 中逻辑判断的结果：

```java
public boolean evaluateBoolean(String expression, Object parameterObject) {
  Object value = OgnlCache.getValue(expression, parameterObject);
  if (value instanceof Boolean) {
    return (Boolean) value;
  }
  if (value instanceof Number) {
    return new BigDecimal(String.valueOf(value)).compareTo(BigDecimal.ZERO) != 0;
  }
  return value != null;
}
```

到这里，我们可以得出结论：**`Mybatis` 使用 `Ognl` 表达式来获取 `<if>` 标签中逻辑判断的值**。

我们来验证一下：

```xml
<dependency>
    <groupId>ognl</groupId>
    <artifactId>ognl</artifactId>
    <version>3.4.3</version>
</dependency>
```

```java
Map<String, Object> objectMap = new HashMap<>();
objectMap.put("sex", 0);
Object value = Ognl.getValue("sex == ''", objectMap);
System.out.println(value);
```

最终输出结果为 `true`。

### 处理办法

`ognl` 表达式输出的这个结果实在与我们的常规认知不符，要处理这个问题只能顺应它或改变它。

我目前采用的是第一种：**`Mybatis` 中的 `<if>` 标签，对数值类型只做是否为 `null` 的判断，移除所有判断是否为空字符的逻辑**。

也可以选择改变它，就是修改它的源码，但是个人认为这一块儿的风险比较大，因此就没有实践，可以参考这篇文章中的处理：[Mybatis的if标签判断空字符串 == 0](https://blog.51cto.com/u_13270529/5962025)

### 参考文档

[Mybatis的if标签判断空字符串 == 0](https://blog.51cto.com/u_13270529/5962025)

[MyBatis if 标签的坑，居然被我踩到了](https://segmentfault.com/a/1190000038420877)

[Mybatis-0值问题](https://whb1990.github.io/posts/9dd16667)

[MyBatis详解 - 动态SQL使用与原理](https://www.pdai.tech/md/framework/orm-mybatis/mybatis-y-dynamic-sql.html)

[mybatis源码解读(五)：XMLScriptBuilder详解-各种SQLNODE](https://blog.csdn.net/qq_41063182/article/details/106865959)
