---
title: SpringBoot源码学习(三)---内置Servlet容器加载流程
categories: 后端技术
tags: SpringBoot
abbrlink: 30562
date: 2020-08-24 16:28:26
---

`SpringBoot` 中内置了 `Servlet` 容器，支持 `Tomcat` ， `Jetty` 和 `Undertow` 服务器，所以可以直接运行。相比之下，传统的`JavaWeb`程序则需要嵌入到`Tomcat`之类的 `Servlet` 容器中才能运行。接下来就来学习一下， `SpringBoot` 加载内置的 `Servlet` 容器的流程。

<!--more-->

## 一、相关类介绍
### `WebServer` 
`SpringBoot` 对内置的 `Servlet` 容器做了一层封装
```java
public interface WebServer {
   // 启动内置的Servlet容器
   void start() throws WebServerException;

   // 关闭内置Servlet容器
   void stop() throws WebServerException;
   
   // 获取内置Servlet容器监听的端口
   int getPort();
}
```
它目前有下图中五个实现类，对应了四种容器 `Jetty` 、 `Tomcat` 、 `UnderTow` 、 `Netty` ，其中 `Netty` 不是 `Servlet` 容器。
![Java中的五中Servlet实现类](https://ae01.alicdn.com/kf/U6bea8f9a32c54e1ba5f5f607cbf5fe6d8.jpg)

### `ServletWebServerFactory` 
`ServletWebServerFactory` 是一个工厂接口，用来生产 `WebServer` 。
```java
@FunctionalInterface
public interface ServletWebServerFactory {
   // 获取已经配置好的内置Servlet容器，这个容器还没有监听端口，需要手动调用内置Servlet容器的start方法进行监听
   WebServer getWebServer(ServletContextInitializer... initializers);
}
```

### `ServletContextInitializer` 
`ServletContextInitializer` 是 **Servlet初始化器**，用于配置 `ServletContext` ，在调用 `getWebServer()` 方法创建 **Servlet内置容器** 的时候会调用它的 `onStartup()` 方法，`getWebServer()` 方法何时调用会在后续讲 Servlet 容器的创建和启动时讲到。
```java
public interface ServletContextInitializer {
   // 对ServletContext进行一些配置
   void onStartup(ServletContext servletContext) throws ServletException;
}
```

### `ServletWebServerFactoryAutoConfiguration`
下面我们来看看 `ServletWebServerFactory` 是怎么被注册到Spring容器中的。找到 `ServletWebServerFactoryAutoConfiguration.class`，这个类是 Servlet 容器的自动配置类，可以在 `spring.factories` 中找到这个类。
```java
@Configuration
// 最高优先级
@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnClass(ServletRequest.class)
// 只有在servlet型环境下才起作用
@ConditionalOnWebApplication(type = Type.SERVLET)
@EnableConfigurationProperties(ServerProperties.class)
// 配置三种类型的容器工厂Bean
// 并Import一个内部类BeanPostProcessorsRegistrar，用来注册一个WebServerFactoryCustomizerBeanPostProcessor到Spring容器中，这个类主要用来调用WebServerFactoryCustomizer的实现类，来完成对WebServerFactory进行自定义
@Import({ ServletWebServerFactoryAutoConfiguration.BeanPostProcessorsRegistrar.class,
      ServletWebServerFactoryConfiguration.EmbeddedTomcat.class,
      ServletWebServerFactoryConfiguration.EmbeddedJetty.class,
      ServletWebServerFactoryConfiguration.EmbeddedUndertow.class })
public class ServletWebServerFactoryAutoConfiguration {

   @Bean
   public ServletWebServerFactoryCustomizer servletWebServerFactoryCustomizer(ServerProperties serverProperties) {
      return new ServletWebServerFactoryCustomizer(serverProperties);
   }

   @Bean
   @ConditionalOnClass(name = "org.apache.catalina.startup.Tomcat")
   public TomcatServletWebServerFactoryCustomizer tomcatServletWebServerFactoryCustomizer(
         ServerProperties serverProperties) {
      return new TomcatServletWebServerFactoryCustomizer(serverProperties);
   }

   // 在ServletWebServerFactoryAutoConfiguration自动配置类中被导入，实现了BeanFactoryAware接口(BeanFactory会被自动注入进来)和ImportBeanDefinitionRegistrar接口(会被ConfigurationClassBeanDefinitionReader解析并注册到Spring容器中)
   public static class BeanPostProcessorsRegistrar implements ImportBeanDefinitionRegistrar, BeanFactoryAware {

      private ConfigurableListableBeanFactory beanFactory;

      // 配置beanFactory
      @Override
      public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
         if (beanFactory instanceof ConfigurableListableBeanFactory) {
            this.beanFactory = (ConfigurableListableBeanFactory) beanFactory;
         }
      }

      @Override
      public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata,
            BeanDefinitionRegistry registry) {
         if (this.beanFactory == null) {
            return;
         }
         registerSyntheticBeanIfMissing(registry, "webServerFactoryCustomizerBeanPostProcessor",
               WebServerFactoryCustomizerBeanPostProcessor.class);
         registerSyntheticBeanIfMissing(registry, "errorPageRegistrarBeanPostProcessor",
               ErrorPageRegistrarBeanPostProcessor.class);
      }

      private void registerSyntheticBeanIfMissing(BeanDefinitionRegistry registry, String name, Class<?> beanClass) {
         // 如果Spring容器中不存在WebServerFactoryCustomizerBeanPostProcessor和ErrorPageRegistrarBeanPostProcessor类型的bean
         if (ObjectUtils.isEmpty(this.beanFactory.getBeanNamesForType(beanClass, true, false))) {
            RootBeanDefinition beanDefinition = new RootBeanDefinition(beanClass);
            beanDefinition.setSynthetic(true);
            // 则重新注册一个
            registry.registerBeanDefinition(name, beanDefinition);
         }
      }
   }
}
```
可以看到上面的自动配置类中导入了三个 `ServletWebServerFactoryConfiguration` `的内部类，ServletWebServerFactory` 的注册就是在这儿完成的。
```java
@Configuration
class ServletWebServerFactoryConfiguration {

   @Configuration
   // Tomcat、Servlet和UpgradeProtocol类必须在classLoader中存在
   // 这三个类都在tomcat包下
   // springboot默认使用tomcat作为servlet容器，在引入的spring-boot-starter-web这个依赖中就包含了tomcat依赖
   @ConditionalOnClass({ Servlet.class, Tomcat.class, UpgradeProtocol.class })
   @ConditionalOnMissingBean(value = ServletWebServerFactory.class, search = SearchStrategy.CURRENT)
   public static class EmbeddedTomcat {
      // 将创建Tomcat容器的工厂注册到Spring容器中
      @Bean
      public TomcatServletWebServerFactory tomcatServletWebServerFactory() {
         return new TomcatServletWebServerFactory();
      }
   }

   /**
    * Nested configuration if Jetty is being used.
    */
   @Configuration
   @ConditionalOnClass({ Servlet.class, Server.class, Loader.class, WebAppContext.class })
   @ConditionalOnMissingBean(value = ServletWebServerFactory.class, search = SearchStrategy.CURRENT)
   public static class EmbeddedJetty {
      // 将创建Jetty容器的工厂注册到Spring容器中
      @Bean
      public JettyServletWebServerFactory JettyServletWebServerFactory() {
         return new JettyServletWebServerFactory();
      }
   }

   /**
    * Nested configuration if Undertow is being used.
    */
   @Configuration
   @ConditionalOnClass({ Servlet.class, Undertow.class, SslClientAuthMode.class })
   @ConditionalOnMissingBean(value = ServletWebServerFactory.class, search = SearchStrategy.CURRENT)
   public static class EmbeddedUndertow {
      // 将创建Undertow容器的工厂注册到Spring容器中
      @Bean
      public UndertowServletWebServerFactory undertowServletWebServerFactory() {
         return new UndertowServletWebServerFactory();
      }
   }
}
```

### `WebServerFactoryCustomizerBeanPostProcessor` 
`WebServerFactoryCustomizerBeanPostProcessor` 是一个 `BeanPostProcessor` ，它在 `postProcessBeforeInitialization` 过程中去寻找 Spring 容器中 `WebServerFactoryCustomizer` 类型的Bean，并依次调用这个接口的 `customize()` 方法对内置容器工厂做一些定制化：
```java
@Override
public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
    // 在Spring容器中寻找WebServerFactor类型的Bean，SpringBoot内部的三种内置Servlet容器工厂都实现了这个接口，该接口的作用就是完成servlet容器的配置，注意这个类和ServletWebServerFactory不同
    // 比如添加Servlet初始化器addInitializers、添加错误页addErrorPages、设置session超时时间setSessionTimeout、设置端口setPort等等
   if (bean instanceof WebServerFactory) {
      postProcessBeforeInitialization((WebServerFactory) bean);
   }
   return bean;
}

private void postProcessBeforeInitialization(WebServerFactory webServerFactory) {
   LambdaSafe.callbacks(WebServerFactoryCustomizer.class, getCustomizers(), webServerFactory)
         .withLogger(WebServerFactoryCustomizerBeanPostProcessor.class)
         // 遍历获取的每个定制化器，并调用customize方法
         .invoke((customizer) -> customizer.customize(webServerFactory));
}

private Collection<WebServerFactoryCustomizer<?>> getCustomizers() {
   if (this.customizers == null) {
      // Look up does not include the parent context
      // 找出所有的定制化器
      this.customizers = new ArrayList<>(getWebServerFactoryCustomizerBeans());
      // 定制化器排序
      this.customizers.sort(AnnotationAwareOrderComparator.INSTANCE);
      this.customizers = Collections.unmodifiableList(this.customizers);
   }
   return this.customizers;
}

private Collection<WebServerFactoryCustomizer<?>> getWebServerFactoryCustomizerBeans() {
   // 找出Spring容器中WebServerFactoryCustomizer类型的Bean
   return (Collection) this.beanFactory.getBeansOfType(WebServerFactoryCustomizer.class, false, false).values();
}
```
`WebServerFactoryCustomizer` 这个类主要作用就是对内置的容器工厂进行一些定制化处理，比如设置端口，地址，错误页面等
```java
@FunctionalInterface
public interface WebServerFactoryCustomizer<T extends WebServerFactory> {
   // 对内置容器工厂进行定制化处理
   void customize(T factory);
}
```
OK，到这为止，主要的涉及到加载 **内置Servlet容器** 的类都介绍完了，下面就以 `tomcat` 为例来看看内置 `Servlet` 的创建和启动流程。

---

## 二、Servlet的创建
回到之前看的 `SpringBoot` 启动代码上
```java
public ConfigurableApplicationContext run(String... args) {
   // 计时工具
   StopWatch stopWatch = new StopWatch();
   stopWatch.start(); // 开始计时，记录开始时间
   
   ConfigurableApplicationContext context = null;
   Collection<SpringBootExceptionReporter> exceptionReporters = new ArrayList<>();
   
   configureHeadlessProperty();
   
   // 1.获取并启动监听器
   SpringApplicationRunListeners listeners = getRunListeners(args);
   listeners.starting();
   
   try {
      ApplicationArguments applicationArguments = new DefaultApplicationArguments(args); // 构造一个应用程序参数持有类
      
      // 2.根据SpringApplicationRunListeners和参数来准备环境
      ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);
      configureIgnoreBeanInfo(environment);

      Banner printedBanner = printBanner(environment); 

      // 3.创建Spring容器
      context = createApplicationContext();
      
      exceptionReporters = getSpringFactoriesInstances(SpringBootExceptionReporter.class,
            new Class[] { ConfigurableApplicationContext.class }, context);
      
      // 4.准备Spring容器
      prepareContext(context, environment, listeners, applicationArguments, printedBanner);
      
      // 5.刷新容器。
      refreshContext(context);
      
      // 6.Spring容器后置处理
      afterRefresh(context, applicationArguments);
      
      stopWatch.stop(); // 记录结束时间
      if (this.logStartupInfo) {
         new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), stopWatch);
      }
      
      // 7.触发结束执行的监听事件
      listeners.started(context);
      
      // 8.执行Runners
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

### 容器的创建
重点看一下第三步---**创建Spring容器**
```java
protected ConfigurableApplicationContext createApplicationContext() {
   Class<?> contextClass = this.applicationContextClass;
   if (contextClass == null) {
      try {
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
   return (ConfigurableApplicationContext) BeanUtils.instantiateClass(contextClass);
}
```
根据 `webApplicationType` 判断当前服务的类型，然后创建对应的 `Spring` 容器，以 `web` 程序为例，这里就会执行
```java
contextClass = Class.forName(DEFAULT_SERVLET_WEB_CONTEXT_CLASS);
```
对应的类是`AnnotationConfigServletWebServerApplicationContext`，因此最终创建的容器就是`AnnotationConfigServletWebServerApplicationContext`
![](https://ae01.alicdn.com/kf/U057c7dcbcaf84639b7485ed4edbc442cY.jpg)

### 容器的配置
再来看一下第五步---**刷新容器**
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
   // 调用容器的 refresh() 方法进行刷新
   ((AbstractApplicationContext) applicationContext).refresh();
}
```
进到 `refresh()` 方法中看一下
```java
public void refresh() throws BeansException, IllegalStateException {
   synchronized (this.startupShutdownMonitor) {
      // Prepare this context for refreshing.
      prepareRefresh();

      // Tell the subclass to refresh the internal bean factory.
      ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();

      // Prepare the bean factory for use in this context.
      prepareBeanFactory(beanFactory);

      try {
         // Allows post-processing of the bean factory in context subclasses.
         postProcessBeanFactory(beanFactory);

         // Invoke factory processors registered as beans in the context.
         invokeBeanFactoryPostProcessors(beanFactory);

         // Register bean processors that intercept bean creation.
         registerBeanPostProcessors(beanFactory);

         // Initialize message source for this context.
         initMessageSource();

         // Initialize event multicaster for this context.
         initApplicationEventMulticaster();

         // Initialize other special beans in specific context subclasses.
         onRefresh();

         // Check for listener beans and register them.
         registerListeners();

         // Instantiate all remaining (non-lazy-init) singletons.
         finishBeanFactoryInitialization(beanFactory);

         // Last step: publish corresponding event.
         finishRefresh();
      }

      catch (BeansException ex) {
         if (logger.isWarnEnabled()) {
            logger.warn("Exception encountered during context initialization - " +
                  "cancelling refresh attempt: " + ex);
         }

         // Destroy already created singletons to avoid dangling resources.
         destroyBeans();

         // Reset 'active' flag.
         cancelRefresh(ex);

         // Propagate exception to caller.
         throw ex;
      }

      finally {
         // Reset common introspection caches in Spring's core, since we
         // might not ever need metadata for singleton beans anymore...
         resetCommonCaches();
      }
   }
}
```
看一下 `onRefresh()` 这个方法
```java
protected void onRefresh() throws BeansException {
   // For subclasses: do nothing by default.
}
```
是个空方法，但是使用了 `protected` 进行修饰，也就是子类可以重写这个方法，那我们去子类看一下具体的实现，进到 `ServletWebServerApplicationContext` 这个类中，这个类是我们之前创建的Spring容器 `AnnotationConfigServletWebServerApplicationContext` 的父类。这个类实现了`onRefresh()`方法，在其中完成了对内置Servlet容器的获取。
```java
protected void onRefresh() {
   super.onRefresh();
   try {
      // 核心方法，获取内置容器工厂，并通过工厂获取Servlet容器
      createWebServer();
   }
   catch (Throwable ex) {
      throw new ApplicationContextException("Unable to start web server", ex);
   }
}

private void createWebServer() {
   WebServer webServer = this.webServer;
   ServletContext servletContext = getServletContext();
   // 内置Servlet容器和ServletContext都没初始化的时候执行
   if (webServer == null && servletContext == null) {
      // 从Spring容器中获取内置容器工厂，如果包含多个ServletWebServerFactory或者不存在则会抛出异常终止程序
      ServletWebServerFactory factory = getWebServerFactory();
      // 通过工厂获取Servlet容器，并调用Servlet初始化器中的 onStartUp() 方法
      this.webServer = factory.getWebServer(getSelfInitializer());
   }
   // 内置容器已经初始化但是servletContext还没初始化的时候执行
   else if (servletContext != null) {
      try {    
         // 调用已经存在的Servlet初始化器中的onStartUp()方法
         getSelfInitializer().onStartup(servletContext);
      }
      catch (ServletException ex) {
         throw new ApplicationContextException("Cannot initialize servlet context", ex);
      }
   }
   initPropertySources();
}
```
`getWebServerFactory()`,获取内置容器工厂,上面我们讲过三种内置 `Servlet` 工厂的注册过程
```java
protected ServletWebServerFactory getWebServerFactory() {
   // Use bean names so that we don't consider the hierarchy\
   // 从Spring容器中获取ServletWebServerFactory.class类型的Bean
   String[] beanNames = getBeanFactory().getBeanNamesForType(ServletWebServerFactory.class);
   if (beanNames.length == 0) {
      throw new ApplicationContextException("Unable to start ServletWebServerApplicationContext due to missing "
            + "ServletWebServerFactory bean.");
   }
   if (beanNames.length > 1) {
      throw new ApplicationContextException("Unable to start ServletWebServerApplicationContext due to multiple "
            + "ServletWebServerFactory beans : " + StringUtils.arrayToCommaDelimitedString(beanNames));
   }
   // 实例化ServletWebServerFactory.class
   return getBeanFactory().getBean(beanNames[0], ServletWebServerFactory.class);
}
```
再来看一下 `getSelfInitializer()` 这个方法，这是一个函数式接口，它主要就是获取 **Servlet初始化器**，这个初始化器内部会构造一个`ServletContextInitializerBeans`(**Servlet初始化器---ServletContextInitializer的集合**)，`ServletContextInitializerBeans`构造时会去 Spring 容器中寻找 `ServletContextInitializer` 类型的bean，其中 `ServletRegistrationBean`、`FilterRegistrationBean`、`ServletListenerRegistrationBean`会被找出(如果有定义)
```java
private org.springframework.boot.web.servlet.ServletContextInitializer getSelfInitializer() {
   return this::selfInitialize;
}

private void selfInitialize(ServletContext servletContext) throws ServletException {
   prepareWebApplicationContext(servletContext);
   registerApplicationScope(servletContext);
   WebApplicationContextUtils.registerEnvironmentBeans(getBeanFactory(), servletContext);
   // 获取所有的 ServletContextInitializer 实现类
   for (ServletContextInitializer beans : getServletContextInitializerBeans()) {
      // 执行所有获取到的 ServletContextInitializer 的 onStartUp() 方法
      beans.onStartup(servletContext);
   }
}
```
`getServletContextInitializerBeans()`方法
```java
protected Collection<ServletContextInitializer> getServletContextInitializerBeans() {
   // 构造一个ServletContextInitializerBeans，这个类是 ServletContextInitializer 实现类的集合
   return new ServletContextInitializerBeans(getBeanFactory());
}
```
`ServletContextInitializerBeans`对象是对`ServletContextInitializer`的一种包装
```java
public class ServletContextInitializerBeans extends AbstractCollection<ServletContextInitializer> {
   private final MultiValueMap<Class<?>, ServletContextInitializer> initializers;

   private final List<Class<? extends ServletContextInitializer>> initializerTypes;
  
   private List<ServletContextInitializer> sortedList;

   public ServletContextInitializerBeans(ListableBeanFactory beanFactory,
         Class<? extends ServletContextInitializer>... initializerTypes) {
      this.initializers = new LinkedMultiValueMap<>();
      // 存放 ServletContextInitializer.class，后续会获取这个类型的Bean
      this.initializerTypes = (initializerTypes.length != 0) ? Arrays.asList(initializerTypes)
            : Collections.singletonList(ServletContextInitializer.class);
      // 获取 ServletContextInitializer 类型的bean，并添加到集合中
      addServletContextInitializerBeans(beanFactory);
      addAdaptableBeans(beanFactory);
      List<ServletContextInitializer> sortedInitializers = this.initializers.values().stream()
            .flatMap((value) -> value.stream().sorted(AnnotationAwareOrderComparator.INSTANCE))
            .collect(Collectors.toList());
      this.sortedList = Collections.unmodifiableList(sortedInitializers);
      logMappings(this.initializers);
   }
}
```
`addServletContextInitializerBeans()`方法，在这里获取所有`ServletContextInitializer`类型的 `bean` ，并存放到`initializers`中。
```java
private void addServletContextInitializerBeans(ListableBeanFactory beanFactory) {
   for (Class<? extends ServletContextInitializer> initializerType : this.initializerTypes) {
      //获取所有ServletContextInitializer类型的bean
      for (Entry<String, ? extends ServletContextInitializer> initializerBean : getOrderedBeansOfType(beanFactory,
            initializerType)) {
         // 存放到集合中
         addServletContextInitializerBean(initializerBean.getKey(), initializerBean.getValue(), beanFactory);
      }
   }
}

// 在这里获取到我们自定义的ServletRegistrationBean、FilterRegistrationBean、ServletListenerRegistrationBean，并加入到initializers集合中
private void addServletContextInitializerBean(String beanName, ServletContextInitializer initializer, ListableBeanFactory beanFactory) {
   // 判断是不是ServletRegistrationBean类型
   if (initializer instanceof ServletRegistrationBean) {
      Servlet source = ((ServletRegistrationBean<?>) initializer).getServlet();
      addServletContextInitializerBean(Servlet.class, beanName, initializer, beanFactory, source);
   }
   // 判断是不是FilterRegistrationBean类型
   else if (initializer instanceof FilterRegistrationBean) {
      Filter source = ((FilterRegistrationBean<?>) initializer).getFilter();
      addServletContextInitializerBean(Filter.class, beanName, initializer, beanFactory, source);
   }
   else if (initializer instanceof DelegatingFilterProxyRegistrationBean) {
      String source = ((DelegatingFilterProxyRegistrationBean) initializer).getTargetBeanName();
      addServletContextInitializerBean(Filter.class, beanName, initializer, beanFactory, source);
   }
   else if (initializer instanceof ServletListenerRegistrationBean) {
      EventListener source = ((ServletListenerRegistrationBean<?>) initializer).getListener();
      addServletContextInitializerBean(EventListener.class, beanName, initializer, beanFactory, source);
   }
   else {
      addServletContextInitializerBean(ServletContextInitializer.class, beanName, initializer, beanFactory,
            initializer);
   }
}

private void addServletContextInitializerBean(Class<?> type, String beanName, ServletContextInitializer initializer,
      ListableBeanFactory beanFactory, Object source) {
   // 存放到initializers集合中
   this.initializers.add(type, initializer);
   if (source != null) {
      // Mark the underlying source as seen in case it wraps an existing bean
      // 将添加过的Bean做一个标记，防止重复添加
      this.seen.add(source);
   }
   if (logger.isTraceEnabled()) {
      String resourceDescription = getResourceDescription(beanName, beanFactory);
      int order = getOrder(initializer);
      logger.trace("Added existing " + type.getSimpleName() + " initializer bean '" + beanName + "'; order="
            + order + ", resource=" + resourceDescription);
   }
}
```
这些 `ServletContextInitializer` 类型的 `bean` 例如 `ServletRegistrationBean.class`，通过 `SpringBoot` 的 `AutoConfiguration` 装配到 `Spring` 容器 中，在注册时会将对应的 `Servlet` 添加到自己的参数中，我们以 `DispatchServletRegistrationBean` 为例来看一下
```java
@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE)
@Configuration
@ConditionalOnWebApplication(type = Type.SERVLET)
// classpath中必须存在DispatcherServlet.class的字节码
@ConditionalOnClass(DispatcherServlet.class)
// 这个配置类的执行要在EmbeddedServletContainerAutoConfiguration配置类生效之后执行
@AutoConfigureAfter(ServletWebServerFactoryAutoConfiguration.class)
public class DispatcherServletAutoConfiguration {
   public static final String DEFAULT_DISPATCHER_SERVLET_BEAN_NAME = "dispatcherServlet";

   public static final String DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME = "dispatcherServletRegistration";

   @Configuration
   @Conditional(DefaultDispatcherServletCondition.class)
   @ConditionalOnClass(ServletRegistration.class)
   @EnableConfigurationProperties({ HttpProperties.class, WebMvcProperties.class })
   protected static class DispatcherServletConfiguration {
      private final HttpProperties httpProperties;

      private final WebMvcProperties webMvcProperties;

      public DispatcherServletConfiguration(HttpProperties httpProperties, WebMvcProperties webMvcProperties) {
         this.httpProperties = httpProperties;
         this.webMvcProperties = webMvcProperties;
      }

      // 注册dispatcherServlet
      @Bean(name = DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)
      public DispatcherServlet dispatcherServlet() {
         // 构造一个DispatcherServlet，并添加一些webMvcProperties配置
         DispatcherServlet dispatcherServlet = new DispatcherServlet();
         dispatcherServlet.setDispatchOptionsRequest(this.webMvcProperties.isDispatchOptionsRequest());
         dispatcherServlet.setDispatchTraceRequest(this.webMvcProperties.isDispatchTraceRequest());
         dispatcherServlet
               .setThrowExceptionIfNoHandlerFound(this.webMvcProperties.isThrowExceptionIfNoHandlerFound());
         dispatcherServlet.setEnableLoggingRequestDetails(this.httpProperties.isLogRequestDetails());
         return dispatcherServlet;
      }

      // 注册文件上传相关的Bean
      @Bean
      @ConditionalOnBean(MultipartResolver.class)
      @ConditionalOnMissingBean(name = DispatcherServlet.MULTIPART_RESOLVER_BEAN_NAME)
      public MultipartResolver multipartResolver(MultipartResolver resolver) {
         // Detect if the user has created a MultipartResolver but named it incorrectly
         return resolver;
      }
   }


   @Configuration
   @Conditional(DispatcherServletRegistrationCondition.class)
   // classPath中必须存在ServletRegistration.class，毕竟DispatcherServletRegistrationBean.class是它的实现类
   @ConditionalOnClass(ServletRegistration.class)
   @EnableConfigurationProperties(WebMvcProperties.class)
   @Import(DispatcherServletConfiguration.class)
   protected static class DispatcherServletRegistrationConfiguration {
      private final WebMvcProperties webMvcProperties;

      private final MultipartConfigElement multipartConfig;

      public DispatcherServletRegistrationConfiguration(WebMvcProperties webMvcProperties,
            ObjectProvider<MultipartConfigElement> multipartConfigProvider) {
         this.webMvcProperties = webMvcProperties;
         this.multipartConfig = multipartConfigProvider.getIfAvailable();
      }

      // 注册DispatcherServletRegistrationBean
      @Bean(name = DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME)
      @ConditionalOnBean(value = DispatcherServlet.class, name = DEFAULT_DISPATCHER_SERVLET_BEAN_NAME)
      public DispatcherServletRegistrationBean dispatcherServletRegistration(DispatcherServlet dispatcherServlet) {
         // 构造一个DispatcherServletRegistrationBean，并将dispatcherServlet作为参数传入
         DispatcherServletRegistrationBean registration = new DispatcherServletRegistrationBean(dispatcherServlet,
               this.webMvcProperties.getServlet().getPath());
         registration.setName(DEFAULT_DISPATCHER_SERVLET_BEAN_NAME);
         registration.setLoadOnStartup(this.webMvcProperties.getServlet().getLoadOnStartup());
         if (this.multipartConfig != null) {
            registration.setMultipartConfig(this.multipartConfig);
         }
         return registration;
      }
   }
}
```
这些`ServletContextInitializer`类型的`Bean`注册到Spring容器之后，在`addServletContextInitializerBeans()`方法中就会被获取到并存放到`initializers`集合中。

再来看看另一个方法`addAdaptableBeans(beanFactory)`，与上面的方法不同，这个是直接获取`Servlet.class`和`Filter.class`类型的`Bean`，并通过对应的`adapter`将其构建为`RegistrationBean`对象
```java
protected void addAdaptableBeans(ListableBeanFactory beanFactory) {
   MultipartConfigElement multipartConfig = getMultipartConfig(beanFactory);
   // 从Spring容器中获取所有的Servlet.class和Filter.class类型的bean，并封装成RegistrationBean对象，加入到集合汇总
   addAsRegistrationBean(beanFactory, Servlet.class, new ServletRegistrationBeanAdapter(multipartConfig));
   addAsRegistrationBean(beanFactory, Filter.class, new FilterRegistrationBeanAdapter());
   for (Class<?> listenerType : ServletListenerRegistrationBean.getSupportedTypes()) {
      addAsRegistrationBean(beanFactory, EventListener.class, (Class<EventListener>) listenerType,
            new ServletListenerRegistrationBeanAdapter());
   }
}

protected <T> void addAsRegistrationBean(ListableBeanFactory beanFactory, Class<T> type,
      RegistrationBeanAdapter<T> adapter) {
   addAsRegistrationBean(beanFactory, type, type, adapter);
}

private <T, B extends T> void addAsRegistrationBean(ListableBeanFactory beanFactory, Class<T> type,
      Class<B> beanType, RegistrationBeanAdapter<T> adapter) {
   // 从Spring容器中获取Servlet.class和Filter.class类型的Bean，并且尚未被加入到this.seen集合中的
   List<Map.Entry<String, B>> entries = getOrderedBeansOfType(beanFactory, beanType, this.seen);
   for (Entry<String, B> entry : entries) {
      String beanName = entry.getKey();
      B bean = entry.getValue();
      if (this.seen.add(bean)) {
         // One that we haven't already seen
         // 通过ServletRegistrationBeanAdapter和FilterRegistrationBeanAdapter两个适配器将Servlet.class和Filter.class类型的bean包装成RegistrationBean对象
         RegistrationBean registration = adapter.createRegistrationBean(beanName, bean, entries.size());
         int order = getOrder(bean);
         registration.setOrder(order);
         // 添加到initializers集合中
         this.initializers.add(type, registration);
         if (logger.isTraceEnabled()) {
            logger.trace("Created " + type.getSimpleName() + " initializer for bean '" + beanName + "'; order="
                  + order + ", resource=" + getResourceDescription(beanName, beanFactory));
         }
      }
   }
}
```
通过 `ServletRegistrationBeanAdapter` 和 `FilterRegistrationBeanAdapter` 将 `Servlet.class` 和 `Fliter.class` 封装成`ServletRegistrationBean`对象和`FilterRegistrationBean`对象，这**与前通过`AutoConfiguration`自动装配的`RegistrationBean`是一样的**
```java
private static class ServletRegistrationBeanAdapter implements RegistrationBeanAdapter<Servlet> {
   private final MultipartConfigElement multipartConfig;

   ServletRegistrationBeanAdapter(MultipartConfigElement multipartConfig) {
      this.multipartConfig = multipartConfig;
   }

   @Override
   public RegistrationBean createRegistrationBean(String name, Servlet source, int totalNumberOfSourceBeans) {
      String url = (totalNumberOfSourceBeans != 1) ? "/" + name + "/" : "/";
      if (name.equals(DISPATCHER_SERVLET_NAME)) {
         url = "/"; // always map the main dispatcherServlet to "/"
      }
      // 将Servlet.class实例封装成ServletRegistrationBean对象
      ServletRegistrationBean<Servlet> bean = new ServletRegistrationBean<>(source, url);
      bean.setName(name);
      bean.setMultipartConfig(this.multipartConfig);
      return bean;
   }
}

private static class FilterRegistrationBeanAdapter implements RegistrationBeanAdapter<Filter> {
   @Override
   public RegistrationBean createRegistrationBean(String name, Filter source, int totalNumberOfSourceBeans) {
      // 将Filter.class实例封装成FilterRegistrationBean对象
      FilterRegistrationBean<Filter> bean = new FilterRegistrationBean<>(source);
      bean.setName(name);
      return bean;
   }
}
```
下面这些 `Bean` 就是通过上面两个方法获取到的 `ServletContextInitializer` 类型的实例
![ServletContextInitializer类型的实例](https://ae01.alicdn.com/kf/U0799dee9f7204848bf55cfa5309a45c5Q.jpg)

获取到了所有 `ServletContextInitializer` 类型的 `Bean` 之后，就该调用它们的 `onStartUp()` 方法了，下面就以 `ServletRegistrationBean` 为例来看一下这个方法，先来看一下类关系图
![ServletRegistrationBean的类关系图](https://ae01.alicdn.com/kf/U75e56c15f3124f32a624fd9928842817M.jpg)

当调用 `ServletContextInitializer` 的 `onStartUp()` 方法时，首先进入到`RegistrationBean`类中
```java
public abstract class RegistrationBean implements ServletContextInitializer, Ordered {
   @Override
   public final void onStartup(ServletContext servletContext) throws ServletException {
      String description = getDescription();
      if (!isEnabled()) {
         logger.info(StringUtils.capitalize(description) + " was not registered (disabled)");
         return;
      }
      // 调用子类代码配置servletContext
      register(description, servletContext);
   }
}

protected abstract void register(String description, ServletContext servletContext);
```
接着看`RegistrationBean`的子类`DynamicRegistrationBean`
```java
public abstract class DynamicRegistrationBean<D extends Registration.Dynamic> extends RegistrationBean {
   @Override
   protected final void register(String description, ServletContext servletContext) {
      // 关键代码，调用子类ServletRegistrationBean的方法获取Servlet的name，然后调用SerlvetContext的addServlet方法将Servlet加入到Tomcat中
      D registration = addRegistration(description, servletContext);
      if (registration == null) {
         logger.info(
               StringUtils.capitalize(description) + " was not registered " + "(possibly already registered?)");
         return;
      }
      // 完成一些额外的配置
      configure(registration);
   }
}
```
最后再看`DynamicRegistrationBean`的子类`ServletRegistrationBean`
```java
protected String getDescription() {
   Assert.notNull(this.servlet, "Servlet must not be null");
   return "servlet " + getServletName();
}

protected ServletRegistration.Dynamic addRegistration(String description, ServletContext servletContext) {
   // 获取Servlet的name
   String name = getServletName();
   // 将Servlet加入到内置Servlet容器中
   return servletContext.addServlet(name, this.servlet);
}

protected void configure(ServletRegistration.Dynamic registration) {
   super.configure(registration);
   String[] urlMapping = StringUtils.toStringArray(this.urlMappings);
   if (urlMapping.length == 0 && this.alwaysMapUrl) {
      urlMapping = DEFAULT_MAPPINGS;
   }
   if (!ObjectUtils.isEmpty(urlMapping)) {
      registration.addMapping(urlMapping);
   }
   registration.setLoadOnStartup(this.loadOnStartup);
   if (this.multipartConfig != null) {
      registration.setMultipartConfig(this.multipartConfig);
   }
}
```
进行完以上 `onStartUp()` 方法后，`Servlet`就被加入到`Tomcat`中了，这样我们就能发送请求给这个`Servlet`了。

`Filter`的配置流程同上，将`Filter`通过`addFilter()`加入到`Tomcat`中之后，`Filter`就能进行请求拦截了。
```java
protected Dynamic addRegistration(String description, ServletContext servletContext) {
   Filter filter = getFilter();
   return servletContext.addFilter(getOrDeduceName(filter), filter);
}
```

---

## 三、Servlet的启动
`Servlet` 容器创建完毕之后在 `finishRefresh()` 方法中会被启动，让我们回到 `ServletWebServerApplicationContext.class` 中
```java
@Override
protected void finishRefresh() {
   super.finishRefresh();
   // 启动内置Servlet容器
   WebServer webServer = startWebServer();
   if (webServer != null) {
      // 内置Servlet容器启动成功，发布ServletWebServerInitializedEvent事件
      publishEvent(new ServletWebServerInitializedEvent(webServer, this));
   }
}

private WebServer startWebServer() {
   // 拿到在onRefresh方法中构造的内置Servlet容器webServer
   WebServer webServer = this.webServer;
   if (webServer != null) {
      // 启动
      webServer.start();
   }
   return webServer;
}
```

到此为止，内置的 `Servlet` 容器就完成了创建和启动的流程。

















