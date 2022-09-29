---
title: Tomcat源码学习
tags:
  - 后端技术
  - Tomcat
categories: 后端技术
abbrlink: 58230
date: 2022-09-02 10:20:11
---
> 注：本文内容大部分转载自 [Tomcat源码详解知识体系详解](https://pdai.tech/md/framework/tomcat/tomcat-overview.html)

`Tomcat` 源码的阅读计划躺在我的 `TODO LIST` 已经一年有余，趁着最近任务不多，就来学习下。本篇文章是在 [Java 全栈知识体系](https://www.pdai.tech/md/framework/tomcat/tomcat-overview.html) 中 `Tomcat` 系列学习文章的基础上进行整理的。

<!--more-->

## Tomcat的类加载机制

`Java` 默认的类加载机制是双亲委派机制，关于这个的解释可以看看这篇文章：[Java类加载机制-双亲委派机制说明](https://www.cnblogs.com/029zz010buct/p/10366808.html)。

`Tomcat` 使用的类加载机制有别于上面的 `双亲委派机制` 。一个 `Tomcat` 容器允许同时运行多个 `Web` 程序，每个 `Web` 程序依赖的类又必须是相互隔离的。因此，如果 `Tomcat` 使用双亲委派模式来加载类的话，将导致 `Web` 程序依赖的类变为共享的。这时候 `Java` 的上下文类加载器(`contextClassLoader`)就派上用场了，它可以通过 `setContextClassLoader` 来传入自定义的类加载器，实现类的隔离。具体的分析见 [Tomcat 官网](https://tomcat.apache.org/tomcat-9.0-doc/class-loader-howto.html)、[Tomcat类加载机制](https://pdai.tech/md/framework/tomcat/tomcat-x-classloader.html#tomcat%E7%B1%BB%E5%8A%A0%E8%BD%BD%E6%9C%BA%E5%88%B6%E6%98%AF%E6%80%8E%E4%B9%88%E6%A0%B7%E7%9A%84%E5%91%A2)

## Tomcat中的组件

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245236940fa1bbc667bd821d7224006710121b5b2.png)

- `Server`: 表示服务器，它提供了一种优雅的方式来启动和停止整个系统，不必单独启停连接器和容器；它是 `Tomcat` 构成的顶级构成元素，所有一切均包含在 `Server`中；
- `Service`: 表示服务，`Server` 可以运行多个服务。比如一个 `Tomcat` 里面可运行订单服务、支付服务、用户服务等等。`Server` 的实现类 `StandardServer` 可以包含一个到多个 `Services`, `Service` 的实现类为 `StandardService` 调用了容器(`Container`)接口，其实是调用了 `Servlet Engine`(引擎)，而且 `StandardService` 类中也指明了该 `Service` 归属的 `Server`;
- `Container`: 表示容器，可以看做 `Servlet` 容器；引擎(`Engine`)、主机(`Host`)、上下文(`Context`)和 `Wraper` 均继承自 `Container` 接口，所以它们都是容器。
- `Connector`: 表示连接器, 它将 `Service` 和 `Container` 连接起来，首先它需要注册到一个 `Service`，它的作用就是把来自客户端的请求转发到 `Container`(容器)，这就是它为什么称作连接器, 它支持的协议如下：
  - 支持 `AJP` 协议
  - 支持 `Http` 协议
  - 支持 `Https` 协议
- `Service` 内部还有各种支撑组件，下面简单罗列一下这些组件:
  - `Manager` -- 管理器，用于管理会话 `Session`
  - `Logger` -- 日志器，用于管理日志
  - `Loader` -- 加载器，和类加载有关，只会开放给 `Context` 所使用 
  - `Pipeline` -- 管道组件，配合 `Valve` 实现过滤器功能
  - `Valve` -- 阀门组件，配合 `Pipeline` 实现过滤器功能 
  - `Realm` -- 认证授权组件

下面以一个完整的 `Http` 请求为例，来梳理一下这些组件之间的关系：

- 来自客户的请求为：`http://localhost:8080/test/index.jsp`。请求被发送到本机端口`8080`，被在那里侦听的 `Coyote HTTP/1.1 Connector` 
- `Connector` 把该请求交给它所在的 `Service` 的 `Engine` 来处理，并等待 `Engine` 的回应
- `Engine` 获得请求 `localhost:8080/test/index.jsp`，匹配它所有虚拟主机 `Host`
- `Engine` 匹配到名为 `localhost` 的 `Host` (即使匹配不到也把请求交给该 `Host` 处理，因为 `localhost` 被定义为该 `Engine` 的默认主机)
- 地址为 `localhost` 的 `HOST` 获得请求 `/test/index.jsp`，匹配它所拥有的所有 `Context` 
- `Host` 匹配到路径为 `/test` 的 `Context` (如果匹配不到就把该请求交给路径名为 `""` 的 `Context` 去处理) 
- `path="/test"` 的 `Context` 获得请求 `/index.jsp`，在它的 `mapping table` 中寻找对应的 `servlet` 
- `Context` 匹配到 `URL PATTERN` 为 `*.jsp` 的 `servlet`，对应于 `JspServlet` 类，构造 `HttpServletRequest` 对象和 `HttpServletResponse` 对象，作为参数调用 `JspServlet` 的 `doGet` 或 `doPost` 方法 
- `Context` 把执行完了之后的 `HttpServletResponse` 对象返回给 `Host` 
- `Host` 把 `HttpServletResponse` 对象返回给 `Engine` 
- `Engine` 把 `HttpServletResponse` 对象返回给 `Connector` 
- `Connector` 把 `HttpServletResponse` 对象返回给客户端(浏览器)

> **注：这一块儿现在看可能有些云里雾里，只需要知道大致的概念就行，等之后深入的阅读了各个组件的源码，理解了组件间关系的细节再回来看这个会很清晰。**

## 加载和启动入口

`Tomcat` 的启动入口在 `Bootstrap.class` 的 `main()` 方法中，首先初始化 `Catalina` 类，配置自定义的类加载器。

然后调用 `load()` 方法加载 `Catalina.class`，初始化组件。

接着调用 `start()` 方法启动 `Catalina`。

```java
/**
 * Main method and entry point when starting Tomcat via the provided
 * scripts.
 *
 * @param args Command line arguments to be processed
 */
public static void main(String args[]) {
    // 创建一个 Bootstrap 对象，调用它的 init 方法初始化
    synchronized (daemonLock) {
        if (daemon == null) {
            // Don't set daemon until init() has completed
            Bootstrap bootstrap = new Bootstrap();
            try {
                bootstrap.init();
            } catch (Throwable t) {
                handleThrowable(t);
                t.printStackTrace();
                return;
            }
            daemon = bootstrap;
        } else {
            // When running as a service the call to stop will be on a new
            // thread so make sure the correct class loader is used to
            // prevent a range of class not found exceptions.
            Thread.currentThread().setContextClassLoader(daemon.catalinaLoader);
        }
    }

    // 根据启动参数，分别调用 Bootstrap 对象的不同方法
    try {
        // 默认命令是start
        String command = "start";
        if (args.length > 0) {
            command = args[args.length - 1];
        }

        if (command.equals("startd")) {
            args[args.length - 1] = "start";
            daemon.load(args);
            daemon.start();
        } else if (command.equals("stopd")) {
            args[args.length - 1] = "stop";
            daemon.stop();
        } else if (command.equals("start")) {
            // 将await参数设置为true, 作用是在调用start()启动Tomcat后，等待用户输入shutdown命令，收到这个命令后执行stop()关闭Tomcat
            daemon.setAwait(true);
            // 加载Catalina，初始化组件
            daemon.load(args);
            // 启动Catalina
            daemon.start();
            if (null == daemon.getServer()) {
                System.exit(1);
            }
        } else if (command.equals("stop")) {
            daemon.stopServer(args);
        } else if (command.equals("configtest")) {
            daemon.load(args);
            if (null == daemon.getServer()) {
                System.exit(1);
            }
            System.exit(0);
        } else {
            log.warn("Bootstrap: command \"" + command + "\" does not exist.");
        }
    } catch (Throwable t) {
        // Unwrap the Exception for clearer error reporting
        if (t instanceof InvocationTargetException &&
                t.getCause() != null) {
            t = t.getCause();
        }
        handleThrowable(t);
        t.printStackTrace();
        System.exit(1);
    }
}
```

## 组件生命周期管理

`Tomcat` 中包含的组件见下图：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245264939a30f3a2ae80872dcb500f3cbf0e3e73b.png)

这些组件的生命周期管理是通过实现 `Lifycycle` 来管理的

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245280939b06f2f56eccc972e3da85326809a2ceb.png)

`Catalina.class` 中初始了 `Server`，其实现类为 `StandardServer.class`，以这个类为例，来看一下 `Tomcat` 中组件的生命周期是如何管理的。

先看一下继承关系：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245287941da6d3ea44131105cfc192ce4d2e0b251.png)

一个标准的 `Lifecycle` 包含的方法如下：

