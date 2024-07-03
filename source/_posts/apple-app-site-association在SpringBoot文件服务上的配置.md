---
title: apple-app-site-association在SpringBoot文件服务上的配置
abbrlink: 65521
date: 2024-05-29 13:28:24
tags:
  - SpringBoot
  - 后端技术
  - apple-app-site-association
categories: 后端技术
---

在通过第三方支付对接微信支付时，`App` 端需要接入通过 `Universal Links` 实现支付完成跳转回 `App` 的逻辑。

<!--more-->

关于 `Universal Links` 的接入这里就不详细深入了，因为属于前端的工作，这里将将相关的对接文档贴出来：

- [iOS Universal Links 使用详细教程 - 掘金](https://juejin.cn/post/6937614343840202766)
- [Universal Links - Apple官方文档](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html#//apple_ref/doc/uid/TP40016308-CH12-SW1)

服务端需要做的处理就是：

1. **将 `App` 端准备的 `apple-app-site-association` 文件放入文件服务器**
2. **可以通过 `Url` 直接访问这个文件，访问的地址是 `https:{domain}/apple-app-site-association` 或 `https:{domain}/.well-known/apple-app-site-association`，其中地址必须是域名，不能是 `IP`，并且只能通过 `https` 访问**。
   
   *关于访问地址必须是域名这个问题，在苹果官方文档中并没有找到相关的说明，但是文档中通篇提到的访问地址都是 `domain` 这个词，它的中文释义就是 **域名**。另外，在 [Universal Link 填坑](https://codingpub.github.io/2016/07/21/Universal-Link-%E5%A1%AB%E5%9D%91/) 这篇博客中提到了必须使用域名：*
   
   ![17199845392700872c88acae6a8ed20e717573e91d8ce.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17199845392700872c88acae6a8ed20e717573e91d8ce.png)
   
   *而我们 `App` 端页测试了使用 `Ip` 来接入的情况，并没有生效。*
3. **文件可以直接在浏览器阅览而无需下载(返回的 `ContentType = application/json`)**

上面第3步操作卡了我很久，下面就详细说说。

### 存在的问题

在服务器上添加 `apple-app-site-association` 文件后，在浏览器中打开 `https://xyz.example.com/apple-app-association-file` 提示要下载，查看对应的 `Response Content-Type`，如下：

![1719984548275d3fcc89f09fd02dd45b3cfb13538363f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719984548275d3fcc89f09fd02dd45b3cfb13538363f.png)

在 [Apple - Universal Links配置](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html#//apple_ref/doc/uid/TP40016308-CH12-SW1) 中提到，`apple-app-site-association` 文件的 `mime type` 需要配置为 `application/json`

![1719984556268498a615a9e01009dd8b73f83b28f39c2.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719984556268498a615a9e01009dd8b73f83b28f39c2.png)

这样配置后，输入文件对应的访问 `Url` 就可以直接在浏览器预览而无需下载，以 `bilibili` 的 `apple-app-site-association` 文件为例，地址 [bilibili apple-app-site-association 地址](https://www.bilibili.com/apple-app-site-association)

![171998456926985d26be5f1ba5227925117c1d13ebe15.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/171998456926985d26be5f1ba5227925117c1d13ebe15.png)

针对这个问题，先去搜寻了相关的解决办法，找到的方案有如下几个：

- [iOS 配置通用链接(Universal Link)服务端和开发者后台都配置好了，还是跳转不到App](https://blog.csdn.net/IT_Scratch/article/details/133987117)
  
  该方案是将文件上传到 `OSS` 服务器上，通过 `OSS` 服务器提供的配置来处理
  
  ![171998459727098aae359d3bb27adf96b08771b8ad17f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/171998459727098aae359d3bb27adf96b08771b8ad17f.png)
- [nginx - 添加 apple-app-site-association 的 application/json](https://liujia.anqun.org/index.php/archives/3008/)
  
  该方案的文件服务是通过 `Nginx` 搭建的，因此可以在 `Nginx` 中直接配置
  
  ![1719984609272f7c476b1f9195b6d6cbe7bae63c95c64.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719984609272f7c476b1f9195b6d6cbe7bae63c95c64.png)

但上面两种方案并不能用到我们的项目中，我们的文件服务是通过 `SpringBoot` 来搭建的。而搜寻了相关博客，并没有找到相关的解决办法。因此只能针对文件服务单独处理，首先想到的处理办法是，**访问的是文件 `Url` 时，手动更改 `Request` 或 `Response` 对应的 `ContentType`**，但是尝试之后发现并没有生效，这里将处理办法贴出来，以供后面备忘，**拦截 `Request` 和 `Response` 的方法并没有** 代码如下：

### 拦截 `Request` 和 `Response` 手动修改 `ContentType` - 未生效

#### 修改 `Request` 的 `ContentType`

参考文档：[SpringBoot之过滤器Filter详解及登录校验](https://blog.csdn.net/qq_62254095/article/details/130238790)

原理就是通过 `Filter` 拦截对应的请求，然后将手动将 `Request` 的 `ContentType` 修改为 `application/json`，代码如下：

新增 `RequestFilterConfig.java`

```java
@WebFilter(urlPatterns = "/.well-known/apple-app-site-association")
public class RequestFilterConfig implements Filter {
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        servletRequest = new CustomHttpServletRequestWrapper((HttpServletRequest) servletRequest);
        filterChain.doFilter(servletRequest, servletResponse);
    }
}
```

新增 `CustomHttpServletRequestWrapper.java`：

```java
public class CustomHttpServletRequestWrapper extends HttpServletRequestWrapper {
    public CustomHttpServletRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public String getContentType() {
        // 重写getContentType方法，返回的contentType固定为`application/json`
        return "application/json";
    }
}
```

在启动类中增加 `@ServletComponentScan`，通过这个注解来开启 `SpringBoot` 项目对于 `Servlet` 组件的支持：

```java
@ServletComponentScan
@EnableEurekaClient
@SpringBootApplication
public class RsdunArticlesApplication{
    public static void main(String[] args) {
        SpringApplication.run(RsdunArticlesApplication.class, args);
    }
}
```

这个新增的 `Filter` 处理类成功拦截了 `https://{domain}/.well-known/apple-app-site-association` 请求，`Request` 的 `ContentType` 也被修改了，但是在浏览器中的表现仍然是弹出了下载页面，没有直接展示 `apple-app-site-association` 文件的内容。

#### 修改 `Response` 的 `ContentType`

代码如下：

```java
@Override
public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(new HandlerInterceptor() {
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            if (request.getRequestURI().endsWith("apple-app-site-association")) {
                response.setContentType("application/json;charset=utf-8");
            }
            return true;
        }
    }).addPathPatterns("/.well-known/apple-app-site-association");
}
```

与上面一样，这个处理成功拦截到了对应的请求，并修改了 `Response` 的 `ContentType`，但最终仍然没有达到预期的效果。

### 重定向文件

参考文档：[Host apple-app-association-file in tomcat web server - StackOverFlow](https://stackoverflow.com/questions/48093807/host-apple-app-association-file-in-tomcat-web-server)

![1719984650271a5ab3295b71605f705e8520eae5c9fe3.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719984650271a5ab3295b71605f705e8520eae5c9fe3.png)

解决方法是访问指定链接时，重定向到另一个文件，访问 `xxx/.well-known/apple-app-association-file` 时，实际上返回的是服务器中的 `apple-app-association-file.json` 文件，代码如下：

```java
// 苹果 apple-app-site-association 配置文件，如果请求的是 apple-app-site-association，则返回实际的文件 apple-app-site-association.json，以便在浏览器直接展示
registry.addResourceHandler("/.well-known/**").addResourceLocations("file:" + uploadPath)
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
            @Override
            protected Resource getResource(String resourcePath, Resource location) throws IOException {
                if (resourcePath.equals("apple-app-site-association")) {
                    // 访问apple-app-site-association后缀的链接时，实际返回的是apple-app-site-association.json文件
                    return location.createRelative("apple-app-site-association.json");
                }
                return super.getResource(resourcePath, location);
            }
        });
```