---
title: SpringBoot中Bean的作用域SCOPE_PROTOTYPE未生效
tags: SpringBoot
categories: 后端技术
abbrlink: 21887
date: 2023-11-30 14:06:24
---

平常我们用 `Spring` 管理 `Bean` ，都是使用的默认作用域，也就是 **`SCOPE_SINGLETON` - 单例作用域：定义的 `Bean` 在整个应用程序中只有一个实例**。`Spring` 还包含另一个不常用的作用域 **`SCOPE_PROTOTYPE` - 原型作用域：每次请求该 `Bean` 时，都会创建一个新的实例。**

<!--more-->

## 问题复现

最近项目中就用到了 `SCOPE_PROTOTYPE` 来定义 `Bean`，但是测试发现没有生效，下面通过一段测试代码来还原这个问题：

```java
@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class InvalidManager {
}
```

```java
@RestController
@Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
public class Test {
    @Autowired
    private InvalidManager invalidManager;

    @RequestMapping(path = "test", method = RequestMethod.GET)
    public void test() {
        System.out.println("==================");
        System.out.println(this);
        System.out.println(invalidManager);
    }
}
```

每次请求 `/test`，打印出的 `InvalidManage` 都是同一个，定义的 `SCOPE_PROTOTYPE` 并没有生效：

![170132425557961acf5aabffde7c9cd36cbd22dc2b99b.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/170132425557961acf5aabffde7c9cd36cbd22dc2b99b.png)

## 解决办法

上面测试中，尽管 `InvalidManager` 的作用域是原型(`prototype`)，但在被注入到 `Test` 中时，`InvalidManager` 的实例只会在 `Test` 的单例创建时创建一次，并在整个 `Test` 的生命周期内保持相同的实例。

如果想要让 `InvalidManager` 的 原型(`prototype`)作用域生效，那么可以通过下面几种方式处理：

### 入口类作用域修改为原型(`prototype`)
   ```java
   @RestController
   @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
   public class Test {}
   ```
   
   不过这样每次请求 `/test` 都会创建一个新的 `Test` 实例。
   
   ![170132428057726761ece7cfd4202581ce2befb8364e3.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/170132428057726761ece7cfd4202581ce2befb8364e3.png)

### 使用 `ApplicatioContext`
   ```java
   @RestController
   @Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
   public class Test {
       @Autowired
       private ApplicationContext applicationContext;
   
       @RequestMapping(path = "test", method = RequestMethod.GET)
       public void test() {
           System.out.println("==================");
           System.out.println(this);
           System.out.println(applicationContext.getBean(InvalidManager.class));
       }
   }
   ```
   
   这样每次请求 `/test` 都会重新注入 `InvalidManager`：
   
   ![170132429257982e2b888fc003143a63a3cc9a2f439c8.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/170132429257982e2b888fc003143a63a3cc9a2f439c8.png)

### 使用 `ObjectFactory`
   ```java
   @RestController
   @Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
   public class Test {
       @Autowired
       private ObjectFactory<InvalidManager> objectFactory;
   
       @RequestMapping(path = "test", method = RequestMethod.GET)
       public void test() {
           System.out.println("==================");
           System.out.println(this);
           System.out.println(objectFactory.getObject());
       }
   }
   ```
   
   `ObjectFactory` 会根据对象的 `scope` 来选择是否需要创建对象，比如上面 `InvalidManager` 的作用域是原型(`prototype`)，那么每次调用 `ObjectFactory.getObject()` 都会返回一个新的对象。而如果对象的作用域是单例(`singleton`)，那每次调用 `ObjectFactory.getObject()` 都会返回相同的实例。

