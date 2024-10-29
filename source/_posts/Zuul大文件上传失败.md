---
title: Zuul大文件上传失败
abbrlink: 1341
date: 2024-10-23 09:24:36
tags: Zuul
categories: 后端技术
---

本文记录一下通过 Zuul 上传文件时，出现 Java Heap Space 报错的处理过程。

<!--more-->

### 问题描述

App 端上传一个 `150M` 左右的文件，请求的是 **`Zuul` 网关接口**，出现了 **Java heap space** 的报错，如下：

![picture 0](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/c0703f45918d05f3c10d78b7808ec72ecb20b96faa2b9a1aa6dc8cbfa24e4a8c.png)  

搜寻了相关博客，这个问题是因为 Spring 默认会把上传的文件加载到内存中，如果文件过大就会出现这个问题。

这个问题处理起来可以很简单，直接调整 Zuul 网关的 JVM 配置，然后就能解决了。但是这样治标不治本，如果之后上传一个更大的文件，那么还是可能会出现同样的问题。

### 尝试解决

在 Spring 中可以添加如下几个配置，用来对文件上传进行限制，如下：[Class MultipartProperties](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/autoconfigure/web/servlet/MultipartProperties.html)

![picture 1](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/1d3a0f365ba7409d4263f1f81f343660e3493771ef0d8f265b26f628f3ae6c0b.png)  

其中 `file-size-threshold` 可以限制 **当上传的单个文件大小超过这个值后，文件会被写入磁盘**；如果文件大小小于这个值，文件会被保存到内存中。

将这个配置添加到代码中，如下：

```properties
# 单个文件最大大小
spring.servlet.multipart.max-file-size=1024MB
# 单次上传文件请求最大大小
spring.servlet.multipart.max-request-size=1024MB
# 当单个文件大小超过这个值后，文件会被写入磁盘
spring.servlet.multipart.file-size-threshold=1MB
```

但是添加了这个配置，仍然会报 **Java heap space** 错误。因此猜测这里出现的报错并不是 Spring 给出的，而是 Zuul 网关导致的，下面针对抛出的堆栈信息进行分析。

### 问题分析

通过打印的堆栈信息，定位到问题是在执行 `DebugFilter` 类的 `shouldFilter()` 方法时产生的，如下：

![picture 2](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/fed290829c74956f25792ba9a85878210bdd72f20cfcb203d69fd634b65047f0.png)  

这行代码进行了一个 **获取请求输入字节并复制** 的操作，而在进行文件上传时，请求输入字节占用空间很大，因此导致了堆内存溢出，如下：

![picture 3](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/9c3839991beb003acd1488bfcce84af47e248011d86a52a91551bc158e5fd3ec.png)  

再回过头看下 `DebugFilter` 这个类，这个类主要用于 **调试 Zuul 路由和请求处理的过程，它允许在 Zuul 网关的生命周期的不同阶段获取请求和响应的详细信息**。在 `shouldFilter()` 方法中可以看到它的开启条件：

```java
private static final DynamicBooleanProperty ROUTING_DEBUG = DynamicPropertyFactory
        .getInstance().getBooleanProperty(ZuulConstants.ZUUL_DEBUG_REQUEST, false);

private static final DynamicStringProperty DEBUG_PARAMETER = DynamicPropertyFactory
        .getInstance().getStringProperty(ZuulConstants.ZUUL_DEBUG_PARAMETER, "debug");

@Override
public boolean shouldFilter() {
    HttpServletRequest request = RequestContext.getCurrentContext().getRequest();
    // 如果请求的地址中携带了 `debug=true` 这个配置，那么就能开启这个过滤器
    if ("true".equals(request.getParameter(DEBUG_PARAMETER.get()))) {
        return true;
    }
    // 如果配置了 `zuul.debug.request=true`，那么过滤器也能开启
    return ROUTING_DEBUG.get();
}
```

这里涉及两个 zuul 配置：

- `zuul.debug.request`。默认值为 `false`，配置为 `true` 的话，那么过滤器开启。
- `zuul.debug.parameter`。默认值为 `debug`，在请求地址后面追加 `debug=true`，或者自定义的值，那么过滤器也能开启。

而 `DebugFilter` 过滤器开启后，会将 `DebugRouting` 和 `DebugRequest` 两个值设置为 `true`，这个两个值为 `true` 时，就会在特定的场景下添加一些 `Debug` 信息到 `RequestContext` 中。

