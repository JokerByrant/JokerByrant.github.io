---
title: 日志框架和Spring日志适配
abbrlink: 24403
date: 2024-07-29 13:39:28
tags: 日志
categories: 后端技术
---
公司有一个基于 `spring-cloud-netflix-zuul` 框架开发的网关项目，最近发现了一个问题：**异常日志只输出到了 `Console` 控制台，没有输出到日志文件中。**

<!--more-->

日志输出的位置是在 `SendErrorFilter` 类中，如下：

```java
log.warn("Error during filtering", exception.getThrowable());
```

这个类使用了 `JCL`(`apache commons logging`) 日志框架进行日志输出操作，而我们项目中统一配置的日志框架是 `slf4j + logback`，猜测是这个原因导致的？对这几种日志框架的了解不并多，带着上面的问题，深入了解一下。

### 常用的日志框架

首先了解一下 `slf4j` 和 `logback` 的区别：

1. **`slf4j`。**
   
   `SLF4J` 是一个 **日志门面**（`Facade`），它提供了一套统一的日志接口，不直接处理日志的记录。通过使用 `SLF4J`，可以实现与具体的日志框架解耦（如 `Logback`、`Log4j`、`JUL` ），使得代码只依赖于 `SLF4J` 的 `API`。这意味着可以在不改变应用程序代码的情况下，切换日志框架。
2. **`Logback`。**
   
   `Logback` 是一个 **具体的日志实现框架**，是 `SLF4J` 的原生实现之一

那么为什么项目中都是 **`SLF4J` 和 `Logback` 配合使用**，而不是单独使用其中一个？首先，`slf4j` 只是一个 **日志门面**，不包含日志的具体实现，因此无法单独使用。`Logback` 是 **日志实现框架**，可以单独使用。但是实际开发中，还是推荐两者配合使用，因为它们配合使用包含如下几个优点：

- **抽象与实现分离**：`SLF4J` 提供抽象接口，`Logback` 提供具体实现。通过这种分离，可以根据需求轻松切换不同的日志实现，而不需要修改代码中的日志调用部分。
- **灵活性**：在使用 `SLF4J` 时，可以在开发和生产环境中使用不同的日志实现。例如，开发时使用 `Logback`，生产环境可以切换到一个更合适的日志框架。
- **兼容性**：许多第三方库使用 `SLF4J` 作为日志接口，通过配合使用 `Logback`，可以确保所有日志都能统一管理和输出，而不必担心日志输出的多样性或冗余性。