```java
public interface Lifecycle {
    /** 第1类：针对监听器 **/
    // 添加监听器
    public void addLifecycleListener(LifecycleListener listener);
    // 获取所以监听器
    public LifecycleListener[] findLifecycleListeners();
    // 移除某个监听器
    public void removeLifecycleListener(LifecycleListener listener);
    
    /** 第2类：针对控制流程 **/
    // 初始化方法
    public void init() throws LifecycleException;
    // 启动方法
    public void start() throws LifecycleException;
    // 停止方法，和start对应
    public void stop() throws LifecycleException;
    // 销毁方法，和init对应
    public void destroy() throws LifecycleException;
    
    /** 第3类：针对状态 **/
    // 获取生命周期状态
    public LifecycleState getState();
    // 获取字符串类型的生命周期状态
    public String getStateName();
}
```

`Lifycycle` 包含的状态有如下这些：

```java
public enum LifecycleState {
    NEW(false, null),
    INITIALIZING(false, Lifecycle.BEFORE_INIT_EVENT),
    INITIALIZED(false, Lifecycle.AFTER_INIT_EVENT),
    STARTING_PREP(false, Lifecycle.BEFORE_START_EVENT),
    STARTING(true, Lifecycle.START_EVENT),
    STARTED(true, Lifecycle.AFTER_START_EVENT),
    STOPPING_PREP(true, Lifecycle.BEFORE_STOP_EVENT),
    STOPPING(false, Lifecycle.STOP_EVENT),
    STOPPED(false, Lifecycle.AFTER_STOP_EVENT),
    DESTROYING(false, Lifecycle.BEFORE_DESTROY_EVENT),
    DESTROYED(false, Lifecycle.AFTER_DESTROY_EVENT),
    FAILED(false, null);

    private final boolean available;
    private final String lifecycleEvent;

    private LifecycleState(boolean available, String lifecycleEvent) {
        this.available = available;
        this.lifecycleEvent = lifecycleEvent;
    }
    ……
}
```

关系如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245299943cceecc0958bd706e04fc9cb1c0654cea.png)

通过 `StandardServer` 的继承关系可以看到，`LifecycleBase` 是 `Lifecycle` 的实现类，在 `LifecycleBase` 中对生命周期方法进行了具体实现。具体代码就不放了，其中主要运用了模板模式来实现的：

```java
// 初始化方法
protected abstract void initInternal() throws LifecycleException;
// 启动方法
protected abstract void startInternal() throws LifecycleException;
// 停止方法
protected abstract void stopInternal() throws LifecycleException;
// 销毁方法
protected abstract void destroyInternal() throws LifecycleException;
```

这些方法在 `StandardServer` 中都完成了相应的实现。

## 组件的拓展管理

继续以 `StandatdServer` 为例，看一下相关的继承关系：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245305939ca6fd44f48bc101fb1b9bd2a78729326.png)

在进行这一部分之前，需要先了解一下 `JMX` 和 `MBean` 的概念：

> JMX(Java Management Extensions)是一个为应用程序植入管理功能的框架。JMX是一套标准的代理和服务，实际上，用户可以在任何Java应用程序中使用这些代理和服务实现管理。它使用了最简单的一类javaBean，使用有名的MBean，其内部包含了数据信息，这些信息可能是程序配置信息、模块信息、系统信息、统计信息等。MBean可以操作可读可写的属性、直接操作某些函数。

使用 `JConsole` 打开一个 `Tomcat` 服务进程，可以直接在里面看到已经注册的类。而这些类为何能够被我们看到呢？使用的方法就是 `JMX`。一个简化版的例子：[JMX使用案例](https://pdai.tech/md/framework/tomcat/tomcat-x-jmx.html#jmx%E4%BD%BF%E7%94%A8%E6%A1%88%E4%BE%8B).

组建拓展对应的三个类用途如下：

- `MBeanRegistration`: `Java JMX` 框架提供的注册 `MBean` 的接口，引入此接口是为了便于使用 `JMX` 提供的管理功能；
- `JmxEnabled`: 此接口由组件实现，这些组件在创建时将注册到 `MBean` 服务器，在销毁时将注销这些组件。它主要是由实现生命周期的组件来实现的，但并不是专门为它们实现的。
- `LifecycleMBeanBase`：`Tomcat` 提供的对 `MBeanRegistration` 的抽象实现类，运用抽象模板模式将所有容器统一注册到 `JMX`；

有关这块儿的更多内容见：[Tomcat如何通过JMX实现组件管理](https://pdai.tech/md/framework/tomcat/tomcat-x-jmx.html#tomcat%E5%A6%82%E4%BD%95%E9%80%9A%E8%BF%87jmx%E5%AE%9E%E7%8E%B0%E7%BB%84%E4%BB%B6%E7%AE%A1%E7%90%86)

## `Server` 的实现：`StandardServer` 代码分析

首先回到 `Tomcat` 的启动入口，看一下这个类是在什么时候完成初始化的，直接截取对应的代码：

```java
else if (command.equals("start")) {
    // 将await参数设置为true, 作用是在调用start()启动Tomcat后，等待用户输入shutdown命令，收到这个命令后执行stop()关闭Tomcat
    daemon.setAwait(true);
    // 加载Catalina，初始化组件，例如Server、Service等
    daemon.load(args);
    // 启动Catalina
    daemon.start();
    if (null == daemon.getServer()) {
        System.exit(1);
    }
}
```

进入 `daemon.load()` 看一下，`Tomcat` 中各个组件就是在这个方法中完成的初始化：

```java
private void load(String[] arguments) throws Exception {

  // Call the load() method
  String methodName = "load";
  Object param[];
  Class<?> paramTypes[];
  if (arguments==null || arguments.length==0) {
      paramTypes = null;
      param = null;
  } else {
      paramTypes = new Class[1];
      paramTypes[0] = arguments.getClass();
      param = new Object[1];
      param[0] = arguments;
  }
  Method method =
      catalinaDaemon.getClass().getMethod(methodName, paramTypes);
  if (log.isDebugEnabled()) {
      log.debug("Calling startup class " + method);
  }
  // 调用Catalina.class的load()方法
  method.invoke(catalinaDaemon, param);
}
```

代码最后使用反射调用 `Catalina.load()` 方法：

```java
/**
 * Start a new server instance.
 * Catalina 的加载过程
 */
public void load() {
    // 已加载则退出
    if (loaded) {
        return;
    }
    loaded = true;

    long t1 = System.nanoTime();

    // 该方法已弃用
    initDirs();

    // Before digester - it may be needed
    // 设置额外的系统变量
    initNaming();

    // Parse main server.xml
    // 解析server.xml，Tomcat中的组件都是在这里完成的初始化，例如Server、Service等
    parseServerXml(true);
    Server s = getServer();
    if (s == null) {
        return;
    }

    getServer().setCatalina(this);
    getServer().setCatalinaHome(Bootstrap.getCatalinaHomeFile());
    getServer().setCatalinaBase(Bootstrap.getCatalinaBaseFile());

    // Stream redirection
    initStreams();

    // Start the new server
    try {
        // 初始化服务
        getServer().init();
    } catch (LifecycleException e) {
        if (Boolean.getBoolean("org.apache.catalina.startup.EXIT_ON_INIT_FAILURE")) {
            throw new java.lang.Error(e);
        } else {
            log.error(sm.getString("catalina.initError"), e);
        }
    }

    if(log.isInfoEnabled()) {
        log.info(sm.getString("catalina.init", Long.toString(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - t1))));
    }
}
```

其中主要关注的是 `parseServerXml(true)` 这行代码，通过 `Debug` 发现，`Tomcat` 中各个组件就是在这里完成的初始化，感兴趣的可以自己手动 `Debug` 看一下。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424531694056f07ae851b5470b40504bf808a83351.png)

`parseServerXml(true)` 这行代码做的工作就是读取 `server.xml` 的配置，然后初始化对应的类。看一下 `server.xml` 的内容( *为方便阅读，英文注释已被我移除* )：

```xml
<!-- 1.属性说明
    port:指定一个端口，这个端口负责监听关闭Tomcat的请求
    shutdown:向以上端口发送的关闭服务器的命令字符串
  -->
<Server port="8005" shutdown="SHUTDOWN">
  <!-- 2.Listener 相关 -->
  <Listener className="org.apache.catalina.startup.VersionLoggerListener" />
  <Listener className="org.apache.catalina.core.AprLifecycleListener" SSLEngine="on" />
  <Listener className="org.apache.catalina.core.JreMemoryLeakPreventionListener" />
  <Listener className="org.apache.catalina.mbeans.GlobalResourcesLifecycleListener" />
  <Listener className="org.apache.catalina.core.ThreadLocalLeakPreventionListener" />

  <!-- 3.GlobalNamingResources 相关 -->
  <GlobalNamingResources>
    <Resource name="UserDatabase" auth="Container"
              type="org.apache.catalina.UserDatabase"
              description="User database that can be updated and saved"
              factory="org.apache.catalina.users.MemoryUserDatabaseFactory"
              pathname="conf/tomcat-users.xml" />
  </GlobalNamingResources>

  <!-- 4.service 相关 -->
  <Service name="Catalina">
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" />
    <Engine name="Catalina" defaultHost="localhost">
      <Realm className="org.apache.catalina.realm.LockOutRealm">
        <Realm className="org.apache.catalina.realm.UserDatabaseRealm"
               resourceName="UserDatabase"/>
      </Realm>
      <Host name="localhost"  appBase="webapps"
            unpackWARs="true" autoDeploy="true">
        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b" />
      </Host>
    </Engine>
  </Service>
</Server>
```

接着来看一下 `StandardServer.class` 的组成，它的继承关系我们之前看过了，这里再放上一次：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245326940717fc5b54b3cdf6df0f4e8d73f572ff6.png)