`DebugFilter` 过滤器的功能目前用不到，因此考虑将这个过滤器中产生异常的代码移除，以此来解决问题。不过这个方法还没来得及尝试，我就意识到不可行，因为在阅读源码时，我发现除了 `DebugFilter` 过滤器外，还有许多其他的过滤器存在，这些过滤器也会导致 `Java Heap Space` 报错。

### 解决办法

到这里似乎卡住了，这时想到去看看官方文档，文档中有说明 Zuul 处理大文件上传的方法：[Uploading Files through Zuul](https://cloud.spring.io/spring-cloud-netflix/multi/multi__router_and_filter_zuul.html#_uploading_files_through_zuul)

![picture 4](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/6286755ed76e1a79889d9e4462b8dda0d6340bbf691b9565c070bc2b9878ae99.png)  

在请求地址中添加 `/zuul`，比如原先上传文件接口是：`https://localhost:5655/api-a/fileUpload/upload`，调整之后就是 `https://localhost:5655/zuul/api-a/fileUpload/upload`。增加这个参数后，**可以绕过 `Spring` 的 `DispatcherServlet` 处理请求的过程，而上面出现的 `Java Heap Space` 错误就是在这个 `DispatcherServlet` 中出现的**。

这里的 `/zuul` 实在 `zuul.servlet-path` 中进行配置的，默认值为 `/zuul`，也可以自定义为其他的值。

**因此，针对 Java Heap Space 的处理办法就是，之后 `App` 端在请求上传文件接口时，在请求路径中添加 `/zuul` 前缀。**

### 延伸思考

在 Zuul 官方文档中提到，在请求地址中增加 `/zuul` 后，可以绕过 Spring 的 DispatcherServlet。在看到这个描述后，产生了几个疑问：

- **Spring 中的 DispatcherServlet 是什么？**
- **常规请求和添加了 `/zuul` 的请求在处理过程上有什么区别？**

首先来看下 DispatcherServlet 是什么：

> DispatcherServlet 是 Spring MVC 中的核心组件之一，负责处理所有的 HTTP 请求，并将请求分派给相应的控制器进行处理。

再来看下 DispatcherServlet 的工作流程：

- **收到请求**：当 Web 服务器接收到 HTTP 请求时，它会将请求转发给 DispatcherServlet。
- **解析请求**：通过 URL 信息查找合适的处理器（即 Controller），这是通过 HandlerMapping（处理器映射） 完成的。
- **创建请求和响应对象**：一旦找到处理器，DispatcherServlet 会创建一个新的 Request 和 Response 对象，通常是 HttpServletRequestWrapper 和 HttpServletResponseWrapper，这些对象被传递给 Controller 进行处理。
- **调用控制器处理请求**：DispatcherServlet 通过 HandlerAdapter 调用找到的 Controller，控制器处理请求并返回一个 ModelAndView 对象。
- **视图解析和渲染**：返回的 ModelAndView 包含视图名称和模型数据。DispatcherServlet 通过 ViewResolver（视图解析器） 找到正确的视图，并将模型数据传递给视图进行渲染。
- **返回响应**：最后，视图渲染完成后，DispatcherServlet 将响应发送回客户端。

接着看第二个问题：**常规请求和添加了 `/zuul` 的请求在处理过程上有什么区别？**（*来源：chatgpt*）

> 带有 /zuul 前缀的请求绕过了 Spring MVC 的 DispatcherServlet，直接由 Zuul 的路由和过滤器处理。常规请求在处理过程中可能会经过 Spring MVC 的 DispatcherServlet 进行处理，包括请求映射、控制器处理、异常处理等机制。

**DispatcherServlet 是 Web 服务器的请求处理，而我们项目中的 Zuul 充当的角色是网关服务，进行【路由请求】和【执行过滤器逻辑】操作即可，DispatcherServlet 对请求的处理过程在这里似乎有些多余。而添加了 `/zuul` 前缀的请求，可以绕过 DispatcherServlet 处理请求的过程，那么是否可以将所有经过 Zuul 网关的请求都绕过 DispatcherServlet 呢？**

### 关闭 Zuul 网关中 DispatcherServlet 请求处理

带着问题去寻找答案，没有找到相关的处理办法，但是在 `zuul` 的官方库下找到了其他用户提交的 `Issue`，这个 `Issue` 中提到的问题与我想的问题一样：[What is the relationship between DispatcherServlet and ZuulServlet? #311](https://github.com/Netflix/zuul/issues/311)

![picture 5](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/c367c19d0c9bce33da7edb0178f5a96759a33f4b66b9da6edd54ecd0197c68bb.png)  

这个 `Issue` 中提到的疑问并没有被解答，但是其中提到可以将 `servletPath` 设置为 `/` 来使所有经过 Zuul 的请求都绕过 DispatcherServlet。在我们的 Zuul 网关中尝试一下，如下：

```properties
zuul.servlet-path=/zuul.servlet-path=/
```

重启 Zuul 网关服务，直接请求文件上传接口，上传一个 `150M` 的文件，这次没有报错 Java Heap Space，请求成功进入了接口服务（*最终也没上传成功，因为接口服务限制只能上传 100M 以内的文件*）。

可以看到，配置生效了，所有经过 Zuul 网关的请求都会绕过 DispatcherServlet。增加了这个配置后的 Zuul 网关发挥的作用才是我们预想的效果，即 Zuul 网关只进行【路由请求】和【执行过滤器逻辑】的操作。

### 补充：Zuul 提供的过滤器
![picture 6](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/8c0d45c002ea1f14489503715d497a52d70f24feb5df91fe33a7fb50c9d5a82c.png)  

注意其中 `ServletDetectionFilter` 这个过滤器，它的执行顺序为-3，是最先被执行的过滤器。主要用来检测当前请求是需要通过 Spring 的 DispatcherServlet 处理运行的，还是通过 ZuulServlet 来处理运行的。上面我们配置了 `zuul.servlet-path=/`，那么所有的请求都会通过 ZuulServlet 来处理，看下它的代码：

```java
/**
 * Detects whether a request is ran through the {@link DispatcherServlet} or
 * {@link ZuulServlet}. The purpose was to detect this up-front at the very beginning of
 * Zuul filter processing and rely on this information in all filters. RequestContext is
 * used such that the information is accessible to classes which do not have a request
 * reference.
 *
 * @author Adrian Ivan
 */
public class ServletDetectionFilter extends ZuulFilter {

    public ServletDetectionFilter() {
    }

    @Override
    public String filterType() {
        return PRE_TYPE;
    }

    /**
     * Must run before other filters that rely on the difference between DispatcherServlet
     * and ZuulServlet.
     */
    @Override
    public int filterOrder() {
        return SERVLET_DETECTION_FILTER_ORDER;
    }

    @Override
    public boolean shouldFilter() {
        return true;
    }

    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletRequest request = ctx.getRequest();
        if (!(request instanceof HttpServletRequestWrapper)
                && isDispatcherServletRequest(request)) {
            ctx.set(IS_DISPATCHER_SERVLET_REQUEST_KEY, true);
        }
        else {
            ctx.set(IS_DISPATCHER_SERVLET_REQUEST_KEY, false);
        }

        return null;
    }

    private boolean isDispatcherServletRequest(HttpServletRequest request) {
        return request.getAttribute(
                DispatcherServlet.WEB_APPLICATION_CONTEXT_ATTRIBUTE) != null;
    }

}
```

### 重复读取请求体

配置 `zuul.servlet-path=/` 后，请求登录接口时会出现登录失败的情况，经过定位， 问题出现在下面一行代码处：

```java
myUserDetails = new ObjectMapper().readValue(req.getInputStream(), MyUserDetails.class);
```

代码进行到这里就会出现报错，调查后发现是因为这里进行了 `req.getInputStream()` 的操作，而 **请求体通过 getInputStream() 读取时，只能读取一次**。如果请求体中 InputStream 已经被访问过了，这里就会获取不到数据。

在 Zuul 网关自定义的过滤器中，进行了打印请求体的操作，其中包含了 `req.getInputStream()` 的操作，如下：

```java
// 请求参数为空，那么打印请求体
if (parameterMap == null || parameterMap.isEmpty()) {
    try {
        // 打印 URL 编码表单数据，包含 multipart 类型的请求体无需打印
        if (request.getContentType() == null || !request.getContentType().startsWith("multipart/")) {
            String requestBody = StreamUtils.copyToString(request.getInputStream(), StandardCharsets.UTF_8);
            if (StringUtils.isNotBlank(requestBody)) {
                Map<String, String> formData = Arrays.stream(requestBody.split("&"))
                        .map(part -> part.split("="))
                        .collect(Collectors.toMap(
                                arr -> arr[0],
                                arr -> arr.length > 1 ? arr[1] : ""
                        ));
                log.info("请求体：{}", URLDecoder.decode(JSON.toJSONString(formData), StandardCharsets.UTF_8.name()));
            }
        }
    } catch (IOException e) {
        log.error("请求体信息获取失败！", e);
    }
}
```

这里打印请求体的操作并不是必要的，因此直接将这段代码移除了。

**那为什么没有添加 `/zuul` 前缀的请求不存在这个问题呢？**（*来源：chatgpt*）

> 因为没有添加 `/zuul` 前缀的请求是完全交由 Spring MVC 处理的，默认的 DispatcherServlet 处理流程能够确保在控制器或中间件逻辑中多次访问请求体。此外，Spring 的 HttpServletRequestWrapper 机制可以缓存请求体数据，使得同一个请求的请求体可以被多次读取。

### 总结

App 端通过 Zuul 网关上传大文件时，出现了 Java heap space 内存溢出错误。这个问题可以通过调整 JVM 配置来解决，但是考虑这样调整只能治标不治本，之后如果上传更大的文件仍然会产生问题，因此尝试找到问题产生的原因并解决。

初步猜测问题是 Spring 文件配置的原因，因此增加了 `file-size-threshold` 配置。Spring 默认将上传的文件加载到内存中，而这个配置的作用是 **当单个文件大小超过这个值后，文件会被写入磁盘**，但是添加之后并没有生效。

之后通过报错打印的堆栈信息定位到报错是在 `DebugFilter` 过滤器中产生的，这个过滤器进行了 **读取请求字节流** 的操作，因此将 `DebugFilter` 过滤器禁用，但是没有实施，因为意识到可能还有其他的过滤器也进行了 **读取请求字节流** 的操作。

之后继续寻找解决办法，在 Spring Cloud Zuul 官方文档中找到了处理办法，**在请求地址中增加 `/zuul` 前缀**，尝试之后成功了，没有出现 Java Heap Space 报错。

问题虽然解决了，但是其背后的原理并没有搞懂。因此继续调查 `/zuul` 前缀是如何生效的，了解到这样处理 **可以绕过 `Spring` 的 `DispatcherServlet` 处理请求的过程**。其中 DispatcherServlet 是 Spring MVC 中的核心组件之一，负责处理所有的 HTTP 请求，并将请求分派给相应的控制器进行处理。**默认情况下，所有经过 Zuul 网关的请求，都会经过 DispatcherServlet 进行处理。**而我们的 Zuul 网关服务只需要进行【路由请求】和【执行过滤器逻辑】就可以了，DispatcherServlet 的处理过程在这里并没有什么用，只会额外占用请求资源，因此思考是否可以 **将所有经过 Zuul 网关的请求都绕过 DispatcherServlet**。

针对这个问题继续调查，在官方库下寻找对应的 Issue，可以通过增加 zuul.servlet-path=/ 这个配置，这样所有的请求都会绕过 DispatcherServlet。这么处理后，Zuul 网关处理请求的效率也得到了提升（文件上传请求效率提升很明显）。

至此，整个优化工作完成了。出现这个问题还是因为对 `Zuul` 和 `Spring MVC` 的工作原理理解不够深入导致的，之后还是要加强一下。

### 参考文档

[SpringBoot文件上传解析](https://www.lpnote.com/2017/05/02/spring-boot-fileupload-problem-analysis/)

[Servlet 3.0笔记之超方便的文件上传支持](http://www.blogjava.net/yongboy/archive/2011/01/15/346202.html)

[Class MultipartProperties](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/autoconfigure/web/servlet/MultipartProperties.html)

[Uploading Files through Zuul](https://cloud.spring.io/spring-cloud-netflix/multi/multi__router_and_filter_zuul.html#_uploading_files_through_zuul)

[What is Dispatcher Servlet in Spring?](https://www.geeksforgeeks.org/what-is-dispatcher-servlet-in-spring/)

[What is the relationship between DispatcherServlet and ZuulServlet? #311](https://github.com/Netflix/zuul/issues/311)

[Problem with the alternative “/zuul” path bypassing DispatcherServlet in Zuul #546](https://github.com/spring-cloud/spring-cloud-netflix/issues/546)
