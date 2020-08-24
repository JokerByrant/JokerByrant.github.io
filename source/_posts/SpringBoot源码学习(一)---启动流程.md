---
title: SpringBoot源码学习(一)---启动流程
date: 2020-06-07 14:08:42
categories: SpringBoot
tags: SpringBoot
---
工作中接触的最多的框架就是 SpringBoot 了，但对它一直处于一种一知半解的状态，就去学习了一下它的源码，接下来几篇文章就来记录一下，也正好加强一下理解。

```java
@SpringBootApplication
public class MySpringBootApplication {
    public static void main(String[] args) {
        SpringApplication.run(MySpringBootApplication.class, args);
    }
}
```
上面的代码就是 SpringBoot 的入口类，从代码上可以看出主要就是调用了 `SpringApplication` 的 `run()` 方法，并将我们的启动类作为参数传了进去，下面我们就进到源码里面看看这个run方法。

```java
public static ConfigurableApplicationContext run(Class<?>[] primarySources, String[] args) {
   // 分两步->1.new一个SpringApplication  2.执行run()方法
   return new SpringApplication(primarySources).run(args);
}
```

可以看到主要分成两步：
1. 构造一个 `SpringApplication` 的实例
2. 执行实例的 `run()` 方法

---

## 1.构造 `SpringApplication`
```java
public SpringApplication(Class<?>... primarySources) {
   this(null, primarySources);
}
public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
   // 资源加载器
   this.resourceLoader = resourceLoader;
   Assert.notNull(primarySources, "PrimarySources must not be null");
   // primarySources->主程序Class，把其添加到SpringApplication的primarySources属性中
   this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
   // 判断当前应用程序的类型是REACTIVE还是SERVLET，它们在Spring中分别对应spring-webflux和spring-webmvc
   this.webApplicationType = WebApplicationType.deduceFromClasspath();
   // 设置应用程序初始化器，这些初始化器就是ApplicationContextInitializer的实现类，具体可以去spring.factories中查看。
   setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
   // 设置应用程序事件监听器，这些事件监听器就是ApplicationListener的实现类
   setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
   // 找出main方法所在的类
   this.mainApplicationClass = deduceMainApplicationClass();
}
```

在 `SpringApplication` 的构造器中，主要就做了这么几件事：
1. 存储主程序class 
2. 判断当前启动服务的类型(Servlet/Reactive) 
3. 设置程序初始化器 
4. 设置监听器
    