接下来我们主要关注的有两块：

- `Server` 接口相关方法的实现
- `LifecycleBase` 中几个抽象方法的实现

先来看一下 `Server` 接口中定义的方法，分两块：**公共属性部分**、**`Service`相关方法**。

先来看 **公共属性** 部分的方法：

```java
/**
 * @return the global naming resources.
 */
public NamingResourcesImpl getGlobalNamingResources();

/**
 * Set the global naming resources.
 *
 * @param globalNamingResources The new global naming resources
 */
public void setGlobalNamingResources
    (NamingResourcesImpl globalNamingResources);

/**
 * @return the global naming resources context.
 */
public javax.naming.Context getGlobalNamingContext();

/**
 * @return the port number we listen to for shutdown commands.
 *
 * @see #getPortOffset()
 * @see #getPortWithOffset()
 */
public int getPort();

/**
 * Set the port number we listen to for shutdown commands.
 * 该服务器等待关闭命令的TCP / IP端口号。设置为-1禁用关闭端口。
 * @param port The new port number
 *
 * @see #setPortOffset(int)
 */
public void setPort(int port);

/**
 * Get the number that offsets the port used for shutdown commands.
 * For example, if port is 8005, and portOffset is 1000,
 * the server listens at 9005.
 * 获取用于关闭命令的端口偏移量。例如，如果端口为8005，而端口偏移量为1000，则服务器在9005处监听。
 * @return the port offset
 */
public int getPortOffset();

/**
 * Set the number that offsets the server port used for shutdown commands.
 * For example, if port is 8005, and you set portOffset to 1000,
 * connector listens at 9005.
 *
 * @param portOffset sets the port offset
 */
public void setPortOffset(int portOffset);

/**
 * Get the actual port on which server is listening for the shutdown commands.
 * If you do not set port offset, port is returned. If you set
 * port offset, port offset + port is returned.
 * 获取服务器监听关机命令的实际端口。如果不设置端口偏移量，则返回端口。如果设置端口偏移量，则返回端口偏移量+端口。
 * @return the port with offset
 */
public int getPortWithOffset();

/**
 * @return the address on which we listen to for shutdown commands.
 */
public String getAddress();

/**
 * Set the address on which we listen to for shutdown commands.
 * 该服务器等待关闭命令的TCP / IP地址。如果未指定地址，localhost则使用。
 * @param address The new address
 */
public void setAddress(String address);

/**
 * @return the shutdown command string we are waiting for.
 */
public String getShutdown();

/**
 * Set the shutdown command we are waiting for.
 * 设置shutdown指令，这个指令用来关闭Server
 * @param shutdown The new shutdown command
 */
public void setShutdown(String shutdown);

/**
 * @return the parent class loader for this component. If not set, return
 * {@link #getCatalina()} {@link Catalina#getParentClassLoader()}. If
 * catalina has not been set, return the system class loader.
 */
public ClassLoader getParentClassLoader();

/**
 * Set the parent class loader for this server.
 *
 * @param parent The new parent class loader
 */
public void setParentClassLoader(ClassLoader parent);

/**
 * @return the outer Catalina startup/shutdown component if present.
 */
public Catalina getCatalina();

/**
 * Set the outer Catalina startup/shutdown component if present.
 *
 * @param catalina the outer Catalina component
 */
public void setCatalina(Catalina catalina);

/**
 * @return the configured base (instance) directory. Note that home and base
 * may be the same (and are by default). If this is not set the value
 * returned by {@link #getCatalinaHome()} will be used.
 */
public File getCatalinaBase();

/**
 * Set the configured base (instance) directory. Note that home and base
 * may be the same (and are by default).
 *
 * @param catalinaBase the configured base directory
 */
public void setCatalinaBase(File catalinaBase);


/**
 * @return the configured home (binary) directory. Note that home and base
 * may be the same (and are by default).
 */
public File getCatalinaHome();

/**
 * Set the configured home (binary) directory. Note that home and base
 * may be the same (and are by default).
 *
 * @param catalinaHome the configured home directory
 */
public void setCatalinaHome(File catalinaHome);

/**
 * Get the utility thread count.
 * 获取此service中用于各种实用程序任务（包括重复执行的线程）的线程数
 * @return the thread count
 */
public int getUtilityThreads();

/**
 * Set the utility thread count.
 * @param utilityThreads the new thread count
 */
public void setUtilityThreads(int utilityThreads);
```

然后是 **`Service` 相关的方法**：

```java
/**
 * Add a new Service to the set of defined Services.
 *
 * @param service The Service to be added
 */
public void addService(Service service);

/**
 * Wait until a proper shutdown command is received, then return.
 */
public void await();

/**
 * Find the specified Service
 *
 * @param name Name of the Service to be returned
 * @return the specified Service, or <code>null</code> if none exists.
 */
public Service findService(String name);

/**
 * @return the set of Services defined within this Server.
 */
public Service[] findServices();

/**
 * Remove the specified Service from the set associated from this
 * Server.
 *
 * @param service The Service to be removed
 */
public void removeService(Service service);

/**
 * @return the token necessary for operations on the associated JNDI naming
 * context.
 */
public Object getNamingToken();

/**
 * @return the utility executor managed by the Service.
 */
public ScheduledExecutorService getUtilityExecutor();
```

挑了几个我认为比较值得关注的方法，来看一下它们具体实现。

`await()` 方法，这个方法中启动了一个 `Socket` 连接，用来接收 `Shutdown` 指令：

```java
/**
 * Wait until a proper shutdown command is received, then return.
 * This keeps the main thread alive - the thread pool listening for http
 * connections is daemon threads.
 */
@Override
public void await() {
    // Negative values - don't wait on port - tomcat is embedded or we just don't like ports
    if (getPortWithOffset() == -2) {
        // undocumented yet - for embedding apps that are around, alive.
        return;
    }
    if (getPortWithOffset() == -1) {
        try {
            awaitThread = Thread.currentThread();
            // 每10s检测一次
            while(!stopAwait) {
                try {
                    Thread.sleep( 10000 );
                } catch( InterruptedException ex ) {
                    // continue and check the flag
                }
            }
        } finally {
            awaitThread = null;
        }
        return;
    }

    // Set up a server socket to wait on
    try {
        // 创建一个Socket连接，端口号使用计算过偏移量之后的端口，address没有配置则使用localhost，用来接收shutdown命令
        awaitSocket = new ServerSocket(getPortWithOffset(), 1,
                InetAddress.getByName(address));
    } catch (IOException e) {
        log.error(sm.getString("standardServer.awaitSocket.fail", address,
                String.valueOf(getPortWithOffset()), String.valueOf(getPort()),
                String.valueOf(getPortOffset())), e);
        return;
    }

    try {
        awaitThread = Thread.currentThread();

        // Loop waiting for a connection and a valid command
        while (!stopAwait) {
            ServerSocket serverSocket = awaitSocket;
            if (serverSocket == null) {
                break;
            }

            // Wait for the next connection
            Socket socket = null;
            StringBuilder command = new StringBuilder();
            try {
                InputStream stream;
                long acceptStartTime = System.currentTimeMillis();
                try {
                    socket = serverSocket.accept();
                    socket.setSoTimeout(10 * 1000);  // Ten seconds
                    stream = socket.getInputStream();
                } catch (SocketTimeoutException ste) {
                    // This should never happen but bug 56684 suggests that
                    // it does.
                    log.warn(sm.getString("standardServer.accept.timeout",
                            Long.valueOf(System.currentTimeMillis() - acceptStartTime)), ste);
                    continue;
                } catch (AccessControlException ace) {
                    log.warn(sm.getString("standardServer.accept.security"), ace);
                    continue;
                } catch (IOException e) {
                    if (stopAwait) {
                        // Wait was aborted with socket.close()
                        break;
                    }
                    log.error(sm.getString("standardServer.accept.error"), e);
                    break;
                }

                // Read a set of characters from the socket
                int expected = 1024; // Cut off to avoid DoS attack
                while (expected < shutdown.length()) {
                    if (random == null) {
                        random = new Random();
                    }
                    expected += (random.nextInt() % 1024);
                }
                while (expected > 0) {
                    int ch = -1;
                    try {
                        ch = stream.read();
                    } catch (IOException e) {
                        log.warn(sm.getString("standardServer.accept.readError"), e);
                        ch = -1;
                    }
                    // Control character or EOF (-1) terminates loop
                    if (ch < 32 || ch == 127) {
                        break;
                    }
                    // 读取Socket接收到的数据
                    command.append((char) ch);
                    expected--;
                }
            } finally {
                // Close the socket now that we are done with it
                try {
                    if (socket != null) {
                        socket.close();
                    }
                } catch (IOException e) {
                    // Ignore
                }
            }

            // Match against our command string
            // 判断接收到的命令是否与事先指定的shutdown命令吻合
            boolean match = command.toString().equals(shutdown);
            if (match) {
                log.info(sm.getString("standardServer.shutdownViaPort"));
                // 命令正确跳出循环
                break;
            } else {
                log.warn(sm.getString("standardServer.invalidShutdownCommand", command.toString()));
            }
        }
    } finally {
        ServerSocket serverSocket = awaitSocket;
        awaitThread = null;
        awaitSocket = null;

        // Close the server socket and return
        if (serverSocket != null) {
            try {
                // 关闭socket连接
                serverSocket.close();
            } catch (IOException e) {
                // Ignore
            }
        }
    }
}

```

