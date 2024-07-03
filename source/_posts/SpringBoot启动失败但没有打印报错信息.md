---
title: SpringBoot启动失败但没有打印报错信息
abbrlink: 61716
date: 2024-06-25 11:27:39
tags:
  - SpringBoot
  - 后端技术
categories: 后端技术
---
在写一个 `SpringBoot` 引入 `Mybatis Plus` 的 `Demo`，在启动服务时出现了问题，服务启动失败并且没有打印报错信息。

<!--more-->

### 解决问题

控制台打印的信息如下

![17199772978983e77ce81042b9adf3fb612eec0fd06c7.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17199772978983e77ce81042b9adf3fb612eec0fd06c7.png)

搜寻解决方案，看到说可以在启动类上捕获异常，如下：

```java
try {
    SpringApplication.run(MybatisPlusDemoApplication.class, args);
} catch (Exception e) {
    throw new RuntimeException(e);
}
```

这样做并没有效果，然后以为是引入的 `SpringBoot` 版本与 `Mybatis-Plus` 版本不兼容导致的，尝试降低 `SpringBoot` 的版本，还是启动不起来。

在 [springboot项目启动不报错，但一启动就断开连接问题排查实录](https://cloud.tencent.com/developer/article/1553855) 这篇文章中找到了解决办法，在 `pom.xml` 添加 `spring-boot-starter-web` 依赖，之后就能成功启动了。

### 问题分析

这个项目不是 `web` 项目，因此我想只需要引入 `spring-boot-starter` 依赖就可以了，因为我想的是 `jar` 的依赖越少越好，只需要依赖必要的包，非必要的 `jar` 没必要引入，但实际是只加这个依赖项目启动不起来。那么为何加了 `spring-boot-starter-web` 依赖后，项目就能启动成功了？

`SpringBoot` 在启动时会进行一个 **`Web` 类型推断** 操作，我们看下 `SpringApplication` 的构造函数：

```java
public SpringApplication(Class<?>... primarySources) {
   this(null, primarySources);
}
public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
   this.resourceLoader = resourceLoader;
   Assert.notNull(primarySources, "PrimarySources must not be null");
   this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
   // Web类型推断：判断当前应用程序的类型是REACTIVE还是SERVLET，它们在Spring中分别对应spring-webflux和spring-webmvc
   this.webApplicationType = WebApplicationType.deduceFromClasspath();
   setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
   setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
   this.mainApplicationClass = deduceMainApplicationClass();
}
```

`Web` 类型推断的逻辑在 `WebApplicationType.deduceFromClasspath()` 中进行

```java
/**
 * 非Web应用，不需要启动内置Web服务器
 * The application should not run as a web application and should not start an
 * embedded web server.
 */
NONE,

/**
 * 基于Servlet的Web应用，需要启动内置Servlet Web服务器
 * The application should run as a servlet-based web application and should start an
 * embedded servlet web server.
 */
SERVLET,

/**
 * 基于Reactive的Web应用，需要启动内置Reactive Web服务器
 * The application should run as a reactive web application and should start an
 * embedded reactive web server.
 */
REACTIVE;

private static final String[] SERVLET_INDICATOR_CLASSES = { "jakarta.servlet.Servlet",
            "org.springframework.web.context.ConfigurableWebApplicationContext" };

private static final String WEBMVC_INDICATOR_CLASS = "org.springframework.web.servlet.DispatcherServlet";

private static final String WEBFLUX_INDICATOR_CLASS = "org.springframework.web.reactive.DispatcherHandler";

private static final String JERSEY_INDICATOR_CLASS = "org.glassfish.jersey.servlet.ServletContainer";

static WebApplicationType deduceFromClasspath() {
  // 判断能否从类加载器中获取到org.springframework.web.reactive.DispatcherHandler，这个类在spring-webflux包下，如果存在则表示当前项目是一个webflux项目
  // 反之，如果能从类加载器中获取到org.springframework.web.servlet.DispatcherServlet，这个类在spring-webmvc包下，则表示当前项目是一个webmvc项目
    if (ClassUtils.isPresent(WEBFLUX_INDICATOR_CLASS, null) && !ClassUtils.isPresent(WEBMVC_INDICATOR_CLASS, null)
            && !ClassUtils.isPresent(JERSEY_INDICATOR_CLASS, null)) {
        return WebApplicationType.REACTIVE;
    }
    for (String className : SERVLET_INDICATOR_CLASSES) {
        if (!ClassUtils.isPresent(className, null)) {
            return WebApplicationType.NONE;
        }
    }
    return WebApplicationType.SERVLET;
}
```

可以看到，`Spring Boot` 支持3种类型的服务：

1. `None`。非 `Web` 应用，不需要启动内置 `Web` 服务器。
2. `Servlet`。基于 `Servlet `的 `Web` 应用，需要启动内置 `Servlet Web` 服务器。
3. `Reactive`。基于 `Reactive` 的 `Web` 应用，需要启动内置 `Reactive Web` 服务器。

可以通过 `Spring Initializr` 网站来尝试下构建这三种类型的项目：[https://start.spring.io](https://start.spring.io/)

1. `None Web`
   
   ![1719977328897b87a1de7c1cb30ce119a47e991becb52.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719977328897b87a1de7c1cb30ce119a47e991becb52.png)
   ```xml
   <dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter</artifactId>
   </dependency>
   ```
2. `Servlet Web`
   
   ![17199773778979d283cbd977bbc6cfebf2c8fd1b92b12.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17199773778979d283cbd977bbc6cfebf2c8fd1b92b12.png)
   ```xml
   <dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-web</artifactId>
   </dependency>
   ```
3. `Reactive Web`
   
   ![17199773878973ec80a41868917464109e038c2a54348.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17199773878973ec80a41868917464109e038c2a54348.png)
   ```xml
   <dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-webflux</artifactId>
   </dependency>
   ```

回到上面的问题，项目启动失败并且没有打印错误日志，就是因为启动了一个 `None Web` 服务（只引入了 `spring-boot-starter` 依赖）。**在 `None Web` 类型下，应用启动运行后就自动关闭了，并不会启动内置的 `web` 服务器，也不会监听任何端口。**

引入 `spring-boot-starter-web` 依赖后，`Spring Boot` 就会启动一个 `Servlet Web` 类型的服务，因此就正常了。

### 补充：`spring-boot-starter-web` 包含的依赖项

我们再深入看一下 `spring-boot-starter-web` 引入了哪些依赖：

```xml
<dependencies>
  <!--Spring Boot的基础依赖，包括 Spring 核心库、日志记录-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
    <version>3.3.1</version>
    <scope>compile</scope>
  </dependency>
  <!--SpringBoot默认引入的JSON库：Jackson-->
  <!--Spring MVC中处理请求时入参和返回结果需要借助json模块进行序列化和反序列化-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-json</artifactId>
    <version>3.3.1</version>
    <scope>compile</scope>
  </dependency>
  <!--引入嵌入式 Tomcat 服务器，便于开发和部署 Servlet 应用-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-tomcat</artifactId>
    <version>3.3.1</version>
    <scope>compile</scope>
  </dependency>
  <!--提供核心 Web 功能，包括 RESTful Web 服务的支持-->
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
    <version>6.1.10</version>
    <scope>compile</scope>
  </dependency>
  <!--提供 Spring MVC 的实现，支持基于注解的控制器、视图解析、数据绑定等功能-->
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
    <version>6.1.10</version>
    <scope>compile</scope>
  </dependency>
</dependencies>
```

 下面是 `spring-boot-starter-web` 依赖树的一个简化示例，展示了主要依赖及其子依赖：

```xml
spring-boot-starter-web
├── spring-boot-starter
│   ├── spring-core
│   ├── spring-context
│   ├── spring-aop
│   ├── slf4j-api
│   └── logback-classic
├── spring-boot-starter-json
│   ├── jackson-databind
│   ├── jackson-core
│   ├── jackson-annotations
│   ├── jackson-datatype-jdk8
│   └── jackson-datatype-jsr310
├── spring-boot-starter-tomcat
│   ├── tomcat-embed-core
│   ├── tomcat-embed-el
│   └── tomcat-embed-websocket
├── spring-web
│   ├── spring-beans
│   ├── spring-web
│   └── spring-webmvc
└── spring-webmvc
    ├── spring-beans
    ├── spring-context
    ├── spring-core
    └── spring-web
```

作为对比，我们再看下 `spring-boot-starter-webflux` 引入的依赖项

```xml
<dependencies>
  <!--Spring Boot 的基础依赖，包括 Spring 核心库、日志记录等-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
    <version>3.3.1</version>
    <scope>compile</scope>
  </dependency>
  <!--JSON处理类：Jackson库-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-json</artifactId>
    <version>3.3.1</version>
    <scope>compile</scope>
  </dependency>
  <!--引入 Reactor Netty 作为嵌入式反应式 Web 服务器-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-reactor-netty</artifactId>
    <version>3.3.1</version>
    <scope>compile</scope>
  </dependency>
  <!--提供核心 Web 功能，包括 RESTful Web 服务的支持-->
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
    <version>6.1.10</version>
    <scope>compile</scope>
  </dependency>
  <!--提供 Spring WebFlux 的实现，支持反应式 Web 编程模型-->
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webflux</artifactId>
    <version>6.1.10</version>
    <scope>compile</scope>
  </dependency>
</dependencies>
```

下面是 `spring-boot-starter-webflux` 的依赖树

```xml
spring-boot-starter-webflux
├── spring-boot-starter
│   ├── spring-core
│   ├── spring-context
│   ├── spring-aop
│   ├── slf4j-api
│   └── logback-classic
├── spring-boot-starter-json
│   ├── jackson-databind
│   ├── jackson-core
│   ├── jackson-annotations
│   ├── jackson-datatype-jdk8
│   └── jackson-datatype-jsr310
├── spring-boot-starter-reactor-netty
│   ├── reactor-netty-core
│   └── reactor-netty-http
├── spring-web
│   ├── spring-beans
│   ├── spring-context
│   └── spring-web
└── spring-webflux
    ├── spring-beans
    ├── spring-context
    ├── reactor-core
    ├── reactor-netty
    ├── spring-web
    └── spring-webflux
```

### 总结

本文给出了 [SpringBoot启动失败但没有打印报错信息] 问题的处理办法，通过分析源码得知问题是由 `Spring Boot` 的 `Web` 类型推断引起的，由于没有引入 `spring-boot-starter-web` 依赖，导致启动了一个 `none web` 服务。

之后又了解了 `servlet web` 对应的 `spring-boot-starter-web` 和 `reactive web` 对应的 `spring-boot-starter-webflux` 包含的依赖项。

对于这些日常开发中经常使用的依赖，它们引入了哪些依赖最好还是要做到心里有数，这样出现问题也能更好的定位。

### 参考文章

[springboot项目启动不报错，但一启动就断开连接问题排查实录](https://cloud.tencent.com/developer/article/1553855)

[WebApplicationType](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/WebApplicationType.html)

[SpringBoot源码学习(一)---启动流程](https://jokerbyrant.github.io/2020-06-07/52948/)