### `deduceFromClasspath()`方法用来判断程序类型
```java
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

// 相关的常量
private static final String[] SERVLET_INDICATOR_CLASSES = { "javax.servlet.Servlet",
      "org.springframework.web.context.ConfigurableWebApplicationContext" };

private static final String WEBMVC_INDICATOR_CLASS = "org.springframework." + "web.servlet.DispatcherServlet";

private static final String WEBFLUX_INDICATOR_CLASS = "org." + "springframework.web.reactive.DispatcherHandler";

private static final String JERSEY_INDICATOR_CLASS = "org.glassfish.jersey.servlet.ServletContainer";
```
判断服务是 `Servlet` 还是 `Reactive` 就是通过下面两个类进行判断
![avatar](http://ww1.sinaimg.cn/large/006jvOIfgy1gfjpe76j3qj30cv0jygm3.jpg)
![avatar](http://ww1.sinaimg.cn/large/006jvOIfgy1gfjpfi5hbzj30cq0a90su.jpg)

### `getSpringFactoriesInstances()`用于从`spring.factories`中获取指定类对应的实例
在设置初始化器和程序事件监听器时，都调用了`getSpringFactoriesInstances()`，这个方法主要的功能是从`spring.factories`中获取指定类对应的实例，初始化器和程序事件监听器就分别从`spring.factories`中获取`ApplicationContextInitializer.class`和`ApplicationListener.class`的实现类

```java
private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
   ClassLoader classLoader = getClassLoader();
   // Use names and ensure unique to protect against duplicates
   // 保存从spring.factories中读取到的类名
   Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
   // 根据names中保存的类名进行实例化
   List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
   // 对实例进行排序
   AnnotationAwareOrderComparator.sort(instances);
   return instances;
}
```

### 初始化器对应的实例
```yml
# Application Context Initializers
# 在Spring上下文被刷新之前进行的初始化操作，比如在web容器中 [注册配置文件] 或者 [激活profiles]-->profiles就是为了在不同环境下加载不同配置抽象出的实体(application-dev.yml...)
org.springframework.context.ApplicationContextInitializer=\
org.springframework.boot.context.ConfigurationWarningsApplicationContextInitializer,\
org.springframework.boot.context.ContextIdApplicationContextInitializer,\
org.springframework.boot.context.config.DelegatingApplicationContextInitializer,\
org.springframework.boot.web.context.ServerPortInfoApplicationContextInitializer
程序监听器对应的实例

# Application Listeners
org.springframework.context.ApplicationListener=\
org.springframework.boot.ClearCachesApplicationListener,\
org.springframework.boot.builder.ParentContextCloserApplicationListener,\
org.springframework.boot.cloud.CloudFoundryVcapEnvironmentPostProcessor,\
org.springframework.boot.context.FileEncodingApplicationListener,\
org.springframework.boot.context.config.AnsiOutputApplicationListener,\
org.springframework.boot.context.config.ConfigFileApplicationListener,\
org.springframework.boot.context.config.DelegatingApplicationListener,\
org.springframework.boot.context.logging.ClasspathLoggingApplicationListener,\
org.springframework.boot.context.logging.LoggingApplicationListener,\
org.springframework.boot.liquibase.LiquibaseServiceLocatorApplicationListener
```
我们也可以自定义初始化器和程序监听器，只要实现对应的抽象类，并在`spring.factories`中添加配置即可

## 2.执行`run()`方法
`SpringApplication` 构造完成后，就开始执行其下的 `run()` 方法，通过8个子步骤完成了 Spring 容器的创建和启动，下面来一个个分析
```java
public ConfigurableApplicationContext run(String... args) {
   // 计时工具
   StopWatch stopWatch = new StopWatch();
   stopWatch.start(); // 开始计时，记录开始时间
   
   ConfigurableApplicationContext context = null;
   Collection<SpringBootExceptionReporter> exceptionReporters = new ArrayList<>();
   
   configureHeadlessProperty();
   
   // 1.获取并启动监听器
   /*
     步骤分析：首先会从spring.factories中获取SpringApplicationRunListener对应的实例，它默认有一个实现类EventPublishingRunListener。
     EventPublishingRunListener这个类把监听的过程封装成了SpringApplicationEvent事件，并且它内部包含一个名为initialMulticaster的属性，这个属性是SimpleApplicationEventMulticaster类的引用，
     通过这个属性的multicastEvent()方法启动之前SpringApplication初始化时设置的监听器，监听器通过传入的SpringApplicationEvent的类型来确定SpringBoot当前所处的启动时期。
    */
   SpringApplicationRunListeners listeners = getRunListeners(args);
   // 上面分析过，会封装成SpringApplicationEvent事件然后广播出去给SpringApplication中的listeners所监听
   // 这里接受ApplicationStartedEvent事件的listener会执行相应的操作
   listeners.starting();
   
   try {
      ApplicationArguments applicationArguments = new DefaultApplicationArguments(args); // 构造一个应用程序参数持有类
      
      // 2.根据SpringApplicationRunListeners和参数来准备环境
      ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);
      configureIgnoreBeanInfo(environment);


      Banner printedBanner = printBanner(environment); // 准备Banner打印器 - 就是启动Spring Boot的时候打印在console上的ASCII艺术字体
      
      // 3.创建Spring容器
      context = createApplicationContext();
      
      exceptionReporters = getSpringFactoriesInstances(SpringBootExceptionReporter.class,
            new Class[] { ConfigurableApplicationContext.class }, context);
      
      // 4.准备Spring容器
      prepareContext(context, environment, listeners, applicationArguments, printedBanner);
      
      // 5.刷新容器。
      // Spring容器的刷新refresh方法内部会做很多很多的事情：比如BeanFactory的设置、BeanFactoryPostProcessor接口的执行、BeanPostProcessor接口的执行、自动化配置类的解析、条件注解的解析、国际化的初始化等等
      refreshContext(context);
      
      // 6.Spring容器后置处理
      // 这是一个扩展接口，使用了模板方法，默认为空实现。如果有自定义需求，可以重写该方法。比如打印一些启动结束log，或者一些其它后置处理。
      afterRefresh(context, applicationArguments);
      
      stopWatch.stop(); // 记录结束时间
      if (this.logStartupInfo) {
         new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), stopWatch);
      }
      
      // 7.触发结束执行的监听事件
      // 注意：这里的started()方法执行的是构建好的Spring容器中的publishEvent()方法，与前面的starting()有些许不同
      listeners.started(context);
      
      // 8.执行Runners
      // 检查Spring容器中是否有ApplicationRunner和CommandLineRunner类型的bean，有的话就遍历他们并执行
      callRunners(context, applicationArguments);
   }
   catch (Throwable ex) {
      handleRunFailure(context, ex, exceptionReporters, listeners);
      throw new IllegalStateException(ex);
   }


   try {
      // 容器启动完成最后一刻调用这个方法
      listeners.running(context);
   }
   catch (Throwable ex) {
      handleRunFailure(context, ex, exceptionReporters, null);
      throw new IllegalStateException(ex);
   }
   
   return context; // 返回容器
}
```

### 1. 获取并启动监听器。
```java
SpringApplicationRunListeners listeners = getRunListeners(args);
listeners.starting();
```
从 `spirng.factories` 中读取 `SpringApplicationRunListener.class` 对应的实例，并构造了一个 `SpringApplicationRunListeners` 来封装这些实例

```java
/**
* 获取监听器，利用getSpringFactoriesInstances()方法获取SpringApplicationRunListener实现类对应的实例，它的内部只有一个类EventPublishingRunListener
* EventPublishingRunListener内部有一个广播器，在构造它时，它会将之前SpringApplication初始化时设置的11个监听器添加到这个广播器中
* @param args
* @return
*/
private SpringApplicationRunListeners getRunListeners(String[] args) {
   Class<?>[] types = new Class<?>[] { SpringApplication.class, String[].class };
   return new SpringApplicationRunListeners(logger,
         getSpringFactoriesInstances(SpringApplicationRunListener.class, types, this, args));
}
```
通过查看 `spring.factories` 发现 `SpringApplicationRunListener.class` 默认只有一个实例 `EventPublishingRunListener`

```yml
# Run Listeners
org.springframework.boot.SpringApplicationRunListener=\
org.springframework.boot.context.event.EventPublishingRunListener
```
`EventPublishingRunListener` 内部有一个广播器，在构造它时，它会将之前 `SpringApplication` 初始化时设置的11个监听器添加到这个广播器中

```java
// 广播器
private final SimpleApplicationEventMulticaster initialMulticaster;

public EventPublishingRunListener(SpringApplication application, String[] args) {
   this.application = application;
   this.args = args;
   this.initialMulticaster = new SimpleApplicationEventMulticaster();
   for (ApplicationListener<?> listener : application.getListeners()) {
      // 将之前SpringApplication初始化时设置的11个监听器全部添加到SimpleApplicationEventMulticaster这个广播器中
      // addApplicationListener()在SimpleApplicationEventMulticaster的父类中，它定义了一个内部类用来存放监听器
      this.initialMulticaster.addApplicationListener(listener);
   }
}
```

监听器执行某个事件时，传入事件对应的类---`ApplicationEvent.class`的实现类，到监听器的`multicastEvent()`方法中完成事件的调用。

```java
@Override
public void starting() {
   // 1.在run()方法执行前执行，创建application启动事件`ApplicationStartingEvent`
   // 2.然后在multicastEvent()方法中，通过`ApplicationStartingEvent`获取对应的监听器，然后启动监听器，在容器启动后执行响应的动作（方法内会去获取线程池，此时为空，只能同步发送事件）
   this.initialMulticaster.multicastEvent(new ApplicationStartingEvent(this.application, this.args));
}

@Override
public void environmentPrepared(ConfigurableEnvironment environment) {
   this.initialMulticaster
         .multicastEvent(new ApplicationEnvironmentPreparedEvent(this.application, this.args, environment));
}

@Override
public void contextPrepared(ConfigurableApplicationContext context) {
   this.initialMulticaster
         .multicastEvent(new ApplicationContextInitializedEvent(this.application, this.args, context));
}
```

具体的事件执行方法 `multicastEvent()`
```java
public void multicastEvent(ApplicationEvent event, @Nullable ResolvableType eventType) {
    ResolvableType type = eventType != null ? eventType : this.resolveDefaultEventType(event);
    // 获取线程池
    Executor executor = this.getTaskExecutor();
    // 根据event获取对应的监听器
    Iterator var5 = this.getApplicationListeners(event, type).iterator();

    // 遍历监听器并执行
    while(var5.hasNext()) {
        ApplicationListener<?> listener = (ApplicationListener)var5.next();
        if (executor != null) {
            // 线程池为空，同步发送事件
            executor.execute(() -> {
                this.invokeListener(listener, event);
            });
        } else {
            // 否则，异步执行事件
            this.invokeListener(listener, event);
        }
    }
}
```

这个执行方法会接收一个`ApplicationEvent`，并根据这个 `event` 来获取对应的监听器 `listener` ，SpringBoot也自带一些这个类的实例，用来区分执行SpringBoot启动程序的不同阶段。

回过头来看看`SpringApplicationRunListeners.class`，通过构造一个`SpringApplicationRunListeners`来对获取到的实例完成一次封装，之后就可以通过`SpringApplicationRunListeners`统一完成对这些监听器的调用

```java
// SpringApplicationRunListeners内部持有SpringApplicationRunListener集合和1个Log日志类，用于SpringApplicationRunListener监听器的批量执行。
SpringApplicationRunListeners(Log log, Collection<? extends SpringApplicationRunListener> listeners) {
   this.log = log;
   this.listeners = new ArrayList<>(listeners);
}

// 可以看到，下面的几个方法均是如此，遍历SpringApplicationRunListener集合，批量执行Spring Boot启动时不同时期应该执行的方法
public void starting() {
   for (SpringApplicationRunListener listener : this.listeners) {
      listener.starting();
   }
}

public void environmentPrepared(ConfigurableEnvironment environment) {
   for (SpringApplicationRunListener listener : this.listeners) {
      listener.environmentPrepared(environment);
   }
}

public void contextPrepared(ConfigurableApplicationContext context) {
   for (SpringApplicationRunListener listener : this.listeners) {
      listener.contextPrepared(context);
   }
}

public void contextLoaded(ConfigurableApplicationContext context) {
   for (SpringApplicationRunListener listener : this.listeners) {
      listener.contextLoaded(context);
   }
}

public void started(ConfigurableApplicationContext context) {
   for (SpringApplicationRunListener listener : this.listeners) {
      listener.started(context);
   }
}

public void running(ConfigurableApplicationContext context) {
   for (SpringApplicationRunListener listener : this.listeners) {
      listener.running(context);
   }
}
```

`SpringApplicationRunListener.class`
```java
public interface SpringApplicationRunListener {
   /**
    * 在run()方法开始执行时，该方法就立即被调用，可用于在初始化最早期时做一些工作。
    *
    * Called immediately when the run method has first started. Can be used for very
    * early initialization.
    */
   void starting();

   /**
    * 当environment构建完成，ApplicationContext创建之前，该方法被调用。
    *
    * Called once the environment has been prepared, but before the
    * {@link ApplicationContext} has been created.
    * @param environment the environment
    */
   void environmentPrepared(ConfigurableEnvironment environment);

   /**
    * 当ApplicationContext构建完成时，该方法被调用
    *
    * Called once the {@link ApplicationContext} has been created and prepared, but
    * before sources have been loaded.
    * @param context the application context
    */
   void contextPrepared(ConfigurableApplicationContext context);

   /**
    * 在ApplicationContext完成加载，但没有被刷新前，该方法被调用
    *
    * Called once the application context has been loaded but before it has been
    * refreshed.
    * @param context the application context
    */
   void contextLoaded(ConfigurableApplicationContext context);

   /**
    * 在ApplicationContext刷新并启动后，CommandLineRunners和ApplicationRunner未被调用前，该方法被调用
    *
    * The context has been refreshed and the application has started but
    * {@link CommandLineRunner CommandLineRunners} and {@link ApplicationRunner
    * ApplicationRunners} have not been called.
    * @param context the application context.
    * @since 2.0.0
    */
   void started(ConfigurableApplicationContext context);

   /**
    * 在run()方法执行完成前该方法被调用
    *
    * Called immediately before the run method finishes, when the application context has
    * been refreshed and all {@link CommandLineRunner CommandLineRunners} and
    * {@link ApplicationRunner ApplicationRunners} have been called.
    * @param context the application context.
    * @since 2.0.0
    */
   void running(ConfigurableApplicationContext context);

   /**
    * 当应用运行出错时该方法被调用
    *
    * Called when a failure occurs when running the application.
    * @param context the application context or {@code null} if a failure occurred before
    * the context was created
    * @param exception the failure
    * @since 2.0.0
    */
   void failed(ConfigurableApplicationContext context, Throwable exception);

}
```

### 2. `prepareEnvironment()`---准备环境
这里完成的工作主要是配置Spring容器需要的环境信息，比如`profile`、`命令行参数`等

```java
private ConfigurableEnvironment prepareEnvironment(SpringApplicationRunListeners listeners,
      ApplicationArguments applicationArguments) {
   // Create and configure the environment
   // 获取对应的ConfigurableEnvironment，根据前面初始化SpringApplication确定的服务类型[SERVLET/REACTIVE]进行配置
   ConfigurableEnvironment environment = getOrCreateEnvironment();
   
   // 配置一些环境信息。比如profile，命令行参数
   configureEnvironment(environment, applicationArguments.getSourceArgs());
   ConfigurationPropertySources.attach(environment);

   // 发布环境已准备事件，这是第二次发布事件
   listeners.environmentPrepared(environment);
   // 将配置信息绑定到SpringBoot的启动程序
   bindToSpringApplication(environment);
   if (!this.isCustomEnvironment) {
      environment = new EnvironmentConverter(getClassLoader()).convertEnvironmentIfNecessary(environment,
            deduceEnvironmentClass());
   }
   ConfigurationPropertySources.attach(environment);
   return environment;
}
```
    
根据前面初始化`SpringApplication`时确定的服务类型`webApplicationType`配置`ConfigurableEnvironment`

```java
private ConfigurableEnvironment getOrCreateEnvironment() {
   if (this.environment != null) {
      return this.environment;
   }
   switch (this.webApplicationType) {
   case SERVLET:
      return new StandardServletEnvironment();
   case REACTIVE:
      return new StandardReactiveWebEnvironment();
   default:
      return new StandardEnvironment();
   }
}
```
    
通过`configureEnvironment()`方法完成一些环境的配置，例如profiles

```java
protected void configureEnvironment(ConfigurableEnvironment environment, String[] args) {
   if (this.addConversionService) {
      ConversionService conversionService = ApplicationConversionService.getSharedInstance();
      environment.setConversionService((ConfigurableConversionService) conversionService);
   }
   configurePropertySources(environment, args);
   configureProfiles(environment, args);
}
```

配置`profiles`

```java
protected void configureProfiles(ConfigurableEnvironment environment, String[] args) {
   // 获取spring.profiles.active配置的参数
   environment.getActiveProfiles(); // ensure they are initialized
   // But these ones should go first (last wins in a property key clash)
   Set<String> profiles = new LinkedHashSet<>(this.additionalProfiles);
   profiles.addAll(Arrays.asList(environment.getActiveProfiles()));
   // 将profiles添加到环境中
   environment.setActiveProfiles(StringUtils.toStringArray(profiles));
}
```
    
下面看一下`listeners.environmentPrepared(environment)`这行代码，这里执行了监听器的`environmentPrepared()`方法，表示发布环境已经准备完毕，下面方法与上面的`starting()`类似，传入了一个`ApplicationEnvironmentPreparedEvent`事件到广播器中，在广播器中会获取支持这个事件的监听器并依次遍历调用。

```java
@Override
public void environmentPrepared(ConfigurableEnvironment environment) {
   this.initialMulticaster
         .multicastEvent(new ApplicationEnvironmentPreparedEvent(this.application, this.args, environment));
}
```
这个阶段获取到的监听器中包含一个叫`ConfigFileApplicationListener`的监听器，这个监听器主要完成了对`properties`和`yml`文件配置的加载，下面会单独讲一讲这个类的执行流程，具体见SpringBoot源码学习(三)---配置环境的构造过程。


### 3. `createApplicationContext()`---创建Spring容器
根据`webApplicationType`来创建Spring容器，web项目对应的服务类型是`SERVLET`，那么创建的Spring容器即是`AnnotationConfigServletWebServerApplicationContext`

```java
protected ConfigurableApplicationContext createApplicationContext() {
   Class<?> contextClass = this.applicationContextClass;
   if (contextClass == null) {
      try {
         // 根据webApplicationType判断创建容器的类型，并通过反射装载对应的字节码
         switch (this.webApplicationType) {
         case SERVLET:
            contextClass = Class.forName(DEFAULT_SERVLET_WEB_CONTEXT_CLASS);
            break;
         case REACTIVE:
            contextClass = Class.forName(DEFAULT_REACTIVE_WEB_CONTEXT_CLASS);
            break;
         default:
            contextClass = Class.forName(DEFAULT_CONTEXT_CLASS);
         }
      }
      catch (ClassNotFoundException ex) {
         throw new IllegalStateException(
               "Unable create a default ApplicationContext, " + "please specify an ApplicationContextClass",
               ex);
      }
   }
   // 返回根据字节码拿到的实例
   return (ConfigurableApplicationContext) BeanUtils.instantiateClass(contextClass);
}
```

### 4. `prepareContext()`---准备Spring容器
这一步主要对之前创建的 Spring 容器进行一些配置，例如配置容器环境、执行初始化器等操作

```java
private void prepareContext(ConfigurableApplicationContext context, ConfigurableEnvironment environment,
      SpringApplicationRunListeners listeners, ApplicationArguments applicationArguments, Banner printedBanner) {
   // 设置容器环境
   context.setEnvironment(environment);
   // 检查并加载容器的一些额外配置
   postProcessApplicationContext(context);
   // 执行SpringApplication初始化时设置的初始化器
   applyInitializers(context);
   // 容器构建完成，通知各个监听器可以
   listeners.contextPrepared(context);
   
   if (this.logStartupInfo) {
      logStartupInfo(context.getParent() == null);
      logStartupProfileInfo(context);
   }
   
   // Add boot specific singleton beans
   // 注册启动参数bean，这里将容器指定的参数封装成bean，注入容器
   ConfigurableListableBeanFactory beanFactory = context.getBeanFactory();
   beanFactory.registerSingleton("springApplicationArguments", applicationArguments);
   
   if (printedBanner != null) {
      beanFactory.registerSingleton("springBootBanner", printedBanner);
   }
   if (beanFactory instanceof DefaultListableBeanFactory) {
      ((DefaultListableBeanFactory) beanFactory)
            .setAllowBeanDefinitionOverriding(this.allowBeanDefinitionOverriding);
   }
   
   // Load the sources
   // 获取我们的启动类，就是在SpringApplication初始化时配置的primarySources属性
   Set<Object> sources = getAllSources();
   Assert.notEmpty(sources, "Sources must not be empty");
   
   //加载我们的启动类，将启动类注入容器
   load(context, sources.toArray(new Object[0]));
   
   // 容器完成加载，通知监听器，这一步会将之前SpringApplication初始化时获取到的监听器添加到Spring容器中
   listeners.contextLoaded(context);
}
```

`postProcessApplicationContext()`，检查并加载容器的一些额外配置

```java
protected void postProcessApplicationContext(ConfigurableApplicationContext context) {
   if (this.beanNameGenerator != null) { // 如果SpringApplication设置了实例命名生成器，注册到Spring容器中
      context.getBeanFactory().registerSingleton(AnnotationConfigUtils.CONFIGURATION_BEAN_NAME_GENERATOR,
            this.beanNameGenerator);
   }
   if (this.resourceLoader != null) { // 如果SpringApplication设置了资源加载器，设置到Spring容器中
      if (context instanceof GenericApplicationContext) {
         ((GenericApplicationContext) context).setResourceLoader(this.resourceLoader);
      }
      if (context instanceof DefaultResourceLoader) {
         ((DefaultResourceLoader) context).setClassLoader(this.resourceLoader.getClassLoader());
      }
   }
   if (this.addConversionService) {
      context.getBeanFactory().setConversionService(ApplicationConversionService.getSharedInstance());
   }
}
```

执行`SpringApplication`初始化时配置的容器初始化器，初始化器做的工作包括：比如`ContextIdApplicationContextInitializer`会设置应用程序的id；
`AutoConfigurationReportLoggingInitializer`会给应用程序添加一个条件注解解析器报告等。
当然，我们也能定义自己的初始化器，只要实现`ApplicationContextInitializer`类的`initialize()`方法，并将自定义的类放入`META-INF/spring.factories`配置文件中即可

```java
protected void applyInitializers(ConfigurableApplicationContext context) {
   // 从SpringApplication的initializers集合中获取初始化器并循环调用initialize()方法
   for (ApplicationContextInitializer initializer : getInitializers()) {
      Class<?> requiredType = GenericTypeResolver.resolveTypeArgument(initializer.getClass(),
            ApplicationContextInitializer.class);
      Assert.isInstanceOf(requiredType, context, "Unable to call initializer.");
      initializer.initialize(context);
   }
}
```

### 5. `refreshContext()`---容器刷新
Spring容器的刷新 refresh 方法内部会做很多很多的事情：比如`BeanFactory`的设置、`BeanFactoryPostProcessor`接口的执行、`BeanPostProcessor`接口的执行、自动化配置类的解析、条件注解的解析、国际化的初始化等等

```java
private void refreshContext(ConfigurableApplicationContext context) {
   refresh(context);
   if (this.registerShutdownHook) {
      try {
         context.registerShutdownHook();
      }
      catch (AccessControlException ex) {
         // Not allowed in some environments.
      }
   }
}

protected void refresh(ApplicationContext applicationContext) {
   Assert.isInstanceOf(AbstractApplicationContext.class, applicationContext);
   // 调用创建的容器applicationContext中的refresh()方法
   ((AbstractApplicationContext) applicationContext).refresh();
}

public void refresh() throws BeansException, IllegalStateException {
    synchronized (this.startupShutdownMonitor) {
        /**
         * 刷新上下文环境
         */
        prepareRefresh();

        /**
         * 初始化BeanFactory，解析XML，相当于之前的XmlBeanFactory的操作，
         */
        ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();

        /**
         * 为上下文准备BeanFactory，即对BeanFactory的各种功能进行填充，如常用的注解@Autowired @Qualifier等
         * 添加ApplicationContextAwareProcessor处理器
         * 在依赖注入忽略实现*Aware的接口，如EnvironmentAware、ApplicationEventPublisherAware等
         * 注册依赖，如一个bean的属性中含有ApplicationEventPublisher(beanFactory)，则会将beanFactory的实例注入进去
         */
        prepareBeanFactory(beanFactory);

        try {
            /**
             * 提供子类覆盖的额外处理，即子类处理自定义的BeanFactoryPostProcess
             */
            postProcessBeanFactory(beanFactory);

            /**
             * 激活各种BeanFactory处理器,包括BeanDefinitionRegistryBeanFactoryPostProcessor和普通的BeanFactoryPostProcessor
             * 执行对应的postProcessBeanDefinitionRegistry方法 和  postProcessBeanFactory方法
             */
            invokeBeanFactoryPostProcessors(beanFactory);

            /**
             * 注册拦截Bean创建的Bean处理器，即注册BeanPostProcessor，不是BeanFactoryPostProcessor，注意两者的区别
             * 注意，这里仅仅是注册，并不会执行对应的方法，将在bean的实例化时执行对应的方法
             */
            registerBeanPostProcessors(beanFactory);

            /**
             * 初始化上下文中的资源文件，如国际化文件的处理等
             */
            initMessageSource();

            /**
             * 初始化上下文事件广播器，并放入applicatioEventMulticaster,如ApplicationEventPublisher
             */
            initApplicationEventMulticaster();

            /**
             * 给子类扩展初始化其他Bean
             */
            onRefresh();

            /**
             * 在所有bean中查找listener bean，然后注册到广播器中
             */
            registerListeners();

            /**
             * 设置转换器
             * 注册一个默认的属性值解析器
             * 冻结所有的bean定义，说明注册的bean定义将不能被修改或进一步的处理
             * 初始化剩余的非惰性的bean，即初始化非延迟加载的bean
             */
            finishBeanFactoryInitialization(beanFactory);

            /**
             * 通过spring的事件发布机制发布ContextRefreshedEvent事件，以保证对应的监听器做进一步的处理
             * 即对那种在spring启动后需要处理的一些类，这些类实现了ApplicationListener<ContextRefreshedEvent>，
             * 这里就是要触发这些类的执行(执行onApplicationEvent方法)
             * 另外，spring的内置Event有ContextClosedEvent、ContextRefreshedEvent、ContextStartedEvent、ContextStoppedEvent、RequestHandleEvent
             * 完成初始化，通知生命周期处理器lifeCycleProcessor刷新过程，同时发出ContextRefreshEvent通知其他人
             */
            finishRefresh();
        }

        finally {
    
            resetCommonCaches();
        }
    }
}
```
`refresh`方法在spring整个源码体系中举足轻重，是实现 `ioc` 和 `aop` 的关键，下面会单独讲一讲这个刷新过程。
    
### 6. `afterRefresh()`---Spring容器后置处理
这是一个扩展接口，使用了模板方法，默认为空实现。如果有自定义需求，可以重写该方法。比如打印一些启动结束log，或者一些其它后置处理。
```java
protected void afterRefresh(ConfigurableApplicationContext context, ApplicationArguments args) {}
```

### 7. 触发结束执行监听事件
```java
listeners.started(context);
```
注意：这里的`started()`方法执行的是构建好的Spring容器中的`publishEvent()`方法，与前面的`starting()`有些许不同

```java
@Override
public void started(ConfigurableApplicationContext context) {
   // 这里执行的是Spring容器中的方法
   context.publishEvent(new ApplicationStartedEvent(this.application, this.args, context));
}
```

不过，可以看到最终还是获取了广播器并调用`multicastEvent()`方法执行了事件

```java
protected void publishEvent(Object event, @Nullable ResolvableType eventType) {
   Assert.notNull(event, "Event must not be null");


   // Decorate event as an ApplicationEvent if necessary
   ApplicationEvent applicationEvent;
   if (event instanceof ApplicationEvent) {
      applicationEvent = (ApplicationEvent) event;
   }
   else {
      applicationEvent = new PayloadApplicationEvent<>(this, event);
      if (eventType == null) {
         eventType = ((PayloadApplicationEvent<?>) applicationEvent).getResolvableType();
      }
   }


   // Multicast right now if possible - or lazily once the multicaster is initialized
   if (this.earlyApplicationEvents != null) {
      this.earlyApplicationEvents.add(applicationEvent);
   }
   else {
      // 获取广播器并调用multicastEvent()方法执行事件
      getApplicationEventMulticaster().multicastEvent(applicationEvent, eventType);
   }


   // Publish event via parent context as well...
   if (this.parent != null) {
      if (this.parent instanceof AbstractApplicationContext) {
         ((AbstractApplicationContext) this.parent).publishEvent(event, eventType);
      }
      else {
         this.parent.publishEvent(event);
      }
   }
}
```

### 8. 执行runners
```java
callRunners(context, applicationArguments);
```

检查Spring容器中是否有`ApplicationRunner`和`CommandLineRunner`类型的bean，有的话就遍历他们并执行。我们可以自定义这两个类实现，在程序执行到这一步时就会执行我们自定义的Runners。

```java
private void callRunners(ApplicationContext context, ApplicationArguments args) {
   List<Object> runners = new ArrayList<>();
   // 获取容器中所有的实现了ApplicationRunner的实例
   runners.addAll(context.getBeansOfType(ApplicationRunner.class).values());
   // 获取容器中所有的实现了CommandLineRunner的实例
   runners.addAll(context.getBeansOfType(CommandLineRunner.class).values());
   AnnotationAwareOrderComparator.sort(runners);
   for (Object runner : new LinkedHashSet<>(runners)) {
      if (runner instanceof ApplicationRunner) {
         //执行ApplicationRunner的run方法
         callRunner((ApplicationRunner) runner, args);
      }
      if (runner instanceof CommandLineRunner) {
         //执行CommandLineRunner的run方法
         callRunner((CommandLineRunner) runner, args);
      }
   }
}

/**
* ApplicationRunner的run方法
* @param runner
* @param args
*/
private void callRunner(ApplicationRunner runner, ApplicationArguments args) {
   try {
      (runner).run(args);
   }
   catch (Exception ex) {
      throw new IllegalStateException("Failed to execute ApplicationRunner", ex);
   }
}


/**
* CommandLineRunner的run方法
* @param runner
* @param args
*/
private void callRunner(CommandLineRunner runner, ApplicationArguments args) {
   try {
      (runner).run(args.getSourceArgs());
   }
   catch (Exception ex) {
      throw new IllegalStateException("Failed to execute CommandLineRunner", ex);
   }
}
```
最后，在容器启动完成前的最后一刻调用`listeners.running(context)`方法，通知大家Spring容器启动成功，然后将容器返回。到此为止，Spring容器的启动流程分析就结束了。