线程池相关的方法

```java
/**
 * 获取内部线程数
 * Handles the special values.
 */
private static int getUtilityThreadsInternal(int utilityThreads) {
    int result = utilityThreads;
    if (result <= 0) {
        // `Runtime.getRuntime().availableProcessors()`: 可供虚拟机使用的最大处理器数量
        result = Runtime.getRuntime().availableProcessors() + result;
        if (result < 2) {
            result = 2;
        }
    }
    return result;
}


@Override
public void setUtilityThreads(int utilityThreads) {
    // Use local copies to ensure thread safety
    int oldUtilityThreads = this.utilityThreads;
    if (getUtilityThreadsInternal(utilityThreads) < getUtilityThreadsInternal(oldUtilityThreads)) {
        return;
    }
    this.utilityThreads = utilityThreads;
    if (oldUtilityThreads != utilityThreads && utilityExecutor != null) {
        reconfigureUtilityExecutor(getUtilityThreadsInternal(utilityThreads));
    }
}


/**
 * 配置线程池，线程池中只指定了corePoolSize
 * @param threads
 */
private void reconfigureUtilityExecutor(int threads) {
    synchronized (utilityExecutorLock) {
        // The ScheduledThreadPoolExecutor doesn't use MaximumPoolSize, only CorePoolSize is available
        if (utilityExecutor != null) {
            utilityExecutor.setCorePoolSize(threads);
        } else {
            ScheduledThreadPoolExecutor scheduledThreadPoolExecutor =
                    new ScheduledThreadPoolExecutor(threads,
                            new TaskThreadFactory("Catalina-utility-", utilityThreadsAsDaemon, Thread.MIN_PRIORITY));
            scheduledThreadPoolExecutor.setKeepAliveTime(10, TimeUnit.SECONDS);
            scheduledThreadPoolExecutor.setRemoveOnCancelPolicy(true);
            scheduledThreadPoolExecutor.setExecuteExistingDelayedTasksAfterShutdownPolicy(false);
            utilityExecutor = scheduledThreadPoolExecutor;
            utilityExecutorWrapper = new org.apache.tomcat.util.threads.ScheduledThreadPoolExecutor(utilityExecutor);
        }
    }
}
```

`addService()` - 添加 `Service` ，`removeService()` 方法类似，这里就不放了。

```java
/**
 * Add a new Service to the set of defined Services.
 *
 * @param service The Service to be added
 */
@Override
public void addService(Service service) {
    service.setServer(this);
    synchronized (servicesLock) {
        // 数组扩容，然后将新的Service添加到末尾
        Service results[] = new Service[services.length + 1];
        System.arraycopy(services, 0, results, 0, services.length);
        results[services.length] = service;
        services = results;

        if (getState().isAvailable()) {
            try {
                // 启动Service
                service.start();
            } catch (LifecycleException e) {
                // Ignore
            }
        }

        // 通知观察者
        // Report this property change to interested listeners
        support.firePropertyChange("service", null, service);
    }
}
```

然后回到 `LifecycleBase.class` 部分，在这个类中定义了4个抽象方法，`Tomcat` 中各个组件都会实现这些方法，它们分别是：

```java
/**
 * Sub-classes implement this method to perform any instance initialisation
 * required.
 * 该抽象方法的作用是为了注册Bean
 *
 * @throws LifecycleException If the initialisation fails
 */
protected abstract void initInternal() throws LifecycleException;
    
/**
 * Sub-classes must ensure that the state is changed to
 * {@link LifecycleState#STARTING} during the execution of this method.
 * Changing state will trigger the {@link Lifecycle#START_EVENT} event.
 *
 * If a component fails to start it may either throw a
 * {@link LifecycleException} which will cause it's parent to fail to start
 * or it can place itself in the error state in which case {@link #stop()}
 * will be called on the failed component but the parent component will
 * continue to start normally.
 *
 * @throws LifecycleException Start error occurred
 */
protected abstract void startInternal() throws LifecycleException;

/**
 * Sub-classes must ensure that the state is changed to
 * {@link LifecycleState#STOPPING} during the execution of this method.
 * Changing state will trigger the {@link Lifecycle#STOP_EVENT} event.
 *
 * @throws LifecycleException Stop error occurred
 */
protected abstract void stopInternal() throws LifecycleException;

/**
 * Sub-classes implement this method to perform any instance destruction
 * required.
 * 该抽象方法的作用是为了卸载Bean
 * @throws LifecycleException If the destruction fails
 */
protected abstract void destroyInternal() throws LifecycleException;
```

来看一下它们在 `StandardServer.class` 中的实现：

`initInternal()` - 初始化 `Server`：

```java
/**
 * Invoke a pre-startup initialization. This is used to allow connectors
 * to bind to restricted ports under Unix operating environments.
 * 初始化Server，完成一些属性的初始化和注册，并将所有的Service初始化
 */
@Override
protected void initInternal() throws LifecycleException {

    super.initInternal();

    // Initialize utility executor
    // 配置线程池
    reconfigureUtilityExecutor(getUtilityThreadsInternal(utilityThreads));
    register(utilityExecutor, "type=UtilityExecutor");

    // Register global String cache
    // Note although the cache is global, if there are multiple Servers
    // present in the JVM (may happen when embedding) then the same cache
    // will be registered under multiple names
    onameStringCache = register(new StringCache(), "type=StringCache");

    // Register the MBeanFactory
    MBeanFactory factory = new MBeanFactory();
    factory.setContainer(this);
    onameMBeanFactory = register(factory, "type=MBeanFactory");

    // Register the naming resources
    globalNamingResources.init();

    // Populate the extension validator with JARs from common and shared
    // class loaders
    if (getCatalina() != null) {
        ClassLoader cl = getCatalina().getParentClassLoader();
        // Walk the class loader hierarchy. Stop at the system class loader.
        // This will add the shared (if present) and common class loaders
        while (cl != null && cl != ClassLoader.getSystemClassLoader()) {
            if (cl instanceof URLClassLoader) {
                URL[] urls = ((URLClassLoader) cl).getURLs();
                for (URL url : urls) {
                    if (url.getProtocol().equals("file")) {
                        try {
                            File f = new File (url.toURI());
                            if (f.isFile() &&
                                    f.getName().endsWith(".jar")) {
                                // 获取jar包的manifest文件信息，manifest文件定义了jar包的基本信息，包含创建人、版本、启动类等信息
                                // 这个信息会在之后启动Context组件时进行验证，见StandardContext.startInternal()方法
                                ExtensionValidator.addSystemResource(f);
                            }
                        } catch (URISyntaxException | IOException e) {
                            // Ignore
                        }
                    }
                }
            }
            cl = cl.getParent();
        }
    }
    // 初始化所有的Service
    // Initialize our defined Services
    for (Service service : services) {
        service.init();
    }
}
```

`startInternal()` - 启动组件

```java
/**
 * Start nested components ({@link Service}s) and implement the requirements
 * of {@link org.apache.catalina.util.LifecycleBase#startInternal()}.
 * 启动嵌套在当前Server下的Service
 * @exception LifecycleException if this component detects a fatal error
 *  that prevents this component from being used
 */
@Override
protected void startInternal() throws LifecycleException {

    fireLifecycleEvent(CONFIGURE_START_EVENT, null);
    setState(LifecycleState.STARTING);
    // 调用LifecycleBase.start()
    globalNamingResources.start();

    // Start our defined Services
    // 启动所有的Service
    synchronized (servicesLock) {
        for (Service service : services) {
            service.start();
        }
    }

    // 每60s执行一次startPeriodicLifecycleEvent()，periodicEventDelay是在startPeriodicLifecycleEvent()中轮询执行fireLifecycleEvent()的间隔
    if (periodicEventDelay > 0) {
        monitorFuture = getUtilityExecutor().scheduleWithFixedDelay(
                () -> startPeriodicLifecycleEvent(), 0, 60, TimeUnit.SECONDS);
    }
}


protected void startPeriodicLifecycleEvent() {
    if (periodicLifecycleEventFuture == null || (periodicLifecycleEventFuture != null && periodicLifecycleEventFuture.isDone())) {
        if (periodicLifecycleEventFuture != null && periodicLifecycleEventFuture.isDone()) {
            // There was an error executing the scheduled task, get it and log it
            try {
                periodicLifecycleEventFuture.get();
            } catch (InterruptedException | ExecutionException e) {
                log.error(sm.getString("standardServer.periodicEventError"), e);
            }
        }
        // 轮询触发 `PERIODIC_EVENT` 监听事件
        periodicLifecycleEventFuture = getUtilityExecutor().scheduleAtFixedRate(
                () -> fireLifecycleEvent(Lifecycle.PERIODIC_EVENT, null), periodicEventDelay, periodicEventDelay, TimeUnit.SECONDS);
    }
}
```