> 注：这里推荐阅读 [JCL、SLF4J、Log4J、Log4J2、LogBack和JUL之间的关系，你搞清楚了吗？ ](https://www.cnblogs.com/54chensongxia/p/12321446.html)

除了这两种日志框架外，还有其他几种常用的日志框架，下面就按照 **日志门面框架** 和 **日志具体实现框架** 将他们区分开来：

1. **常用志门面框架**
   
   `SLF4J`：
   
   `JCL`(`Apache Commons Logging`)：`Apache` 软件基金会开发的框架
2. **常用日志具体实现框架**
   
   `Logback`：`Log4j` 的继任者
   
   `Log4j`：最早的 `Java` 日志框架之一
   
   `Log4j2`：`Log4j` 的新版，解决了 `Log4j` 的一些性能和设计问题
   
   `JUL`(`java.util.logging`)：`java` 标准库中的日志框架，`Oracle` 开发

### `JCL` 打印的日志为何没有写入到日志中

看完上面日志框架的概念后，我们回到最初的问题：**为何 `SendErrorFilter` 类输出的日志没有写入到日志文件中？**

在 `SendErrorFilter` 类中，使用了 `JCL` 进行日志输出：

```java
log.warn("Error during filtering", exception.getThrowable());
```

这行日志在 `Console` 控制台打印出来了，但是并没有写入到日志文件中。

在网关项目中，我添加了一个自定义异常过滤类 `ErrorFilter`，其中使用了 `slf4j` 进行日志输出，这里的日志能够正常输出到日志文件中：

```java
log.error("服务 [{}] 不可用", RequestContext.getCurrentContext().get("serviceId").toString());
```

`Logback` 的日志输出是在 `RollingFileAppender$subAppend()` 中进行的，在这里打了一个断点，发现 `SendErrorFilter` 中的日志打印并没有触发断点。

搜寻了相关问题的处理办法，网上给出的解释大多是因为 **使用了两套日志门面**，项目默认使用的日志框架是 `slf4j + logback`，而引入的 `spring-cloud-netflix-zuul` 使用的 `JCL` 框架。在项目中增加 `jcl-over-slf4j` 依赖即可解决问题：

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>jcl-over-slf4j</artifactId>
    <version>1.7.36</version>
</dependency>
```

这里先说下 `jcl-over-slf4j` 依赖的作用。`SendErrorFilter` 中的 `log` 是 `org.apache.commons.logging.Log` 实例(`JCL`)，引入 `jcl-over-slf4j` 后，`log` 实例在初始化时，最终返回的会是一个 `slf4j` 兼容的 `Logger` 实例，之后日志就会按照配置的 `slf4j+logback` 进行输出。

但是加上这个依赖后，问题仍然没有解决，因此只能尝试一步步对代码进行定位。

移除 `jcl-over-slf4j` 依赖，对 `SendErrorFilter` 打印日志的逻辑进行了 `Debug`，如下：

![picture 0](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/3ef9670f58116e9eddbb04f00151c14e24a69b1aa299259bfc1d50192dac7111.png)  

定位到 `spring-jcl` 包下的 `LogAdapter` 类，找到 `Slf4jLocationAwareLog` 子类，如下：

![picture 1](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/ffd958d56b217397b0f857b4c9f862716c69d8bca338f55ef31ab79eae1756f1.png)  

这里的 `Logger` 类是 `logback-classic` 包下的，也就是说 `SendErrorFilter` 类中通过 [**`JCL` 日志门面**] 输出的日志，最终是在 [**`Logback` 日志实现框架**] 中完成的输出。上面 `jcl-over-slf4j` 要做的工作正是这个，而 `LogAdapter` 类已经帮忙完成了这个工作。我们重点看下 `LogAdapter` 类：

```java
final class LogAdapter {
	private static final String LOG4J_SPI = "org.apache.logging.log4j.spi.ExtendedLogger";
	private static final String LOG4J_SLF4J_PROVIDER = "org.apache.logging.slf4j.SLF4JProvider";
	private static final String SLF4J_SPI = "org.slf4j.spi.LocationAwareLogger";
	private static final String SLF4J_API = "org.slf4j.Logger";
  // 记录当前需要加载的日志框架
	private static final LogApi logApi;
  // 检测并记录类路径中包含的日志系统
	static {
	  // 包含log4j
		if (isPresent(LOG4J_SPI)) {
		  // 判断是否有slf4j的桥接包，有的话加载slf4j拓展接口(LocationAwareLogger)
			if (isPresent(LOG4J_SLF4J_PROVIDER) && isPresent(SLF4J_SPI)) {
				logApi = LogApi.SLF4J_LAL;
			}
			// 没有slf4j桥接包，则加载log4j
			else {
				logApi = LogApi.LOG4J;
			}
		}
		// 包含slf4j拓展接口
		else if (isPresent(SLF4J_SPI)) {
			logApi = LogApi.SLF4J_LAL;
		}
		// 包含slf4j标准接口
		else if (isPresent(SLF4J_API)) {
			logApi = LogApi.SLF4J;
		}
		// 如果上面几个都不存在，默认加载java.util.logging日志系统
		else {
			logApi = LogApi.JUL;
		}
	}

	private LogAdapter() {
	}

  // 根据已经检测出的日志框架，使用对应的内部类创建
	public static Log createLog(String name) {
		switch (logApi) {
			case LOG4J:
				return Log4jAdapter.createLog(name);
			case SLF4J_LAL:
				return Slf4jAdapter.createLocationAwareLog(name);
			case SLF4J:
				return Slf4jAdapter.createLog(name);
			default:
				return JavaUtilAdapter.createLog(name);
		}
	}
	
  // 判断对应的类名是否被加载到了JVM
	private static boolean isPresent(String className) {
		try {
			Class.forName(className, false, LogAdapter.class.getClassLoader());
			return true;
		}
		catch (ClassNotFoundException ex) {
			return false;
		}
	}

	private enum LogApi {LOG4J, SLF4J_LAL, SLF4J, JUL}
}
```

`LogAdapter` 可以自动检测当前的类路径中引入的日志框架，并选择适当的日志实现进行加载和使用。`LogAdapter` 中定义了这么几种情况：

- 有 `log4j` 的依赖，并且桥接到了 `slf4j`，使用 `slf4j`；没有桥接到 `slf4j`，使用 `log4j`
- 没有 `log4j` 的依赖，检测是否包含 `slf4j` 拓展接口(`LocationAwareLogger`)，之后检测是否包含 `slf4j` 标准接口。
- 不满足以上情况，使用 `JUL`。

我们回过头来再来看下 `SendErrorFilter` 中创建日实例部分的代码：

```java
private static final Log log = LogFactory.getLog(SendErrorFilter.class);
```

看下 `LogFactory$getLog()` 方法：

```java
public static Log getLog(Class<?> clazz) {
	return getLog(clazz.getName());
}

public static Log getLog(String name) {
	return LogAdapter.createLog(name);
}
```

可以看到，日志框架实例最终是在 `LogAdapter` 中完成创建的，并且项目中包含 `slf4j` 依赖，因此最终加载的日志系统是 `slf4j`，并且对应的 `log` 实例是通过 `slf4j` 的拓展接口 `LocationAwareLogger` 完成初始化的。

了解了日志加载的具体的原理后，可以定位到上面的日志没有打印到文件中与项目 **使用了两套日志门面无关**。即使项目中包含多套日志门面，通过 `spring-jcl` 包下的 `LogAdapter` 类，也可以完成日志系统的适配工作。

因此最终问题产生的原因，应该还是是与 `logback` 配置有关，对日志配置进行 `Review`，发现了如下配置：

```xml
<!--代码块1-->
<logger name="com.xxx" level="info">
    <appender-ref ref="syslog" />
</logger>
<!--代码块2-->
<logger name="com.xxx.mapper" level="error"/>
<!--代码块3-->
<root level="info">
    <appender-ref ref="STDOUT" />
</root>
```

解释一下上面的几行配置：

- 代码块1：定义一个 `Logger`，它可以捕获 `com.xxx` 包及其子包下的所有类的 `info` 级别及更高级别的日志消息，并发送到一个名为 `syslog` 的 `Appender` 中处理。
- 代码块2：定义一个 `Logger`，它可以捕获 `com.xxx.mapper` 包及其子包下所有类的 `error` 级别及更高级别的日志消息。
- 代码块3：定义了根 `Logger`，根 `Logger` 是一个特殊的 `Logger`，它会捕获所有未被其他 `Logger` 定义的 `info` 级别及以上的日志消息，并发送到名为 `STDOUT` 的 `Appender` 中处理。(*注：每个日志记录请求首先会传递到根 `Logger`*）

名为 `syslog` 的 `Appender` 配置如下，作用是 **将日志消息输出到指定的日志文件中**：

```xml
<springProperty name="LOG_HOME" scope="context" source="logbackPath" defaultValue="c:/log" />
<springProperty name="LOG_NAME" scope="context" source="logbackName" defaultValue="zuul-balance" />
<appender name="syslog" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <File>${LOG_HOME}/${LOG_NAME}.log</File>
    <!-- rollingPolicy:当发生滚动时，决定 RollingFileAppender 的行为，涉及文件移动和重命名。 -->
    <!-- SizeAndTimeBasedRollingPolicy： 根据大小和时间来制定滚动策略，既负责滚动也负责出发滚动 -->
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <!-- 活动文件的名字会根据fileNamePattern的值，每隔一段时间改变一次 -->
        <!-- 文件名：log/sys.2017-12-05.0.log -->
        <fileNamePattern>${LOG_HOME}/${LOG_NAME}.%d.%i.log</fileNamePattern>
        <!-- 365天内的所有日志文件大小不能超过5GB -->
        <maxHistory>365</maxHistory>
        <totalSizeCap>10GB</totalSizeCap>
        <!--启动项目后清理历史日志-->
        <cleanHistoryOnStart>true</cleanHistoryOnStart>
        <!-- maxFileSize:这是活动文件的大小，默认值是10MB,本篇设置为1KB，只是为了演示 -->
        <maxFileSize>10MB</maxFileSize>
    </rollingPolicy>
    <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
        <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        <charset>UTF-8</charset> <!-- 此处设置字符集 -->
    </encoder>
</appender>
```

名为 `STDOUT` 的 `Appender` 配置如下，作用是 **将日志消息输出控制台**：

```xml
<appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
  <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
      <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
      <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %highlight(%-5level) %cyan(%logger{50}) - %msg%n</pattern>
  </encoder>
</appender>
```

而 `SendErrorFilter` 类位于 `spring-cloud-netflix-zuul` 依赖下 `org.springframework.cloud.netflix.zuul` 包下，而上面的配置限定了只会将 `com.xxx` 包下的日志输出到日志文件中，因此 `SendErrorFilter` 类中输出的日志并不会输出到到日志文件中，只会通过根 `Logger` 的配置输出到控制台。

而如果想让 `SendErrorFilter` 输出的错误信息输出到日志中，则添加下面的配置即可：

```java
<logger name="org.springframework.cloud" level="info">
    <appender-ref ref="syslog" />
</logger>
```

这个配置会将 `org.springframework.cloud` 包下的所有日志都输出到日志中，也可以再缩小一下范围，限制只有 `SendErrorFilter` 类的日志会输出到日志文件中：

```java
<logger name="org.springframework.cloud.netflix.zuul.filters.post" level="info">
    <appender-ref ref="syslog" />
</logger>
```

### 总结

本篇文章花了很大的篇幅来定位上面的问题，主要还是对 `logback` 配置不太熟悉导致的，导致定位问题的方向错了。不过正是因为这个，了解到了日志框架包含 **日志门面** 和 **日志实现框架**，并且了解了 `Spring` 中日志适配的原理。

### 参考文章

[SLF4J 用户手册](https://slf4j.org/manual.html)

[JCL、SLF4J、Log4J、Log4J2、LogBack和JUL之间的关系，你搞清楚了吗？](https://www.cnblogs.com/54chensongxia/p/12321446.html)

[奇怪！应用的日志呢？？](https://developer.jdcloud.com/article/3844)

[彻底解决SLF4J的日志冲突的问题](https://juejin.cn/post/7026757663732006943)

[JAVA日志框架适配/冲突解决方案大全](https://juejin.cn/post/6945220055399399455)

[Java 日志框架备忘录](https://chenxi-null.github.io/2022/07/03/Java-%E6%97%A5%E5%BF%97%E6%A1%86%E6%9E%B6%E5%A4%87%E5%BF%98%E5%BD%95/)
