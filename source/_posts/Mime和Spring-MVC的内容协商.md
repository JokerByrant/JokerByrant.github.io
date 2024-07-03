---
title: Mime和Spring MVC的内容协商
abbrlink: 7747
date: 2024-06-04 13:24:31
tags:
  - Spring
  - 后端技术
  - 内容协商
categories: 后端技术
---

MIME 的主要作用是定义一种机制，允许发送和接收包括文本、图片、音频、视频等多种类型的数据格式。它在 HTTP 协议中也起到了重要作用，帮助 Web 服务器和客户端明确传递的内容类型。

MIME 类型（也称为媒体类型）是由两部分组成的字符串，用于标识传输数据的具体类型和格式。格式为 type/subtype，例如 text/html 表示 HTML 文档，image/jpeg 表示 JPEG 图像。

<!--more-->

### `Http` 请求中的 `ContentType` 和 `Accept`

关于这个的概念参考：[Http请求中的Content-Type](https://segmentfault.com/a/1190000013056786)

`Content-Type` 是返回消息中非常重要的内容，表示后面的文档属于什么 `MIME` 类型。例如最常见的就是 `text/html`，它的意思是说返回的内容是文本类型，这个文本又是 `HTML` 格式的。原则上浏览器会根据 `Content-Type` 来决定如何显示返回的消息体内容。

- `Accept` 属于请求头，代表发送端（客户端）希望接受的数据类型。比如：`Accept:text/xml`，代表客户端希望接受的数据类型是 `xml` 类型
- `Content-Type` 属于实体头，代表发送端（客户端|服务器）发送的实体数据的数据类型。比如：`Content-Type:text/html`，代表发送端发送的数据格式是 `html`

比如一次 `Http` 请求中 `Accept:text/xml`、`Content-Type:text/html`，代表希望接受的数据类型是 `xml` 格式，本次请求发送的数据的数据格式是 `html`

### `Spring MVC` 中的内容协商

参考 [Spring MVC内置支持的4种内容协商方式【享学Spring MVC】](https://www.cnblogs.com/yourbatman/p/11420796.html)

> 一个 `URL` 资源服务端可以以多种形式进行响应：即 `MIME（MediaType）`媒体类型。但对于某一个客户端（浏览器、`APP`、`Excel` 导出...）来说它只需要一种。`so`这样客户端和服务端就得有一种机制来保证这个事情，这种机制就是内容协商机制。

下面说一下 `Spring MVC` 中支持的几种内容协商方式，我们这里使用 `SpringBoot` 进行演示，首先创建一个 `Spring Web` 项目，增加一个接口：

```java
@RestController
@RequestMapping("/auth")
public class TestController {
    @ResponseBody
    @GetMapping("/test")
    public User test() {
        User user = new User();
        user.setUserUid(UuidUtil.getUid());
        user.setRealName("张三");
        return user;
    }
}
```

这时我们在浏览器或 `Postman` 中请求这个接口，返回的 `ContentType` 是 `application/json`，而我们如果在 `pom.xml` 加入下面的依赖：

```xml
<!-- 此处需要导入databind包即可， jackson-annotations、jackson-core都不需要显示自己的导入了-->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.9.8</version>
</dependency>
<!-- jackson默认只会支持的json。若要xml的支持，需要额外导入如下包 -->
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-xml</artifactId>
    <version>2.9.8</version>
</dependency>
```

这时请求接口，返回的 `ContentType` 就是 `application/xml` 了。这是因为默认情况下 `Spring MVC` 并不支持 `application/xml` 这种媒体格式，而默认情况下 `xml` 的优先级高于 `json`，所以增加了 `xml` 支持后，默认返回的媒体格式就是 `application/xml`。而没有引入上面依赖时，不支持 `appliction/xml` 媒体格式，所以才轮到 `json` 的。

下面看下 `Spring MVC` 支持的几种内容协商方式：

1. 在 `Http` 请求头 `Accept` 中指定数据类型。
   
   ![1719984362268895dd34f98cf8b8b0c86f4300bb55dae.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719984362268895dd34f98cf8b8b0c86f4300bb55dae.png)
2. `Http` 请求的 `Url` 增加拓展名，比如 `xxx.json`、`xxx.xml`
   
   ![1719984370271fe13fb75b89d03618a7cf46257c755de.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719984370271fe13fb75b89d03618a7cf46257c755de.png)
   
   ![1719984386271c319590a037b20c35e2dfe49e9a165d8.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719984386271c319590a037b20c35e2dfe49e9a165d8.png)
3. 在请求参数中传递 `xxx?format=xml` 参数，需要用户手动开启配置
   ```java
   @Configuration
   @EnableWebMvc
   public class WebMvcConfig extends WebMvcConfigurerAdapter {
       @Override
       public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
           // 支持请求参数协商
           configurer.favorParameter(true);
       }
   }
   ```
   
   ![171998440327119134d284c8d86ddd584ada435c190f7.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/171998440327119134d284c8d86ddd584ada435c190f7.png)
4. 接口中固定媒体类型：指定 `produces`
   ```java
   @ResponseBody
   @GetMapping(value = "/test", produces = MediaType.APPLICATION_JSON_VALUE)
   public User test() {
       User user = new User();
       user.setUserUid(UuidUtil.getUid());
       user.setRealName("张三");
       return user;
   }
   ```
   
   按上面的方式改造后，即使引入了上面支持 `xml` 媒体类型的依赖，最终默认返回的仍然是 `application/json`。
   
   该方式有一个注意事项：**`produces` 指定的 `MediaType` 类型不能和后缀、请求参数、`Accept` 冲突**。如果有冲突，那么接口就会出现报错提示。

### 源码解析

具体见：[Spring MVC内容协商实现原理及自定义配置【享学Spring MVC】](https://www.cnblogs.com/yourbatman/p/11420805.html)

![1719984413271717122807b3c63ce3782b7cf1479a317.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1719984413271717122807b3c63ce3782b7cf1479a317.png)

继承树见上图，上面提到的4种协商方式对应的实现类分别是：

1. `HeaderContentNegotiationStrategy`  - 根据请求头 `Accept` 完成内容协商
2. `ServletPathExtensionContentNegotiationStrategy` - 根据文件拓展名进行内容协商
   > 一个 `MediaType` 对应多个拓展名，一个拓展名只属于一个 `MediaType`
3. `ParameterContentNegotiationStrategy` - 根据 `url` 中携带的请求参数（默认是 `format`）进行内容协商（***注：`Spring MVC` 默认关闭，需要手动开启***）
4. `FixedContentNegotiationStrategy` - 根据 `@RequestMapping.produces`这个注解属性进行内容协商

### 参考文章

[Http请求中的Content-Type](https://segmentfault.com/a/1190000013056786)

[Spring MVC内置支持的4种内容协商方式【享学Spring MVC】](https://www.cnblogs.com/yourbatman/p/11420796.html)