### 使用 `Lookup` 注解
   ```java
   @RestController
   @Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
   public class Test {
       @Lookup
       public InvalidManager getInvalidManager() {
           System.out.println("getInvalidManger方法被调用啦.....");
           return null;
       }
   
       @RequestMapping(path = "test", method = RequestMethod.GET)
       public void test() {
           System.out.println("==================");
           System.out.println(this);
           System.out.println(getInvalidManager());
       }
   }
   ```
   
   最终输出如下：
   
   ![17013243045774575e3ddeb83b2aa569d5ff41fefba08.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17013243045774575e3ddeb83b2aa569d5ff41fefba08.png)
   
   注意上面的 `Lookup` 注解修饰的 `getInvalidManager()` 方法，最终的返回值是 `null`,但实际上 `getInvalidManager()` 的具体实现无关紧要，因为被 `Lookup` 注解修饰的方法的具体实现不会被调用。因此可以看到上面 `getInvalidManager()` 中虽然有打印日志的代码，但是最终也没有输出，因为方法没有被调用。被 `Lookup` 修饰的方式最终会通过 `BeanFactory` 来获取 `Bean`，比如上例中就是获取 `InvalidManager` 实例。
   
   而如果 `Lookup` 注解标记的方法获取的对象作用域是单例(`singleton`)的话，那么每次调用方法获取到的实例都会是同一个。
   
   在 `Lookup` 的官方文档中有一个提示：
   > Concrete limitations in typical Spring configuration scenarios: When used with component scanning or any other mechanism that filters out abstract beans, provide stub implementations of your lookup methods to be able to declare them as concrete classes. And please remember that lookup methods won't work on beans returned from @Bean methods in configuration classes; you'll have to resort to @Inject Provider<TargetBean> or the like instead.
   > 
   > 典型的Spring配置场景中的具体限制：当与组件扫描或任何其他过滤抽象bean的机制一起使用时，请提供查找方法的存根实现，以便将其声明为具体类。请记住，查找方法不适用于配置类中的@Bean方法返回的bean；您将不得不转而使用@Inject Provider或类似的方法。
   
   也就是说，如果 `ClassA` 中使用了 `Lookup` 修饰了某个方法，那么 `ClassA` 必须使用注解(比如 `Component`)来修饰以便 `ClassA` 是通过扫描的方式被注册为 `Bean` 的，如果 `ClassA` 是通过 `@Bean` 方式来注册成 `Bean` 的，那 `Lookup` 注解将失效。我们用一段代码测试下：
   
   `ValidManager` 中通过 `@Lookup` 获取 `InvalidManager` 实例，但是 `ValidManager` 是通过 `@Bean` 将自己注册为 `Bean` 的：
   ```java
   public class ValidManager {
       @Lookup
       public InvalidManager getInvalidManager() {
           System.out.println("getInvalidManger方法被调用啦.....");
           return null;
       }
   
       public void print() {
           System.out.println(getInvalidManager());
       }
   }
   ```
   ```java
   @Bean
   public ValidManager validManager() {
       return new ValidManager();
   }
   ```
   
   在 `Test` 中调用 `ValidManager`：
   ```java
   @RestController
   @Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
   public class Test {
       @Autowired
       private ValidManager validManager;
   
       @RequestMapping(path = "test", method = RequestMethod.GET)
       public void test() {
           System.out.println("==================");
           validManager.print();
       }
   }
   ```
   
   请求 `/test`，结果如下，可以看到 `Lookup` 注解并未生效：
   
   ![1701324320580559c63d0dba213dfebe1001ffac35cc5.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1701324320580559c63d0dba213dfebe1001ffac35cc5.png)
   
   将 `ValidManager` 更改为使用注解的方法注册为 `Bean`：
   ```java
   @Component
   public class ValidManager {}
   ```
   
   可以看到 `Lookup` 生效了：
   
   ![17013243325784f2709c84f9430ae5da158a0358af5eb.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17013243325784f2709c84f9430ae5da158a0358af5eb.png)
   > 另外还有一个注意点，被 `Lookup` 修饰的方法必须要不能是 `private` 方法，否则 `Lookup` 注解也会失效。

## 参考文章

[Spring Bean 定义常见错误](https://learn.lianglianglee.com/%e4%b8%93%e6%a0%8f/Spring%e7%bc%96%e7%a8%8b%e5%b8%b8%e8%a7%81%e9%94%99%e8%af%af50%e4%be%8b/01%20Spring%20Bean%20%e5%ae%9a%e4%b9%89%e5%b8%b8%e8%a7%81%e9%94%99%e8%af%af.md)

[spring注解@Lookup使用原理和注意点以及其他替换实现方案](https://blog.csdn.net/duxd185120/article/details/109125440)

[Spring中的BeanFactory和FactoryBean（以及它和ObjectFactory的区别）的区别](https://www.ericshen.tech/2021/01/28/spring/BeanFactory%E5%92%8CFactoryBean%E5%92%8CObjectFactory/)