`stopInternal`

```java
/**
 * Stop nested components ({@link Service}s) and implement the requirements
 * of {@link org.apache.catalina.util.LifecycleBase#stopInternal()}.
 *
 * @exception LifecycleException if this component detects a fatal error
 *  that needs to be reported
 */
@Override
protected void stopInternal() throws LifecycleException {

    setState(LifecycleState.STOPPING);

    if (monitorFuture != null) {
        monitorFuture.cancel(true);
        monitorFuture = null;
    }
    if (periodicLifecycleEventFuture != null) {
        periodicLifecycleEventFuture.cancel(false);
        periodicLifecycleEventFuture = null;
    }

    fireLifecycleEvent(CONFIGURE_STOP_EVENT, null);

    // Stop our defined Services
    for (Service service : services) {
        service.stop();
    }

    globalNamingResources.stop();

    // 关闭用来接收 `ShutDown` 指令的 `Socket` 连接
    stopAwait();
}
```

`destroyInternal()`

```java
@Override
protected void destroyInternal() throws LifecycleException {
    // Destroy our defined Services
    for (Service service : services) {
        service.destroy();
    }

    globalNamingResources.destroy();

    unregister(onameMBeanFactory);

    unregister(onameStringCache);

    if (utilityExecutor != null) {
        utilityExecutor.shutdownNow();
        unregister("type=UtilityExecutor");
        utilityExecutor = null;
    }

    super.destroyInternal();
}
```

这4个抽象方法都是在 `LifecycleBase` 中完成调用的，这样设计的意图很明显，每个组件的4个步骤都有自己的实现逻辑。对应的4个方法是：`init()`、`start()`、`stop()`、`destroy()`，来看一下相关的代码：

```java
/**
 * 组件的初始化
 * @throws LifecycleException
 */
@Override
public final synchronized void init() throws LifecycleException {
    // 非NEW状态，不允许调用init()方法
    if (!state.equals(LifecycleState.NEW)) {
        invalidTransition(Lifecycle.BEFORE_INIT_EVENT);
    }

    try {
        // 初始化逻辑之前，先将状态变更为`INITIALIZING`
        setStateInternal(LifecycleState.INITIALIZING, null, false);
        // 初始化，该方法为一个abstract方法，需要组件自行实现，主要工作是注册Bean
        initInternal();
        // 初始化完成之后，状态变更为`INITIALIZED`
        setStateInternal(LifecycleState.INITIALIZED, null, false);
    } catch (Throwable t) {
        // 初始化的过程中，可能会有异常抛出，这时需要捕获异常，并将状态变更为`FAILED`
        handleSubClassException(t, "lifecycleBase.initFail", toString());
    }
}
```

```java
/**
 * 启动
 * {@inheritDoc}
 */
@Override
public final synchronized void start() throws LifecycleException {
    // 生命周期状态为 `STARTING_PREP`、`STARTING`和 `STARTED` 时，将忽略 `start()` 逻辑
    if (LifecycleState.STARTING_PREP.equals(state) || LifecycleState.STARTING.equals(state) ||
            LifecycleState.STARTED.equals(state)) {

        if (log.isDebugEnabled()) {
            Exception e = new LifecycleException();
            log.debug(sm.getString("lifecycleBase.alreadyStarted", toString()), e);
        } else if (log.isInfoEnabled()) {
            log.info(sm.getString("lifecycleBase.alreadyStarted", toString()));
        }

        return;
    }

    if (state.equals(LifecycleState.NEW)) {
        // `NEW`状态时，执行init()方法
        init();
    } else if (state.equals(LifecycleState.FAILED)) {
        // `FAILED`状态时，执行stop()方法
        stop();
    } else if (!state.equals(LifecycleState.INITIALIZED) &&
            !state.equals(LifecycleState.STOPPED)) {
        // 不是`INITIALIZED`和`STOPPED`时，则说明是非法的操作
        invalidTransition(Lifecycle.BEFORE_START_EVENT);
    }

    try {
        // start前的状态设置
        setStateInternal(LifecycleState.STARTING_PREP, null, false);
        // start逻辑，抽象方法，由组件自行实现
        startInternal();
        // start过程中，可能因为某些原因失败，这时需要stop操作
        if (state.equals(LifecycleState.FAILED)) {
            // This is a 'controlled' failure. The component put itself into the
            // FAILED state so call stop() to complete the clean-up.
            stop();
        } else if (!state.equals(LifecycleState.STARTING)) {
            // Shouldn't be necessary but acts as a check that sub-classes are
            // doing what they are supposed to.
            invalidTransition(Lifecycle.AFTER_START_EVENT);
        } else {
            // 设置状态为STARTED
            setStateInternal(LifecycleState.STARTED, null, false);
        }
    } catch (Throwable t) {
        // This is an 'uncontrolled' failure so put the component into the
        // FAILED state and throw an exception.
        handleSubClassException(t, "lifecycleBase.startFail", toString());
    }
}
```

```java
/**
 * {@inheritDoc}
 */
@Override
public final synchronized void stop() throws LifecycleException {
    // 生命周期状态为 `STOPPING_PREP`、`STOPPING`和 `STOPPED` 时，将忽略 `stop()` 逻辑
    if (LifecycleState.STOPPING_PREP.equals(state) || LifecycleState.STOPPING.equals(state) ||
            LifecycleState.STOPPED.equals(state)) {

        if (log.isDebugEnabled()) {
            Exception e = new LifecycleException();
            log.debug(sm.getString("lifecycleBase.alreadyStopped", toString()), e);
        } else if (log.isInfoEnabled()) {
            log.info(sm.getString("lifecycleBase.alreadyStopped", toString()));
        }

        return;
    }

    // `NEW`状态时，直接将状态变更为`STOPPED`
    if (state.equals(LifecycleState.NEW)) {
        state = LifecycleState.STOPPED;
        return;
    }

    // stop()的执行，必须要是`STARTED`和`FAILED`
    if (!state.equals(LifecycleState.STARTED) && !state.equals(LifecycleState.FAILED)) {
        invalidTransition(Lifecycle.BEFORE_STOP_EVENT);
    }

    try {
        // `FAILED`时，直接触发BEFORE_STOP_EVENT事件
        if (state.equals(LifecycleState.FAILED)) {
            // Don't transition to STOPPING_PREP as that would briefly mark the
            // component as available but do ensure the BEFORE_STOP_EVENT is
            // fired
            fireLifecycleEvent(BEFORE_STOP_EVENT, null);
        } else {
            // 否则，设置状态为STOPPING_PREP
            setStateInternal(LifecycleState.STOPPING_PREP, null, false);
        }

        // stop逻辑，抽象方法，组件自行实现
        stopInternal();

        // Shouldn't be necessary but acts as a check that sub-classes are
        // doing what they are supposed to.
        // 不是`STOPPING`和`FAILED`时，则说明是非法的操作
        if (!state.equals(LifecycleState.STOPPING) && !state.equals(LifecycleState.FAILED)) {
            invalidTransition(Lifecycle.AFTER_STOP_EVENT);
        }

        // 设置状态为STOPPED
        setStateInternal(LifecycleState.STOPPED, null, false);
    } catch (Throwable t) {
        handleSubClassException(t, "lifecycleBase.stopFail", toString());
    } finally {
        if (this instanceof Lifecycle.SingleUse) {
            // Complete stop process first
            setStateInternal(LifecycleState.STOPPED, null, false);
            destroy();
        }
    }
}
```

```java
@Override
public final synchronized void destroy() throws LifecycleException {
    // `FAILED`状态时，直接触发stop()逻辑
    if (LifecycleState.FAILED.equals(state)) {
        try {
            // Triggers clean-up
            stop();
        } catch (LifecycleException e) {
            // Just log. Still want to destroy.
            log.error(sm.getString("lifecycleBase.destroyStopFail", toString()), e);
        }
    }

    // `DESTROYING`和`DESTROYED`时，忽略destroy的执行
    if (LifecycleState.DESTROYING.equals(state) || LifecycleState.DESTROYED.equals(state)) {
        if (log.isDebugEnabled()) {
            Exception e = new LifecycleException();
            log.debug(sm.getString("lifecycleBase.alreadyDestroyed", toString()), e);
        } else if (log.isInfoEnabled() && !(this instanceof Lifecycle.SingleUse)) {
            // Rather than have every component that might need to call
            // destroy() check for SingleUse, don't log an info message if
            // multiple calls are made to destroy()
            log.info(sm.getString("lifecycleBase.alreadyDestroyed", toString()));
        }

        return;
    }

    // 非法状态判断
    if (!state.equals(LifecycleState.STOPPED) && !state.equals(LifecycleState.FAILED) &&
            !state.equals(LifecycleState.NEW) && !state.equals(LifecycleState.INITIALIZED)) {
        invalidTransition(Lifecycle.BEFORE_DESTROY_EVENT);
    }

    try {
        // destroy前状态设置
        setStateInternal(LifecycleState.DESTROYING, null, false);
        // 抽象方法，组件自行实现，主要工作是卸载Bean
        destroyInternal();
        // destroy后状态设置
        setStateInternal(LifecycleState.DESTROYED, null, false);
    } catch (Throwable t) {
        handleSubClassException(t, "lifecycleBase.destroyFail", toString());
    }
}
```

