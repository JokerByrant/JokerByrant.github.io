---
title: SpringBoot源码学习(二)---Spring容器refresh流程
categories: 后端技术
tags: SpringBoot
abbrlink: 34219
date: 2020-06-13 10:18:29
---

上一篇学习了 `SpringBoot` 启动流程相关的源码，在 `Spring` 容器创建完成后，会执行容器刷新 `refreshContext(context)` 操作，这个阶段容器会做很多事情，结合源码一起来看一下。

<!--more-->

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
   // 执行容器的refresh()方法
   ((AbstractApplicationContext) applicationContext).refresh();
}
```

还是拿最熟悉的 `web` 程序为例，对应的 `Spring` 容器是 `AnnotationConfigServletWebServerApplicationContext.class`，上面的 `refresh()` 方法调用的是它的的父类 `AbstractApplicationContext.class中的refresh` 方法。

```java
public void refresh() throws BeansException, IllegalStateException {
   synchronized (this.startupShutdownMonitor) {
      // 1. 执行刷新前的一些准备操作，设置其启动日期和活动标志以及执行一些属性的初始化
      prepareRefresh();

      // 2. 调用子类中的方法刷新beanFactory，用于获取一个新的beanFactory
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

---

## 1.`prepareRefresh()`方法
表示在真正执行 `refresh` 之前需要准备的事情
```java
/**
* Prepare this context for refreshing, setting its startup date and
* active flag as well as performing any initialization of property sources.
*/
protected void prepareRefresh() {
   // Switch to active.
   // 记录容器启动时间
   this.startupDate = System.currentTimeMillis();
   // 撤销关闭状态
   this.closed.set(false);
   // 开启活跃状态
   this.active.set(true);


   if (logger.isDebugEnabled()) {
      if (logger.isTraceEnabled()) {
         logger.trace("Refreshing " + this);
      }
      else {
         logger.debug("Refreshing " + getDisplayName());
      }
   }


   // Initialize any placeholder property sources in the context environment.
   // 初始化属性源信息
   initPropertySources();


   // Validate that all properties marked as required are resolvable:
   // see ConfigurablePropertyResolver#setRequiredProperties
   // 验证环境信息里一些必须存在的属性
   getEnvironment().validateRequiredProperties();


   // Store pre-refresh ApplicationListeners...
   if (this.earlyApplicationListeners == null) {
      this.earlyApplicationListeners = new LinkedHashSet<>(this.applicationListeners);
   }
   else {
      // Reset local application listeners to pre-refresh state.
      this.applicationListeners.clear();
      this.applicationListeners.addAll(this.earlyApplicationListeners);
   }


   // Allow for the collection of early ApplicationEvents,
   // to be published once the multicaster is available...
   this.earlyApplicationEvents = new LinkedHashSet<>();
}
```

---

## 2.`obtainFreshBeanFactory()`
创建了一个 `beanFactory` 
```java
protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
   // 创建一个新的beanFactory，由AbstractRefreshableApplicationContext实现
   refreshBeanFactory();
   // 返回beanFactory
   return getBeanFactory();
}
```
进入 `AbstractRefreshableApplicationContext.class` 的 `refreshBeanFactory()` 方法
```java
@Override
protected final void refreshBeanFactory() throws BeansException {
   // 1. 判断是否已经存在beanFactory，如果存在则先销毁、关闭该beanFactory
   if (hasBeanFactory()) {
      destroyBeans();
      closeBeanFactory();
   }
   try {
      // 2.创建一个新的beanFactory
      DefaultListableBeanFactory beanFactory = createBeanFactory();
      beanFactory.setSerializationId(getId());
      // 3. 设置beanFactory的一些参数
      customizeBeanFactory(beanFactory);
      // 4. 加载bean，将Spring配置文件中的所有bean封装为BeanDefinition，加载到beanFactory中，方法由XmlWebApplicationContext实现
      loadBeanDefinitions(beanFactory);
      synchronized (this.beanFactoryMonitor) {
         this.beanFactory = beanFactory;
      }
   }
   catch (IOException ex) {
      throw new ApplicationContextException("I/O error parsing bean definition source for " + getDisplayName(), ex);
   }
}
```
`loadBeanDefinitions()` 方法会解析 Spring 的配置文件，将 Spring 配置文件中的所有 bean 封装为 `BeanDefinition`，加载到了 `beanFactory` 中

---

## 3.`prepareBeanFactory(beanFactory)`
对上一步获取到的 `beanFactory` 进行一些配置工作，例如配置 `classLoader`、后置处理器 `BeanPostProcessor` 等。 这个方法会注册3个默认环境 `bean`：environment、systemProperties 和 systemEnvironment，注册2个 `bean` 后置处理器：`ApplicationContextAwareProcessor` 和 `ApplicationListenerDetector`。
```java
protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   // Tell the internal bean factory to use the context's class loader etc.
   // 1.设置beanFactory的类加载器(用于加载bean)
   beanFactory.setBeanClassLoader(getClassLoader());
   // 2.设置beanFactory的表达式解析器
   beanFactory.setBeanExpressionResolver(new StandardBeanExpressionResolver(beanFactory.getBeanClassLoader()));
   // 3.添加属性编辑注册器
   beanFactory.addPropertyEditorRegistrar(new ResourceEditorRegistrar(this, getEnvironment()));

   // Configure the bean factory with context callbacks.
   // 4.添加ApplicationContextAwareProcessor这个beanPostProcessor
   beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));
   // 5.取消EnvironmentAware、EmbeddedValueResolverAware、ResourceLoaderAware、ApplicationEventPublisherAware、MessageSourceAware、ApplicationContextAware这6个接口的自动注入，因为上面添加的ApplicationContextAwareProcessor.class把这6个接口的实现工作都做了(可以去看类里的invokeAwareInterfaces()方法)
   beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
   beanFactory.ignoreDependencyInterface(EmbeddedValueResolverAware.class);
   beanFactory.ignoreDependencyInterface(ResourceLoaderAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationEventPublisherAware.class);
   beanFactory.ignoreDependencyInterface(MessageSourceAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationContextAware.class);


   // BeanFactory interface not registered as resolvable type in a plain factory.
   // MessageSource registered (and found for autowiring) as a bean.
   // 6.注册可以解析的自动装配类，使得我们可以在程序的任何地方使用@Autowired完成自动注入
   beanFactory.registerResolvableDependency(BeanFactory.class, beanFactory);
   beanFactory.registerResolvableDependency(ResourceLoader.class, this);
   beanFactory.registerResolvableDependency(ApplicationEventPublisher.class, this);
   beanFactory.registerResolvableDependency(ApplicationContext.class, this);


   // Register early post-processor for detecting inner beans as ApplicationListeners.
   // 7.添加BeanPostProcessor后置处理器，这个处理器用于在bean初始化前后添加和移除ApplicationListener监听器
   beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(this));


   // Detect a LoadTimeWeaver and prepare for weaving, if found.
   // 8.添加一个BeanPostProcessor，这个处理器用于添加编译时的AspectJ.
   if (beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      // Set a temporary ClassLoader for type matching.
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }


   // Register default environment beans.
   // 9.给beanFactory注册一些能用的组件，包括环境信息ConfigurableEnvironment、系统属性、系统环境变量
   if (!beanFactory.containsLocalBean(ENVIRONMENT_BEAN_NAME)) {
      beanFactory.registerSingleton(ENVIRONMENT_BEAN_NAME, getEnvironment());
   }
   if (!beanFactory.containsLocalBean(SYSTEM_PROPERTIES_BEAN_NAME)) {
      beanFactory.registerSingleton(SYSTEM_PROPERTIES_BEAN_NAME, getEnvironment().getSystemProperties());
   }
   if (!beanFactory.containsLocalBean(SYSTEM_ENVIRONMENT_BEAN_NAME)) {
      beanFactory.registerSingleton(SYSTEM_ENVIRONMENT_BEAN_NAME, getEnvironment().getSystemEnvironment());
   }
}
```

---

## 4.`postProcessBeanFactory(beanFactory)`
对 `beanFactory` 进行一些后置的处理，对应的方法是一个 `protected` 修饰的空方法
```java
protected void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
}
```
不同的子类 Spring 容器会完成不同的操作吗，来看一下 `GenericWebApplicationContext` 容器做了哪些操作
```java
protected void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
    // 1.与ApplicationContextAwareProcessor.class类似，添加的ServletContextAwareProcessor.class用于处理ServletContextAware.class和ServletConfigAware.class这两个bean，在它们初始化时分别调用setServletContext()和setServletConfig()方法
    if (this.servletContext != null) {
        beanFactory.addBeanPostProcessor(new ServletContextAwareProcessor(this.servletContext));
        beanFactory.ignoreDependencyInterface(ServletContextAware.class);
    }

    // 2.配置beanFactory的作用域
    WebApplicationContextUtils.registerWebApplicationScopes(beanFactory, this.servletContext);
    // 3.注册一些环境信息对应的bean
    WebApplicationContextUtils.registerEnvironmentBeans(beanFactory, this.servletContext);
}
```

---

## 5.`invokeBeanFactoryPostProcessors(beanFactory)`

这个方法主要就是执行了 `BeanFactoryProcessor` 接口的 `postProcessBeanFactory()` 方法，Spring 容器允许这个接口在容器实例化任何 `bean` 之前读取 `bean` 的定义，并可以修改它。
`BeanDefinitionRegistryPostProcessor` 是 `BeanFactoryProcessor` 的一个子类，它的 `postProcessBeanDefinitionRegistry()` 方法用来注册常规的 `BeanFactoryPostProcessor` (这个常规的是指直接实现了 `BeanFactoryProcessor` 的Bean)，这个方法会被优先执行。待所有的常规的`BeanFactoryPostProcessor` 都被注册到 Spring 容器上之后，再遍历这些 `processors` 执行 `postProcessBeanFactory()` 方法。
```java
protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {
   // 1.在Spring容器中找出实现了BeanFactoryPostProcessor.class和 BeanDefinitionRegistryPostProcessor.class 的processor并执行
   PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors());

   // Detect a LoadTimeWeaver and prepare for weaving, if found in the meantime
   // (e.g. through an @Bean method registered by ConfigurationClassPostProcessor)
   if (beanFactory.getTempClassLoader() == null && beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }
}
```
来看一下 `invokeBeanFactoryPostProcessors()` 这个方法，看似很长，但是分析一下发现逻辑还是很清晰的。
主要的逻辑就是先处理实现了 `BeanDefinitionRegistryPostProcessor` 的 `Bean` ，再处理常规的实现了 `BeanFactoryProcessor` 的 `Bean` 。处理时根据优先级顺序，从前到后依次是：**1.实现了PriorityOrdered 2.实现了Ordered 3.其他**。
这些处理器有两种来源，一种是 **外部导入** 的(由初始化器添加的)，通过 `getBeanFactoryPostProcessors()` 方法获得；另一种是就是**Spring容器中已经注册上去的bean**。
```java
public static void invokeBeanFactoryPostProcessors(
      ConfigurableListableBeanFactory beanFactory, List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {

   // Invoke BeanDefinitionRegistryPostProcessors first, if any.
   Set<String> processedBeans = new HashSet<>();

   // 1.判断beanFactory是不是BeanDefinitionRegistry，只有实现了BeanDefinitionRegistry接口才具有注册BeanDefinition的功能。这里beanFactory是DefaultListableBeanFactory,而DefaultListableBeanFactory实现了BeanDefinitionRegistry接口，因此这边为true
   if (beanFactory instanceof BeanDefinitionRegistry) {
      BeanDefinitionRegistry registry = (BeanDefinitionRegistry) beanFactory;
      // 用于存放普通的BeanFactoryPostProcessor
      List<BeanFactoryPostProcessor> regularPostProcessors = new ArrayList<>();
      // 用于存放BeanDefinitionRegistryPostProcessor
      List<BeanDefinitionRegistryPostProcessor> registryProcessors = new ArrayList<>();

      // 2.首先处理入参中的beanFactoryPostProcessors
      // 遍历所有的beanFactoryPostProcessors, 将BeanDefinitionRegistryPostProcessor和普通BeanFactoryPostProcessor区分开
      for (BeanFactoryPostProcessor postProcessor : beanFactoryPostProcessors) {
         if (postProcessor instanceof BeanDefinitionRegistryPostProcessor) {
            // 2.1 如果是BeanDefinitionRegistryPostProcessor
            BeanDefinitionRegistryPostProcessor registryProcessor =
                  (BeanDefinitionRegistryPostProcessor) postProcessor;
            // 直接执行postProcessBeanDefinitionRegistry方法
            registryProcessor.postProcessBeanDefinitionRegistry(registry);
            // 并将其添加到registryProcessors中
            registryProcessors.add(registryProcessor);
         }
         else {
            // 2.2 如果是普通的BeanFactoryPostProcessor,将其添加到regularPostProcessors中
            regularPostProcessors.add(postProcessor);
         }
      }


      // Do not initialize FactoryBeans here: We need to leave all regular beans
      // uninitialized to let the bean factory post-processors apply to them!
      // Separate between BeanDefinitionRegistryPostProcessors that implement
      // PriorityOrdered, Ordered, and the rest.
      // 用于保存本次需要执行的BeanDefinitionRegistryPostProcessor
      List<BeanDefinitionRegistryPostProcessor> currentRegistryProcessors = new ArrayList<>();


      // First, invoke the BeanDefinitionRegistryPostProcessors that implement PriorityOrdered.
      // 3.从容器中获取所有的BeanDefinitionRegistryPostProcessors类型的bean的name
      String[] postProcessorNames =
            beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
      // 3.1先处理实现了PriorityOrdered.class的bean，这个接口用于定义bean执行的优先级
      for (String ppName : postProcessorNames) {
         if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
            currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
            // 将获取到的bean加入到processedBeans，防止后续重复执行
            processedBeans.add(ppName);
         }
      }
      // 对postProcessors进行排序
      sortPostProcessors(currentRegistryProcessors, beanFactory);
      // 添加到registryProcessors中
      registryProcessors.addAll(currentRegistryProcessors);
      // 遍历currentRegistryProcessors，执行postProcessBeanDefinitionRegistry()方法
      invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
      // 清除执行过的currentRegistryProcessors
      currentRegistryProcessors.clear();


      // Next, invoke the BeanDefinitionRegistryPostProcessors that implement Ordered.
      // 再一次找出实现了BeanDefinitionRegistryPostProcessor的bean，这边重复查找是因为执行完上面的BeanDefinitionRegistryPostProcessor可能会新增其他的BeanDefinitionRegistryPostProcessor
      postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
      // 3.2接着处理实现了Ordered.class的bean，这个接口与PriorityOrdered.class功能一致，Ordered的执行优先级低于PriorityOrdered，下面的步骤同上
      for (String ppName : postProcessorNames) {
         // 已执行的直接跳过
         if (!processedBeans.contains(ppName) && beanFactory.isTypeMatch(ppName, Ordered.class)) {
            currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
            processedBeans.add(ppName);
         }
      }
      sortPostProcessors(currentRegistryProcessors, beanFactory);
      registryProcessors.addAll(currentRegistryProcessors);
      invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
      currentRegistryProcessors.clear();


      // Finally, invoke all other BeanDefinitionRegistryPostProcessors until no further ones appear.
      boolean reiterate = true;
      while (reiterate) {
         reiterate = false;
         // 再次查找，原因同上
         postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
         // 3.3 最后，执行所有没有实现优先级接口的BeanDefinitionRegistryPostProcessor
         for (String ppName : postProcessorNames) {
            // 跳过已执行的
            if (!processedBeans.contains(ppName)) {
               currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
               processedBeans.add(ppName);
               // 如果有BeanDefinitionRegistryPostProcessor被执行了，可能会产生新的BeanDefinitionRegistryPostProcessor，因此将reiterate赋值为true，代表再循环查找一次
               reiterate = true;
            }
         }
         sortPostProcessors(currentRegistryProcessors, beanFactory);
         registryProcessors.addAll(currentRegistryProcessors);
         invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
         currentRegistryProcessors.clear();
      }


      // Now, invoke the postProcessBeanFactory callback of all processors handled so far.
      // 4.接着，执行BeanFactoryPostProcessor的postProcessBeanFactory()方法对上面3个步骤获取到的所有BeanDefinitionRegistryPostProcessor和BeanFactoryPostProcessor类型的bean进行处理
      // 4.1 先执行BeanDefinitionRegistryPostProcessor的postProcessBeanFactory()方法
      invokeBeanFactoryPostProcessors(registryProcessors, beanFactory);
      // 4.2 然后执行普通BeanFactoryPostProcessor的postProcessBeanFactory()方法
      invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
   }


   // 如果BeanFactory不是BeanDefinitionRegistry，则表示它不具备注册BeanDefinition的功能，因此直接将传入beanFactoryPostProcessors视为普通BeanFactoryPostProcessor，执行postProcessBeanFactory()方法
   else {
      // Invoke factory processors registered with the context instance.
      invokeBeanFactoryPostProcessors(beanFactoryPostProcessors, beanFactory);
   }


   // Do not initialize FactoryBeans here: We need to leave all regular beans
   // uninitialized to let the bean factory post-processors apply to them!
   // 5.接下来从Spring容器中查找BeanFactoryPostProcessor接口的实现类，然后执行，这里的查找规则与上面查找BeanDefinitionRegistryPostProcessor一样，先查实现PriorityOrdered的，在找实现Ordered的，最后是两者都没有实现的
   String[] postProcessorNames =
         beanFactory.getBeanNamesForType(BeanFactoryPostProcessor.class, true, false);


   // Separate between BeanFactoryPostProcessors that implement PriorityOrdered,
   // Ordered, and the rest.
   // 存放实现了PriorityOrdered接口的BeanFactoryPostProcessor
   List<BeanFactoryPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
   // 存放实现了Ordered接口的BeanFactoryPostProcessor
   List<String> orderedPostProcessorNames = new ArrayList<>();
   // 存放普通的BeanFactoryPostProcessor
   List<String> nonOrderedPostProcessorNames = new ArrayList<>();
   // 遍历从Spring容器中找到的postProcessorNames，将其按照实现了PriorityOrdered、实现了Ordered、普通区分开来
   for (String ppName : postProcessorNames) {
      // 跳过已经执行的
      if (processedBeans.contains(ppName)) {
         // skip - already processed in first phase above
      }
      // 添加实现了PriorityOrdered的
      else if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
         priorityOrderedPostProcessors.add(beanFactory.getBean(ppName, BeanFactoryPostProcessor.class));
      }
      // 添加实现了Ordered的
      else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
         orderedPostProcessorNames.add(ppName);
      }
      // 添加普通的
      else {
         nonOrderedPostProcessorNames.add(ppName);
      }
   }


   // First, invoke the BeanFactoryPostProcessors that implement PriorityOrdered.
   // 首先执行实现了PriorityOrdered接口的BeanFactoryPostProcessor
   sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
   invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);


   // Next, invoke the BeanFactoryPostProcessors that implement Ordered.
   // 然后执行实现了Ordered接口的
   List<BeanFactoryPostProcessor> orderedPostProcessors = new ArrayList<>();
   for (String postProcessorName : orderedPostProcessorNames) {
      orderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
   }
   sortPostProcessors(orderedPostProcessors, beanFactory);
   invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory);


   // Finally, invoke all other BeanFactoryPostProcessors.
   // 最后执行普通的
   List<BeanFactoryPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
   for (String postProcessorName : nonOrderedPostProcessorNames) {
      nonOrderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
   }
   invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);


   // Clear cached merged bean definitions since the post-processors might have
   // modified the original metadata, e.g. replacing placeholders in values...
   beanFactory.clearMetadataCache();
}
```
*(注：下面这一段来自 [SpringBoot源码分析之Spring容器的refresh过程](https://fangjian0423.github.io/2017/05/10/springboot-context-refresh/) )*
> 在这一步中有一个比较重要的类会被执行，它就是：`ConfigurationClassPostProcessor.class`。这个类实现了 `BeanDefinitionRegistryPostProcessor.class` 和 `PriorityOrdered.class`，它的优先级最高，会被最先执行。它会对项目中的 `@Configuration` 注解修饰的类(`@Component`、`@ComponentScan`、`@Import`、`@ImportResource` 修饰的类也会被处理)进行解析，解析完成之后把这些 `bean` 注册到 `BeanFactory` 中。需要注意的是这个时候注册进来的 `bean` 还没有实例化。这里 `ConfigurationClassPostProcessor` 最先被处理还有另外一个原因，如果程序中有自定义的 `BeanFactoryPostProcessor` ，那么这个 `PostProcessor` 首先得通过 `ConfigurationClassPostProcessor` 被解析出来，然后才能被 Spring 容器找到并执行。<br>(`ConfigurationClassPostProcessor`不先执行的话，这个 `Processor` 是不会被解析的，不会被解析的话也就不会执行了)。下图就是对`ConfigurationClassPostProcessor`的执行流程的解读：

![avatar](http://ww1.sinaimg.cn/large/006jvOIfgy1gfqgfpcf19j315n1c6gtr.jpg)

关于这个方法的更详细解释可以参考这篇文章：[Spring IoC：invokeBeanFactoryPostProcessors 详解](https://zhuanlan.zhihu.com/p/83473498)

---

## 6.`registerBeanPostProcessors(beanFactory)`
注册 `BeanPostProcessor` ，这个方法和上一步的处理 `BeanFactoryPostProcessor` 处理器的流程类似。
在看具体代码之前，我们先来看看 `BeanPostProcessor` 和 `BeanFactoryPostProcessor` 这两个长得很像的接口。 `BeanFactoryPostProcessor` 是针对 `BeanFactory` 的拓展，主要用于在 `bean` 实例化之前，读取 `bean` 的定义，并可以修改甚至覆盖它，并且允许开发者在 `BeanFactory` 实例化之后修改容器内部的 `beanFactory`。
```java
@FunctionalInterface
public interface BeanFactoryPostProcessor {
   /**
    * Modify the application context's internal bean factory after its standard
    * initialization. All bean definitions will have been loaded, but no beans
    * will have been instantiated yet. This allows for overriding or adding
    * properties even to eager-initializing beans.
    * @param beanFactory the bean factory used by the application context
    * @throws org.springframework.beans.BeansException in case of errors
    */
   void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException;
}
```
`BeanPostProcessor` 则是针对 `bean` 的拓展，主要用在 `bean` 实例化之后，执行初始化方法的前/后，允许开发者对 `bean` 实例进行修改。
```java
public interface BeanPostProcessor {
   @Nullable
   default Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
      return bean;
   }

   @Nullable
   default Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
      return bean;
   }
}
```

下面再来看看对 `BeanPostProcessor` 具体的处理流程
```java
public static void registerBeanPostProcessors(
      ConfigurableListableBeanFactory beanFactory, AbstractApplicationContext applicationContext) {

   // 1. 从Spring容器中获取到BeanPostProcessor.class的Bean
   String[] postProcessorNames = beanFactory.getBeanNamesForType(BeanPostProcessor.class, true, false);

   // Register BeanPostProcessorChecker that logs an info message when
   // a bean is created during BeanPostProcessor instantiation, i.e. when
   // a bean is not eligible for getting processed by all BeanPostProcessors.
   // BeanPostProcessor的目标计数
   int beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() + 1 + postProcessorNames.length;
   // 2.添加BeanPostProcessorChecker(主要用于记录信息)到beanFactory中
   beanFactory.addBeanPostProcessor(new BeanPostProcessorChecker(beanFactory, beanProcessorTargetCount));


   // Separate between BeanPostProcessors that implement PriorityOrdered,
   // Ordered, and the rest.
   // 3. 定义几个变量，区分实现了PriorityOrdered接口的BeanPostProcessor、实现了Ordered接口的BeanPostProcessor、普通BeanPostProcessor
   // 3.1 存放实现了PriorityOrdered的BeanPostProcessor
   List<BeanPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
   // 3.2 存放实现了MergedBeanDefinitionPostProcessor的BeanPostProcessor
   List<BeanPostProcessor> internalPostProcessors = new ArrayList<>();
   // 3.3 存放实现了Ordered的BeanPostProcessor的beanName
   List<String> orderedPostProcessorNames = new ArrayList<>();
   // 3.4 存放普通的BeanPostProcessor的beanName
   List<String> nonOrderedPostProcessorNames = new ArrayList<>();
   // 4. 遍历postProcessorNames，将BeanPostProcessors按3.1 - 3.4定义的变量区分开
   for (String ppName : postProcessorNames) {
      if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
         BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
         priorityOrderedPostProcessors.add(pp);
         if (pp instanceof MergedBeanDefinitionPostProcessor) {
            internalPostProcessors.add(pp);
         }
      }
      else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
         orderedPostProcessorNames.add(ppName);
      }
      else {
         nonOrderedPostProcessorNames.add(ppName);
      }
   }

   // First, register the BeanPostProcessors that implement PriorityOrdered.
   // 5. 先将实现了PriorityOrdered的BeanPostProcessor注册到beanFactory中
   sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
   registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors);


   // Next, register the BeanPostProcessors that implement Ordered.
   // 6.接着是实现了Ordered的BeanPostProcessor
   List<BeanPostProcessor> orderedPostProcessors = new ArrayList<>();
   for (String ppName : orderedPostProcessorNames) {
      BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
      orderedPostProcessors.add(pp);
      if (pp instanceof MergedBeanDefinitionPostProcessor) {
         internalPostProcessors.add(pp);
      }
   }
   sortPostProcessors(orderedPostProcessors, beanFactory);
   registerBeanPostProcessors(beanFactory, orderedPostProcessors);


   // Now, register all regular BeanPostProcessors.
   // 7.然后是普通的BeanPostProcessor
   List<BeanPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
   for (String ppName : nonOrderedPostProcessorNames) {
      BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
      nonOrderedPostProcessors.add(pp);
      if (pp instanceof MergedBeanDefinitionPostProcessor) {
         internalPostProcessors.add(pp);
      }
   }
   registerBeanPostProcessors(beanFactory, nonOrderedPostProcessors);


   // Finally, re-register all internal BeanPostProcessors.
   // 8. 最后是MergedBeanDefinitionPostProcessor类型的BeanPostProcessor
   sortPostProcessors(internalPostProcessors, beanFactory);
   registerBeanPostProcessors(beanFactory, internalPostProcessors);


   // Re-register post-processor for detecting inner beans as ApplicationListeners,
   // moving it to the end of the processor chain (for picking up proxies etc).
   // 9.重新注册ApplicationListenerDetector，主要是为了将这个类移动到处理器链的末尾
   beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext));
}
```
可以看到，`registerBeanPostProcessors()` 仅仅只将 `BeanPostProcessor` 注册到 `beanFactory` 中的 `beanPostProcessors` 缓存中，并没有执行它们，这是因为还没到它们出场的时候。上面讲过， `BeanPostProcessor` 是在 `bean` 实例化之后，执行初始化方法前/后，才被调用。

---

## `7.initMessageSource()`
初始化消息资源 `MessageSource` , `MessageSource` 主要用于支持消息的参数化和国际化。
```java
protected void initMessageSource() {
   // 1. 获取beanFactory
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   // 2.判断当前的beanFactory中是否存在名为messageSource的bean
   if (beanFactory.containsLocalBean(MESSAGE_SOURCE_BEAN_NAME)) {
      // 如果存在则直接使用这个bean
      this.messageSource = beanFactory.getBean(MESSAGE_SOURCE_BEAN_NAME, MessageSource.class);
      // Make MessageSource aware of parent MessageSource.
      if (this.parent != null && this.messageSource instanceof HierarchicalMessageSource) {
         HierarchicalMessageSource hms = (HierarchicalMessageSource) this.messageSource;
         if (hms.getParentMessageSource() == null) {
            // Only set parent context as parent MessageSource if no parent MessageSource
            // registered already.
            hms.setParentMessageSource(getInternalParentMessageSource());
         }
      }
      if (logger.isTraceEnabled()) {
         logger.trace("Using MessageSource [" + this.messageSource + "]");
      }
   }
   // 3.如果不存在则使用默认的MessageSource，并注册到beanFactory中
   else { 
      // Use empty MessageSource to be able to accept getMessage calls.
      DelegatingMessageSource dms = new DelegatingMessageSource();
      dms.setParentMessageSource(getInternalParentMessageSource());
      this.messageSource = dms;
      beanFactory.registerSingleton(MESSAGE_SOURCE_BEAN_NAME, this.messageSource);
      if (logger.isTraceEnabled()) {
         logger.trace("No '" + MESSAGE_SOURCE_BEAN_NAME + "' bean, using [" + this.messageSource + "]");
      }
   }
}
```

---

## 8.`initApplicationEventMulticaster()`
初始化事件广播器，初始过程与上面初始化 `MessageSource` 类似。在[SpringBoot源码学习(一)---启动流程](https://jokerbyrant.github.io/2020/06/07/SpringBoot%E6%BA%90%E7%A0%81%E5%AD%A6%E4%B9%A0(%E4%B8%80)---%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B)说到过，这个广播器承担的责任就是将 `SpringApplicationRunListener` 发出的事件，广播给各个监听器 `ApplicationListener` 。
```java
protected void initApplicationEventMulticaster() {
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   // 1.判断beanFactory中是否存在名为applicationEventMulticaster的bean
   if (beanFactory.containsLocalBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME)) {
      // 如果存在，则将这个bean赋值给当前Spring容器的applicationEventMulticaster属性
      this.applicationEventMulticaster =
            beanFactory.getBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, ApplicationEventMulticaster.class);
      if (logger.isTraceEnabled()) {
         logger.trace("Using ApplicationEventMulticaster [" + this.applicationEventMulticaster + "]");
      }
   }
   // 2. 如果不存在，则使用默认的applicationEventMulticaster，并注册到beanFactory中
   else {
      this.applicationEventMulticaster = new SimpleApplicationEventMulticaster(beanFactory);
      beanFactory.registerSingleton(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, this.applicationEventMulticaster);
      if (logger.isTraceEnabled()) {
         logger.trace("No '" + APPLICATION_EVENT_MULTICASTER_BEAN_NAME + "' bean, using " +
               "[" + this.applicationEventMulticaster.getClass().getSimpleName() + "]");
      }
   }
}
```

---

## 9.`onRefresh()`
一个模板方法，实现为空，由子类进行拓展。对于 `SpringBoot` 来说，会在这里创建 **内置的Servlet容器** 。这里面涉及的流程比较繁琐，具体的流程在这篇有讲到：SpringBoot源码学习(四)---内置Servlet容器加载流程
```java
protected void onRefresh() throws BeansException {
   // For subclasses: do nothing by default.
}
```

---

## 10.`registerListeners()`
将事件监听器添加到第8步创建的事件广播器中，如果存在 `earlyEventsToProcess` 的话，直接将其广播出去。
```java
protected void registerListeners() {
   // Register statically specified listeners first.
   // 1. 遍历已经存在的监听器，将其添加到广播器中
   for (ApplicationListener<?> listener : getApplicationListeners()) {
      getApplicationEventMulticaster().addApplicationListener(listener);
   }

   // Do not initialize FactoryBeans here: We need to leave all regular beans
   // uninitialized to let post-processors apply to them!
   // 2. 获取beanFactory中的ApplicationListener.class，将其添加到广播器中
   String[] listenerBeanNames = getBeanNamesForType(ApplicationListener.class, true, false);
   for (String listenerBeanName : listenerBeanNames) {
      getApplicationEventMulticaster().addApplicationListenerBean(listenerBeanName);
   }

   // Publish early application events now that we finally have a multicaster...
   // 3. 发布早期应用程序事件到相应的监听器
   Set<ApplicationEvent> earlyEventsToProcess = this.earlyApplicationEvents;
   this.earlyApplicationEvents = null;
   if (earlyEventsToProcess != null) {
      for (ApplicationEvent earlyEvent : earlyEventsToProcess) {
         getApplicationEventMulticaster().multicastEvent(earlyEvent);
      }
   }
}
```
其中 `getApplicationListeners()` 方法获取到的监听器，我们在[SpringBoot源码学习(一)---启动流程](https://jokerbyrant.github.io/2020/06/07/SpringBoot%E6%BA%90%E7%A0%81%E5%AD%A6%E4%B9%A0(%E4%B8%80)---%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B) 提到过，在执行 `run()` 方法的第4阶段  `prepareContext()` ---准备Spring容器时，最后会将在 `SpringApplication` 初始化时获取到的监听器添加到 Spring 容器中。

```java
listeners.contextLoaded(context);
```

```java
public void contextLoaded(ConfigurableApplicationContext context) {
   // 遍历SpringApplication中的监听器
   for (ApplicationListener<?> listener : this.application.getListeners()) {
      if (listener instanceof ApplicationContextAware) {
         ((ApplicationContextAware) listener).setApplicationContext(context);
      }
      // 添加监听器到Spring容器中
      context.addApplicationListener(listener);
   }
   this.initialMulticaster.multicastEvent(new ApplicationPreparedEvent(this.application, this.args, context));
}
```

---

## 11.`finishBeanFactoryInitialization(beanFactory)`
实例化 `BeanFactory` 中已经注册但是没有实例化的所有非懒加载单例。除了一些内部的 `bean` 、实现了 `BeanFactoryPostProcessor` 接口的 `bean` 、实现了 `BeanPostProcessor` 接口的 `bean` ，其他的非懒加载单例 `bean` 都会在这个方法中被实例化。既然 `Bean` 都被实例化了，那么 `BeanPostProcessor` 也就被触发了。
```java
/**
* Finish the initialization of this context's bean factory,
* initializing all remaining singleton beans.
*/
protected void finishBeanFactoryInitialization(ConfigurableListableBeanFactory beanFactory) {
   // Initialize conversion service for this context.
   if (beanFactory.containsBean(CONVERSION_SERVICE_BEAN_NAME) &&
         beanFactory.isTypeMatch(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class)) {
      beanFactory.setConversionService(
            beanFactory.getBean(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class));
   }


   // Register a default embedded value resolver if no bean post-processor
   // (such as a PropertyPlaceholderConfigurer bean) registered any before:
   // at this point, primarily for resolution in annotation attribute values.
   if (!beanFactory.hasEmbeddedValueResolver()) {
      beanFactory.addEmbeddedValueResolver(strVal -> getEnvironment().resolvePlaceholders(strVal));
   }


   // Initialize LoadTimeWeaverAware beans early to allow for registering their transformers early.
   String[] weaverAwareNames = beanFactory.getBeanNamesForType(LoadTimeWeaverAware.class, false, false);
   for (String weaverAwareName : weaverAwareNames) {
      getBean(weaverAwareName);
   }


   // Stop using the temporary ClassLoader for type matching.
   // 停用临时的ClassLoader
   beanFactory.setTempClassLoader(null);

   // Allow for caching all bean definition metadata, not expecting further changes.
   // 冻结所有的bean定义，已经注册的bean不能再被修改定义了，因为马上就要创建Bean的实例对象了
   beanFactory.freezeConfiguration();

   // Instantiate all remaining (non-lazy-init) singletons.
   // 实例化所有剩余的单例对象(懒加载除外)
   beanFactory.preInstantiateSingletons();
}
```
这个方法是实现`Spring IOC`的核心，关于它更详细的解读参见：[Spring IoC：finishBeanFactoryInitialization 详解](https://www.zhihu.com/search?type=content&q=finishBeanFactoryInitialization(beanFactory))

---

## 12.`finishRefresh()`
结束当前容器的刷新操作
```java
/**
* Finish the refresh of this context, invoking the LifecycleProcessor's
* onRefresh() method and publishing the
* {@link org.springframework.context.event.ContextRefreshedEvent}.
*/
protected void finishRefresh() {
   // Clear context-level resource caches (such as ASM metadata from scanning).
   clearResourceCaches();

   // Initialize lifecycle processor for this context.
   // 1. 初始化生命周期处理器
   initLifecycleProcessor();

   // Propagate refresh to lifecycle processor first.
   // 2.调用生命周期处理器的onRefresh()方法，最终就是调用了SmartLifecycle的start方法
   getLifecycleProcessor().onRefresh();

   // Publish the final event.
   // 3.发布上下文刷新完毕事件到相应的监听器
   publishEvent(new ContextRefreshedEvent(this));

   // Participate in LiveBeansView MBean, if active.
   LiveBeansView.registerApplicationContext(this);
}
```
`initLifecycleProcessor()`，初始化生命周期处理器，过程与第1步和第2步类似。Spring 在加载和初始化所有 `bean` 后，还需要执行一些任务，那么就可以通过生命周期处理器做到。
```java
protected void initLifecycleProcessor() {
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   // 1. 判断beanFactory中是否存在名为lifecycleProcessor的Bean
   if (beanFactory.containsLocalBean(LIFECYCLE_PROCESSOR_BEAN_NAME)) {
      // 存在则直接使用这个作为生命周期处理器
      this.lifecycleProcessor =
            beanFactory.getBean(LIFECYCLE_PROCESSOR_BEAN_NAME, LifecycleProcessor.class);
      if (logger.isTraceEnabled()) {
         logger.trace("Using LifecycleProcessor [" + this.lifecycleProcessor + "]");
      }
   }
   // 2. 如果不存在，则使用默认的生命周期处理器，并将其注册为一个单例到BeanFactory中
   else {
      DefaultLifecycleProcessor defaultProcessor = new DefaultLifecycleProcessor();
      defaultProcessor.setBeanFactory(beanFactory);
      this.lifecycleProcessor = defaultProcessor;
      beanFactory.registerSingleton(LIFECYCLE_PROCESSOR_BEAN_NAME, this.lifecycleProcessor);
      if (logger.isTraceEnabled()) {
         logger.trace("No '" + LIFECYCLE_PROCESSOR_BEAN_NAME + "' bean, using " +
               "[" + this.lifecycleProcessor.getClass().getSimpleName() + "]");
      }
   }
}
```
`getLifecycleProcessor().onRefresh();`
```java
@Override
public void onRefresh() {
   startBeans(true);
   this.running = true;
}

private void startBeans(boolean autoStartupOnly) {
   // 1. 从Spring容器中获取所有的Lifecycle.class的Bean
   Map<String, Lifecycle> lifecycleBeans = getLifecycleBeans();
   // 将Lifecycle的bean 按阶段分组，阶段通过实现Phased接口得到
   Map<Integer, LifecycleGroup> phases = new HashMap<>();
   // 2.遍历所有Lifecycle bean，按阶段值分组
   lifecycleBeans.forEach((beanName, bean) -> {
      // autoStartupOnly=true代表是ApplicationContext刷新时容器自动启动；autoStartupOnly=false代表是通过显示的调用启动 
      // 3.当autoStartupOnly=false，也就是通过显示的调用启动，会触发全部的Lifecycle； 
      // 当autoStartupOnly=true，也就是ApplicationContext刷新时容器自动启动，只会触发isAutoStartup方法返回true的SmartLifecycle
      if (!autoStartupOnly || (bean instanceof SmartLifecycle && ((SmartLifecycle) bean).isAutoStartup())) {
         // 3.1 获取bean的阶段值（如果没有实现Phased接口，则值为0）
         int phase = getPhase(bean);
         // 3.2 拿到存放该阶段值的LifecycleGroup
         LifecycleGroup group = phases.get(phase);
         if (group == null) {
            // 3.3 如果该阶段值的LifecycleGroup为null，则新建一个
            group = new LifecycleGroup(phase, this.timeoutPerShutdownPhase, lifecycleBeans, autoStartupOnly);
            phases.put(phase, group);
         }
         // 3.4 将bean添加到该LifecycleGroup
         group.add(beanName, bean);
      }
   });
   // 4.如果phases不为空
   if (!phases.isEmpty()) {
      List<Integer> keys = new ArrayList<>(phases.keySet());
      // 4.1 按阶段值进行排序
      Collections.sort(keys);
      // 4.2 按阶段值顺序，调用LifecycleGroup中的所有Lifecycle的start方法
      for (Integer key : keys) {
         phases.get(key).start();
      }
   }
}
```
最后调用这个 `start()` 方法会在 `SmartLifecycle` 类中进行，我们也可以自定义一个生命周期处理器，参考自：[Spring中的SmartLifecycle作用](https://www.jianshu.com/p/7b8f2a97c8f5)
```java
/**
* 自定义生命周期处理器SmartLifecycle测试
* @author sxh
* @date 2020/6/11
*/
@Component
public class MySimpleSmartLifeCycle implements SmartLifecycle {
    private boolean isRunning = false;
    
    @Override
    public void start() {
        System.out.println("MySimpleSmartLifeCycle -> start()");

        isRunning = true;
    }

    /**
     * SmartLifecycle子类的才有的方法，当isRunning方法返回true时，该方法才会被调用。
     */
    @Override
    public void stop(Runnable callback) {
        System.out.println("MySimpleSmartLifeCycle -> stop()");

        // 如果你让isRunning返回true，需要执行stop这个方法，那么就不要忘记调用callback.run()。
        // 否则在你程序退出时，Spring的DefaultLifecycleProcessor会认为你这个TestSmartLifecycle没有stop完成，程序会一直卡着结束不了，等待一定时间（默认超时时间30秒）后才会自动结束。
        callback.run();

        isRunning = false;
    }

    /**
     * 接口Lifecycle的子类的方法，只有非SmartLifecycle的子类才会执行该方法。<br/>
     * 1. 该方法只对直接实现接口Lifecycle的类才起作用，对实现SmartLifecycle接口的类无效。<br/>
     * 2. 方法stop()和方法stop(Runnable callback)的区别只在于，后者是SmartLifecycle子类的专属。
     */
    @Override
    public void stop() {
        System.out.println("MySimpleSmartLifeCycle -> stop()");
        
        isRunning = false;
    }

    /**
     * 1. 只有该方法返回false时，start方法才会被执行。
     * 2. 只有该方法返回true时，stop(Runnable callback)或stop()方法才会被执行。
     */
    @Override
    public boolean isRunning() {
        return isRunning;
    }

    /**
     * 排序标识，如果程序中有多个SmartLifecycle的类，执行顺序就根据这个标识进行确定
     * @return
     */
    @Override
    public int getPhase() {
        return 0;
    }

    /**
     * 该方法的返回值决定了是否执行start()方法，只有为true时才执行
     * @return
     */
    @Override
    public boolean isAutoStartup() {
        return true;
    }
}
```

OK，到这儿 Spring 容器的 `refresh` 流程就介绍完了，对各个步骤的介绍并没有深入进去，例如在 `finishBeanFactoryInitialization()` 步骤关于 `bean` 的实例化过程就没有具体的分析，这一块还是挺重要的，后续会看情况进行分析。






    