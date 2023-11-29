---
title: >-
  SpringBoot报错NoSuchBeanDefinitionException：No qualifying bean of type xxx
  available
tags: SpringBoot
categories: 后端技术
abbrlink: 38281
date: 2023-11-01 13:47:28
---

## 问题描述

在 `SpringBoot` 项目启动时，出现了报错：`org.springframework.beans.factory.NoSuchBeanDefinitionException: No qualifying bean of type 'xxx' available`

<!-- more -->

![1701236494702313e534592f784a1da1f914c973e2a00.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1701236494702313e534592f784a1da1f914c973e2a00.png)

定位到问题是 **目标类与启动类不在同一级目录下** 导致的，如下：

![170123650370059f5f9ce1932ba1d75a49d7cf0ed9d07.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/170123650370059f5f9ce1932ba1d75a49d7cf0ed9d07.png)

## 原因定位

`SpringBoot` 的启动类中需要添加一个注解：`SpringBootApplication`，在这个注解中继承了另外一些注解，如下：

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = {
        @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
        @Filter(type = FilterType.CUSTOM,
                classes = AutoConfigurationExcludeFilter.class) })
public @interface SpringBootApplication {}
```

注意其中的 `ComponentScan`，这个注解启用时，`SpringBoot` 会扫描所有定义的 `Bean`，扫描的位置由 `ComponentScan` 注解中定义的 `basePackages` 属性指定，看下 `ComponentScan` 注解的定义，附上翻译：

> Configures component scanning directives for use with @Configuration classes. Provides support parallel with Spring XML's <context:component-scan> element.
Either basePackageClasses or basePackages (or its alias value) may be specified to define specific packages to scan. If specific packages are not defined, scanning will occur from the package of the class that declares this annotation.
Note that the <context:component-scan> element has an annotation-config attribute; however, this annotation does not. This is because in almost all cases when using @ComponentScan, default annotation config processing (e.g. processing @Autowired and friends) is assumed. Furthermore, when using AnnotationConfigApplicationContext, annotation config processors are always registered, meaning that any attempt to disable them at the @ComponentScan level would be ignored.
> 
> 配置用于@Configuration类的组件扫描指令。提供与Spring XML的<context:component-scan>元素相同的支持。
可以指定basePackageClasses或basePackages（或其别名value）来定义要扫描的特定包。如果未定义特定的包，将从声明此注解的类所在的包进行扫描。
请注意，<context:component-scan>元素具有annotation-config属性；但是，此注解没有。这是因为在使用@ComponentScan时，几乎所有情况下都假定使用默认的注解配置处理（例如处理@Autowired和其它注解）。此外，当使用AnnotationConfigApplicationContext时，注解配置处理器总是被注册的，这意味着在@ComponentScan级别上禁用它们的任何尝试都将被忽略。

注意其中描述的：**可以指定 `basePackageClasses` 或 `basePackages`（或其别名 `value`）来定义要扫描的特定包。如果未定义特定的包，将从声明此注解的类所在的包进行扫描。**

而在我的项目中，并没有额外指定 `ComponentScan` 注解，因此默认使用的是 `SpringBootApplication` 注解中的 `ComponentScan`，也就是默认扫描的是启动类所在的包中的 `Bean`。对 `ComponentScanAnnotationParser$parse()` 进行 `Debug`，看下 `ComponentScan` 的注解是如何生效的：

![170123651470005fcac43d796a1efafcfe527caeb8364.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/170123651470005fcac43d796a1efafcfe527caeb8364.png)

## 处理办法

最简单的处理办法，将目标类移动到与启动类同一级目录下即可，本例中就是将 `InvalidManager` 移动到 `application` 包下即可。不过最好还是将项目启动类置于顶层目录下，这样项目内的包都能扫描到。

![17012365297001e64c0d7023d2aea0829067b8663d6a5.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17012365297001e64c0d7023d2aea0829067b8663d6a5.png)

如果不想移动目标类，那么就需要我们手动指定 `ComponentScan` 的扫描包了，如下：

```java
@SpringBootApplication
@ComponentScan("com.sxh.manager")
public class EasyIMClientApplication {}
```

再来对 `ComponentScanAnnotationParser$parse()` 进行 `Debug`，可以看到这次扫描的是 `ComponentScan` 注解中定义的包：

![1701236537700e50c71dab3833f80c9c8ef0c99df06d6.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1701236537700e50c71dab3833f80c9c8ef0c99df06d6.png)

这里有个坑需要注意，按上面的方法处理后，**原先项目启动类所在的包将不会被扫描！**
![1701236545700e92e935916304ab8ba2db5320c0cacbf.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1701236545700e92e935916304ab8ba2db5320c0cacbf.png)

也就是说，按上面的方法处理后，启动类所在的包将不会被扫描：

![17012365587048fb921d821c140d9a67cd9abf1abc4ad.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17012365587048fb921d821c140d9a67cd9abf1abc4ad.png)

针对这个问题，我们可以使用 `ComponentScans` 注解来解决，如下：

```java
@SpringBootApplication
@ComponentScans(@ComponentScan("com.sxh.manager"))
public class EasyIMClientApplication {}
```

看下 `ComponentScans` 注解的定义：

> Container annotation that aggregates several ComponentScan annotations.
Can be used natively, declaring several nested ComponentScan annotations. Can also be used in conjunction with Java 8's support for repeatable annotations, where ComponentScan can simply be declared several times on the same method, implicitly generating this container annotation.
> 
> 聚合多个ComponentScan注解的容器注解。
可以本地使用，声明多个嵌套的ComponentScan注解。也可以与Java 8对可重复注解的支持一起使用，在同一个方法上简单地声明多次ComponentScan注解，隐式生成此容器注解。

相较于 `ComponentScan`，`ComponentScans` 支持多个 `ComponentScan` 的指定，`SpringBootApplication` 定义的 `ComponentScan` 将继续生效，也就是项目启动类所在的包仍然会被扫描到。在上面的例子中，`SpringBoot` 启动后，将会扫描 `com.sxh.manager` 和 `com.sxh.application` 两个包下的 `Bean`。

## 参考文章

[Spring Bean 定义常见错误](https://learn.lianglianglee.com/%e4%b8%93%e6%a0%8f/Spring%e7%bc%96%e7%a8%8b%e5%b8%b8%e8%a7%81%e9%94%99%e8%af%af50%e4%be%8b/01%20Spring%20Bean%20%e5%ae%9a%e4%b9%89%e5%b8%b8%e8%a7%81%e9%94%99%e8%af%af.md)