## `Service` 的实现：`StandardService` 代码分析

看一下 `StandardService` 的继承关系：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642453529421d1430d32288ce52ef8c928069d014ad.png)

可以发现与 `StandardServer` 类似，因此分析它的源码也按照 `StandardServer` 的方法来进行。

先来看一下 `server.xml` 中关于 `service` 的配置：

```xml
<Service name="Catalina">
  <Connector port="8080" protocol="HTTP/1.1"
             connectionTimeout="20000"
             redirectPort="8443" />
  <Engine name="Catalina" defaultHost="localhost">
    <Realm className="org.apache.catalina.realm.LockOutRealm">
      <Realm className="org.apache.catalina.realm.UserDatabaseRealm"
             resourceName="UserDatabase"/>
    </Realm>
    <Host name="localhost"  appBase="webapps"
          unpackWARs="true" autoDeploy="true">
      <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
             prefix="localhost_access_log" suffix=".txt"
             pattern="%h %l %u %t &quot;%r&quot; %s %b" />
    </Host>
  </Engine>
</Service>
```

可以清晰的看到 `Service` 中包含的子容器，包括：`Engine` 和 `Connector`。下面来根据 `StandardService` 的继承关系来分析源码，先来看 `Service` 接口部分的方法：

公共属性部分：

```java
/**
 * @return the name of this Service.
 */
public String getName();

/**
 * Set the name of this Service.
 * 设置Service Name
 * @param name The new service name
 */
public void setName(String name);
```

`Engine` 部分：

```java
/**
 * @return the <code>Engine</code> that handles requests for all
 * <code>Connectors</code> associated with this Service.
 */
public Engine getContainer();

/**
 * Set the <code>Engine</code> that handles requests for all
 * <code>Connectors</code> associated with this Service.
 * 设置Engine
 * @param engine The new Engine
 */
public void setContainer(Engine engine);
```

父 `Server` 相关：

```java
/**
  * @return the <code>Server</code> with which we are associated (if any).
  */
public Server getServer();

/**
  * Set the <code>Server</code> with which we are associated (if any).
  *
  * @param server The server that owns this Service
  */
public void setServer(Server server);

/**
  * @return the parent class loader for this component. If not set, return
  * {@link #getServer()} {@link Server#getParentClassLoader()}. If no server
  * has been set, return the system class loader.
  */
public ClassLoader getParentClassLoader();

/**
  * Set the parent class loader for this service.
  *
  * @param parent The new parent class loader
  */
public void setParentClassLoader(ClassLoader parent);

/**
  * @return the domain under which this container will be / has been
  * registered.
  */
public String getDomain();

```

`Connector` 相关

```java
/**
  * Add a new Connector to the set of defined Connectors, and associate it
  * with this Service's Container.
  *
  * @param connector The Connector to be added
  */
public void addConnector(Connector connector);

/**
  * Find and return the set of Connectors associated with this Service.
  *
  * @return the set of associated Connectors
  */
public Connector[] findConnectors();

/**
  * Remove the specified Connector from the set associated from this
  * Service.  The removed Connector will also be disassociated from our
  * Container.
  *
  * @param connector The Connector to be removed
  */
public void removeConnector(Connector connector);
```

`Executor` 相关

```java
/**
  * Adds a named executor to the service
  * @param ex Executor
  */
public void addExecutor(Executor ex);

/**
  * Retrieves all executors
  * @return Executor[]
  */
public Executor[] findExecutors();

/**
  * Retrieves executor by name, null if not found
  * @param name String
  * @return Executor
  */
public Executor getExecutor(String name);

/**
  * Removes an executor from the service
  * @param ex Executor
  */
public void removeExecutor(Executor ex);
```

还有一个 `Mapper` 相关的方法。这个 `Mapper` 是 `Tomcat` 处理 `Http` 请求时非常重要的组件。`Tomcat` 使用 `Mapper` 来处理一个 `Request` 到 `Host`、`Context` 的映射关系，从而决定使用哪个 `Service` 来处理请求。 它与 `StandardService` 中的成员变量 `MapperListener` 结合使用，这个之后会重点分析。

```java
/**
 * @return the mapper associated with this Service.
 */
Mapper getMapper();
```

看一下这些方法在 `StandardService` 中的实现，有些方法实现比较简单，就不放上来了：

```java
@Override
public void setContainer(Engine engine) {
    // 每个Service元素只能有一个Engine元素，这里将旧的Engine作废
    Engine oldEngine = this.engine;
    if (oldEngine != null) {
        oldEngine.setService(null);
    }
    // 设置新的Engine
    this.engine = engine;
    if (this.engine != null) {
        this.engine.setService(this);
    }
    if (getState().isAvailable()) {
        if (this.engine != null) {
            try {
                // 启动Engine
                this.engine.start();
            } catch (LifecycleException e) {
                log.error(sm.getString("standardService.engine.startFailed"), e);
            }
        }
        // 重启Mapper - Restart MapperListener to pick up new engine.
        try {
            mapperListener.stop();
        } catch (LifecycleException e) {
            log.error(sm.getString("standardService.mapperListener.stopFailed"), e);
        }
        try {
            mapperListener.start();
        } catch (LifecycleException e) {
            log.error(sm.getString("standardService.mapperListener.startFailed"), e);
        }
        // 关闭旧Engine
        if (oldEngine != null) {
            try {
                oldEngine.stop();
            } catch (LifecycleException e) {
                log.error(sm.getString("standardService.engine.stopFailed"), e);
            }
        }
    }

    // 触发container属性变更事件
    // Report this property change to interested listeners
    support.firePropertyChange("container", oldEngine, this.engine);
}

/**
 * Add a new Connector to the set of defined Connectors, and associate it
 * with this Service's Container.
 * 添加一个新的Conntector，并将它和当前的Service关联
 * @param connector The Connector to be added
 */
@Override
public void addConnector(Connector connector) {
    // 数组扩容
    synchronized (connectorsLock) {
        // 关联Service
        connector.setService(this);
        Connector results[] = new Connector[connectors.length + 1];
        System.arraycopy(connectors, 0, results, 0, connectors.length);
        results[connectors.length] = connector;
        connectors = results;
    }
  
    // 启动新添加进来的connector
    try {
        if (getState().isAvailable()) {
            connector.start();
        }
    } catch (LifecycleException e) {
        throw new IllegalArgumentException(
                sm.getString("standardService.connector.startFailed", connector), e);
    }
  
    // connector改变事件
    // Report this property change to interested listeners
    support.firePropertyChange("connector", null, connector);
}
```

再来看一下 `LifecycleBase` 部分的方法实现：

```java
/**
 * Invoke a pre-startup initialization. This is used to allow connectors
 * to bind to restricted ports under Unix operating environments.
 */
@Override
protected void initInternal() throws LifecycleException {

    super.initInternal();

    // 初始化Engine
    if (engine != null) {
        engine.init();
    }

    // Initialize any Executors
    // 初始化Executors
    for (Executor executor : findExecutors()) {
        if (executor instanceof JmxEnabled) {
            ((JmxEnabled) executor).setDomain(getDomain());
        }
        executor.init();
    }

    // Initialize mapper listener
    // 初始化监听器
    mapperListener.init();

    // Initialize our defined Connectors
    // 初始化Connector
    synchronized (connectorsLock) {
        for (Connector connector : connectors) {
            connector.init();
        }
    }
}

/**
 * Start nested components ({@link Executor}s, {@link Connector}s and
 * {@link Container}s) and implement the requirements of
 * {@link org.apache.catalina.util.LifecycleBase#startInternal()}.
 *
 * @exception LifecycleException if this component detects a fatal error
 *  that prevents this component from being used
 */
@Override
protected void startInternal() throws LifecycleException {

    if(log.isInfoEnabled()) {
        log.info(sm.getString("standardService.start.name", this.name));
    }
    setState(LifecycleState.STARTING);

    // Start our defined Container first
    // 启动Engine
    if (engine != null) {
        synchronized (engine) {
            engine.start();
        }
    }
    // 启动Executors
    synchronized (executors) {
        for (Executor executor: executors) {
            executor.start();
        }
    }

    // 启动mapperListener
    mapperListener.start();

    // Start our defined Connectors second
    // 启动Connector
    synchronized (connectorsLock) {
        for (Connector connector: connectors) {
            // If it has already failed, don't try and start it
            if (connector.getState() != LifecycleState.FAILED) {
                connector.start();
            }
        }
    }
}

/**
 * Stop nested components ({@link Executor}s, {@link Connector}s and
 * {@link Container}s) and implement the requirements of
 * {@link org.apache.catalina.util.LifecycleBase#stopInternal()}.
 *
 * @exception LifecycleException if this component detects a fatal error
 *  that needs to be reported
 */
@Override
protected void stopInternal() throws LifecycleException {

    synchronized (connectorsLock) {
        // Initiate a graceful stop for each connector
        // This will only work if the bindOnInit==false which is not the
        // default.
        for (Connector connector: connectors) {
            connector.getProtocolHandler().closeServerSocketGraceful();
        }

        // Wait for the graceful shutdown to complete
        long waitMillis = gracefulStopAwaitMillis;
        if (waitMillis > 0) {
            for (Connector connector: connectors) {
                waitMillis = connector.getProtocolHandler().awaitConnectionsClose(waitMillis);
            }
        }

        // Pause the connectors
        for (Connector connector: connectors) {
            connector.pause();
        }
    }

    if(log.isInfoEnabled()) {
        log.info(sm.getString("standardService.stop.name", this.name));
    }
    setState(LifecycleState.STOPPING);

    // Stop our defined Container once the Connectors are all paused
    if (engine != null) {
        synchronized (engine) {
            engine.stop();
        }
    }

    // Now stop the connectors
    synchronized (connectorsLock) {
        for (Connector connector: connectors) {
            if (!LifecycleState.STARTED.equals(
                    connector.getState())) {
                // Connectors only need stopping if they are currently
                // started. They may have failed to start or may have been
                // stopped (e.g. via a JMX call)
                continue;
            }
            connector.stop();
        }
    }

    // If the Server failed to start, the mapperListener won't have been
    // started
    if (mapperListener.getState() != LifecycleState.INITIALIZED) {
        mapperListener.stop();
    }

    synchronized (executors) {
        for (Executor executor: executors) {
            executor.stop();
        }
    }
}

@Override
protected void destroyInternal() throws LifecycleException {
    mapperListener.destroy();

    // Destroy our defined Connectors
    synchronized (connectorsLock) {
        for (Connector connector : connectors) {
            connector.destroy();
        }
    }

    // Destroy any Executors
    for (Executor executor : findExecutors()) {
        executor.destroy();
    }

    if (engine != null) {
        engine.destroy();
    }

    super.destroyInternal();
}
```

最后重点看下 `Mapper` 和 `MapperListener` 相关的配置。这里就简单说明一下它们两个的作用：

> `Mapper` 作为 `uri` 映射到容器的工具，扮演的角色就是一个映射组件。它会缓存所有容器信息（包括容器名称、容器本身、容器层级等等），同时提供映射规则，将一个 `uri` 按照映射规则映射到具体的 `Host`、`Context` 和 `Wrapper`，并最终通过 `Wrapper` 找到逻辑处理单元 `Servlet`。
> 
> `MapperListener` 的作用有两个：通过监听容器的 `AFTER_START_EVENT` 事件来对容器进行注册；通过监听容器的 `BEFORE_STOP_EVENT` 事件来完成对容器的取消注册。

关于它们的具体分析见：[深入理解Tomcat（九）MapperListener和Mapper](https://www.jianshu.com/p/a0a421f3f8e5)。

## `Excutor` 的实现 - `StandardThreadExecutor`

明白一个问题：**为什么 `Tomcat` 会自己构造一个 `StandardThreadExecutor` 而不是直接使用 `ThreadPoolExecutor`？**

`StandardThreadExecutor` 中值使用了 `execute` 的两个主要方法，它希望能够屏蔽掉 `ThreadPoolExecutor` 中的其他方法，这样调用层就无需再处理了。

## `Container` 的实现 - `ContainerBase`

在 `Tomcat` 中，`Container` 是 `Service` 中组件的总称，`Service` 中的组件基本都实现了这个接口。它们包括：`Engine`、`Host`、`Context`、`Wrapper`。如下图：
![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642453649450826000d848d9f6c09531ac412263d6a.jpg)

解释一下4个容器的作用：

- `Engine`。表示整个 `catalina` 的 `servlet` 引擎，多数情况下包含一个或多个子容器，这些子容器要么是 `Host`，要么是 `Context` 实现，或者是其他自定义组件。 
- `Host`。表示包含多个 `Context` 的虚拟主机的。 
- `Context`。表示一个 `ServletContext`，表示一个 `webapp`，它通常包含一个或多个 `wrapper`。 
- `Wrapper`。表示一个 `servlet` 定义的（如果 `servlet` 本身实现了 `SingleThreadModel`，则可能支持多个 `servlet` 实例）。

再来看下那张总图，看一下这些组件对应的位置：如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245386939fa1bbc667bd821d7224006710121b5b2.png)

从图中可以看出，除了上面提到的4个组件外，`Container` 中还包含一些支持组件，它们是：`Loader`、`Manager`、`Realm`、`Resource`、`Logger`、`Cluster`、`Pipeline`(`Valve` 的汇总)。

源码参考：[Tomcat - Request请求处理: Container设计](https://www.pdai.tech/md/framework/tomcat/tomcat-x-container.html)

## `Connector` - 连接器

> `Connector` 用于接受请求并将请求封装成 `Request` 和 `Response`，然后交给 `Container` 进行处理，`Container` 处理完之后再交给 `Connector` 返回给客户端。

这一块儿主要理清两个内容：`Connector` 主要做了哪些工作、`Executor` 是在哪里完成初始化的。

首先来看下 `Connector` 的构造函数：

```java
/**
  * Defaults to using HTTP/1.1 NIO implementation.
  */
public Connector() {
    this("HTTP/1.1");
}

public Connector(String protocol) {
    boolean apr = AprStatus.isAprAvailable() &&
        AprStatus.getUseAprConnector();
    ProtocolHandler p = null;
    try {
        p = ProtocolHandler.create(protocol, apr);
    } catch (Exception e) {
        log.error(sm.getString(
                "coyoteConnector.protocolHandlerInstantiationFailed"), e);
    }
    if (p != null) {
        protocolHandler = p;
        protocolHandlerClassName = protocolHandler.getClass().getName();
    } else {
        protocolHandler = null;
        protocolHandlerClassName = protocol;
    }
    // Default for Connector depends on this system property
    setThrowOnFailure(Boolean.getBoolean("org.apache.catalina.startup.EXIT_ON_INIT_FAILURE"));
}
```

可以看到主要工作是完成了对 `ProtocolHandler` 的初始化工作，看下 `ProtocolHandler.create()`：

```java
public static ProtocolHandler create(String protocol, boolean apr)
        throws ClassNotFoundException, InstantiationException, IllegalAccessException,
        IllegalArgumentException, InvocationTargetException, NoSuchMethodException, SecurityException {
    if (protocol == null || "HTTP/1.1".equals(protocol)
            || (!apr && org.apache.coyote.http11.Http11NioProtocol.class.getName().equals(protocol))
            || (apr && org.apache.coyote.http11.Http11AprProtocol.class.getName().equals(protocol))) {
        if (apr) {
            return new org.apache.coyote.http11.Http11AprProtocol();
        } else {
            return new org.apache.coyote.http11.Http11NioProtocol();
        }
    } else if ("AJP/1.3".equals(protocol)
            || (!apr && org.apache.coyote.ajp.AjpNioProtocol.class.getName().equals(protocol))
            || (apr && org.apache.coyote.ajp.AjpAprProtocol.class.getName().equals(protocol))) {
        if (apr) {
            return new org.apache.coyote.ajp.AjpAprProtocol();
        } else {
            return new org.apache.coyote.ajp.AjpNioProtocol();
        }
    } else {
        // Instantiate protocol handler
        Class<?> clazz = Class.forName(protocol);
        return (ProtocolHandler) clazz.getConstructor().newInstance();
    }
}
```

可以看到包含两种不同的协议实现：`Http11AprProtocol / Http11NioProtocol` 和 `AjpAprProtocol / AjpNioProtocol`。分别对应 `Http1.1` 协议和 `Ajp` 协议。

`Connector` 也实现了生命周期管理的接口，因此看一下它对 `initInternal()` 的实现：

```java
@Override
protected void initInternal() throws LifecycleException {

    super.initInternal();

    if (protocolHandler == null) {
        throw new LifecycleException(
                sm.getString("coyoteConnector.protocolHandlerInstantiationFailed"));
    }

    // 初始化 adapter
    adapter = new CoyoteAdapter(this);
    protocolHandler.setAdapter(adapter); // 交给protocolHandler
    if (service != null) {
        protocolHandler.setUtilityExecutor(service.getServer().getUtilityExecutor());
    }

    // 设置parseBody的方法，默认为POST
    if (null == parseBodyMethodsSet) {
        setParseBodyMethods(getParseBodyMethods());
    }

    // 校验
    if (protocolHandler.isAprRequired() && !AprStatus.isInstanceCreated()) {
        throw new LifecycleException(sm.getString("coyoteConnector.protocolHandlerNoAprListener",
                getProtocolHandlerClassName()));
    }
    if (protocolHandler.isAprRequired() && !AprStatus.isAprAvailable()) {
        throw new LifecycleException(sm.getString("coyoteConnector.protocolHandlerNoAprLibrary",
                getProtocolHandlerClassName()));
    }
    if (AprStatus.isAprAvailable() && AprStatus.getUseOpenSSL() &&
            protocolHandler instanceof AbstractHttp11JsseProtocol) {
        AbstractHttp11JsseProtocol<?> jsseProtocolHandler =
                (AbstractHttp11JsseProtocol<?>) protocolHandler;
        if (jsseProtocolHandler.isSSLEnabled() &&
                jsseProtocolHandler.getSslImplementationName() == null) {
            // OpenSSL is compatible with the JSSE configuration, so use it if APR is available
            jsseProtocolHandler.setSslImplementationName(OpenSSLImplementation.class.getName());
        }
    }

    try {
        // 调用protocolHandler的init
        protocolHandler.init(); 
    } catch (Exception e) {
        throw new LifecycleException(
                sm.getString("coyoteConnector.protocolHandlerInitializationFailed"), e);
    }
}
```

重点看下 `ProtocolHandler.init()` ：

```java
endpoint/**
  * Endpoint that provides low-level network I/O - must be matched to the
  * ProtocolHandler implementation (ProtocolHandler using NIO, requires NIO
  * Endpoint etc.).
  */
private final AbstractEndpoint<S,?> endpoint;

@Override
public void init() throws Exception {
    if (getLog().isInfoEnabled()) {
        getLog().info(sm.getString("abstractProtocolHandler.init", getName()));
        logPortOffset();
    }

    if (oname == null) {
        // Component not pre-registered so register it
        oname = createObjectName();
        if (oname != null) {
            Registry.getRegistry(null, null).registerComponent(this, oname, null);
        }
    }

    if (this.domain != null) {
        rgOname = new ObjectName(domain + ":type=GlobalRequestProcessor,name=" + getName());
        Registry.getRegistry(null, null).registerComponent(
                getHandler().getGlobal(), rgOname, null);
    }

    String endpointName = getName();
    endpoint.setName(endpointName.substring(1, endpointName.length()-1));
    endpoint.setDomain(domain);

    endpoint.init();
}

```

调用了 `endpoint.init()` 方法：

```java
public final void init() throws Exception {
    if (bindOnInit) {
        bindWithCleanup(); // 看这里
        bindState = BindState.BOUND_ON_INIT;
    }

    // 下面就是注册JMX，前文我们有讲
    if (this.domain != null) {
        // Register endpoint (as ThreadPool - historical name)
        oname = new ObjectName(domain + ":type=ThreadPool,name=\"" + getName() + "\"");
        Registry.getRegistry(null, null).registerComponent(this, oname, null);

        ObjectName socketPropertiesOname = new ObjectName(domain +
                ":type=SocketProperties,name=\"" + getName() + "\"");
        socketProperties.setObjectName(socketPropertiesOname);
        Registry.getRegistry(null, null).registerComponent(socketProperties, socketPropertiesOname, null);

        for (SSLHostConfig sslHostConfig : findSslHostConfigs()) {
            registerJmx(sslHostConfig);
        }
    }
}

private void bindWithCleanup() throws Exception {
    try {
        bind();
    } catch (Throwable t) {
        // Ensure open sockets etc. are cleaned up if something goes
        // wrong during bind
        ExceptionUtils.handleThrowable(t);
        unbind();
        throw t;
    }
}
```

看一下 `NioEndPoint.class` 对 `bind()` 方法的实现：

```java
/**
  * Initialize the endpoint.
  */
@Override
public void bind() throws Exception {
    initServerSocket();

    setStopLatch(new CountDownLatch(1));

    // Initialize SSL if needed
    initialiseSsl();

    selectorPool.open(getName());
}

// Separated out to make it easier for folks that extend NioEndpoint to
// implement custom [server]sockets
protected void initServerSocket() throws Exception {
    if (!getUseInheritedChannel()) {
        serverSock = ServerSocketChannel.open(); // 打开ServerSocket通道
        socketProperties.setProperties(serverSock.socket());
        InetSocketAddress addr = new InetSocketAddress(getAddress(), getPortWithOffset());
        serverSock.socket().bind(addr,getAcceptCount()); // 绑定到指定服务地址和端口，这样你才可以通过这个访问服务（处理请求）
    } else {
        // Retrieve the channel provided by the OS
        Channel ic = System.inheritedChannel();
        if (ic instanceof ServerSocketChannel) {
            serverSock = (ServerSocketChannel) ic;
        }
        if (serverSock == null) {
            throw new IllegalArgumentException(sm.getString("endpoint.init.bind.inherited"));
        }
    }
    serverSock.configureBlocking(true); //mimic APR behavior
}
```

可以看到，`endpoint.init()` 方法完成了对 `ServerSocket` 和 `SSL` 的初始化。

看完初始化方法 `initInternal()`，再来看下启动方法 `startInternal()`：

```java
/**
  * Begin processing requests via this Connector.
  *
  * @exception LifecycleException if a fatal startup error occurs
  */
@Override
protected void startInternal() throws LifecycleException {

    // Validate settings before starting
    if (getPortWithOffset() < 0) {
        throw new LifecycleException(sm.getString(
                "coyoteConnector.invalidPort", Integer.valueOf(getPortWithOffset())));
    }

    setState(LifecycleState.STARTING);

    try {
        protocolHandler.start();
    } catch (Exception e) {
        throw new LifecycleException(
                sm.getString("coyoteConnector.protocolHandlerStartFailed"), e);
    }
}
```

调用了 `protocolHandler.start()`

```java
@Override
public void start() throws Exception {
    if (getLog().isInfoEnabled()) {
        getLog().info(sm.getString("abstractProtocolHandler.start", getName()));
        logPortOffset();
    }

    // 本质是调用endpoint的start方法
    endpoint.start();

    // 启动一个异步的线程，处理startAsyncTimeout方法，每隔60秒执行一次
    monitorFuture = getUtilityExecutor().scheduleWithFixedDelay(
            new Runnable() {
                @Override
                public void run() {
                    if (!isPaused()) {
                        startAsyncTimeout();
                    }
                }
            }, 0, 60, TimeUnit.SECONDS);
}
```

同样的，在 `protocolHandler.start()` 中调用了 `endpoint.start()` 方法：

```java
public final void start() throws Exception {
    if (bindState == BindState.UNBOUND) {
        // 防止之前未初始化成功
        bindWithCleanup();
        bindState = BindState.BOUND_ON_START;
    }
    startInternal();
}
```

看一下 `NioEndPoint.class` 中的 `startInternal()` 方法：

```java
/**
  * Start the NIO endpoint, creating acceptor, poller threads.
  */
@Override
public void startInternal() throws Exception {

    if (!running) {
        running = true;
        paused = false;

        if (socketProperties.getProcessorCache() != 0) {
            processorCache = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                    socketProperties.getProcessorCache());
        }
        if (socketProperties.getEventCache() != 0) {
            eventCache = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                    socketProperties.getEventCache());
        }
        if (socketProperties.getBufferPool() != 0) {
            nioChannels = new SynchronizedStack<>(SynchronizedStack.DEFAULT_SIZE,
                    socketProperties.getBufferPool());
        }

        // 重点：创建了Executor
        if (getExecutor() == null) {
            createExecutor();
        }

        initializeConnectionLatch();

        // Start poller thread
        poller = new Poller();
        Thread pollerThread = new Thread(poller, getName() + "-ClientPoller");
        pollerThread.setPriority(threadPriority);
        pollerThread.setDaemon(true);
        pollerThread.start();

        startAcceptorThread();
    }
}
```

这里的重点是完成了对 `Executor` 的创建，`createExecutor()` 方法如下：

```java
public void createExecutor() {
    internalExecutor = true;
    TaskQueue taskqueue = new TaskQueue();
    TaskThreadFactory tf = new TaskThreadFactory(getName() + "-exec-", daemon, getThreadPriority());
    executor = new ThreadPoolExecutor(getMinSpareThreads(), getMaxThreads(), 60, TimeUnit.SECONDS,taskqueue, tf);
    taskqueue.setParent( (ThreadPoolExecutor) executor);
}
```

`Connector` 是 `Tomcat` 中最复杂的一块儿功能，更详细的解读见：[深入理解Tomcat（十）Connector](https://www.jianshu.com/p/3059328cd661)

## 参考文章 

[Java类加载机制-双亲委派机制说明](https://www.cnblogs.com/029zz010buct/p/10366808.html)

[Tomcat源码详解知识体系详解](https://pdai.tech/md/framework/tomcat/tomcat-overview.html)

[聊一聊 JAR 文件和 MANIFEST.MF](https://juejin.cn/post/6844903876877893640)

[深入理解Tomcat（九）MapperListener和Mapper](https://www.jianshu.com/p/a0a421f3f8e5)

[深入理解Tomcat（十）Connector](https://www.jianshu.com/p/3059328cd661)
