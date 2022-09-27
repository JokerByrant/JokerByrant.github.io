---
title: Mybatis源码学习（二） - 缓存
tags:
  - Mybatis
  - 后端技术
categories: 后端技术
abbrlink: 57735
date: 2022-08-19 10:16:22
---

> 注：本文的内容大部分转载自 [聊聊MyBatis缓存机制 - 美团技术团队](https://tech.meituan.com/2018/01/19/mybatis-cache.html) 和 [Mybatis详解 - Java全栈知识体系](https://www.pdai.tech/md/framework/orm-mybatis/mybatis-overview.html)

这篇文章记录我在学习 `Mybaits` 源码的一些记录，包含两部分，这是第二部分，主要是来学习一下 `Mybatis` 中的缓存机制。

<!--more-->


先从一张图看一下一级缓存和二级缓存的工作模式：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245007938da71a49c50b8d377191f37d492cb1db4.png)

详细内容见 [聊聊MyBatis缓存机制 - 美团技术团队](https://tech.meituan.com/2018/01/19/mybatis-cache.html)，这里只选取其中部分内容：

## 一级缓存(本地缓存)

`Mybatis` 中的一级缓存执行过程，一级缓存是在执行多次查询条件完全相同的 `sql` 语句时命中的缓存，可以避免直接对数据库进行查询。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642450219396c9908df8f23092575edef4aedd1d4a5.png)

重复查询命中一级缓存案例

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245029939d37a7d97931396e2ef90e7891d30f208.png)

一级缓存执行时序图如下，从时序图可以看出，`SqlSession` 是向用户提供操作数据库方法的入口，真正与数据库进行交互的则是 `Executor`。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424504094020ff6d15c083a50ee7c974ccfb393750.png)

接着看下 `SqlSession` 是如何初始化的，首先看下 `Mybatis` 的配置文件，这里的配置大概有个印象，在后续进行源码分析时都会讲到：

```xml
<configuration>
  <!--配置文件地址-->
  <properties resource="local-mysql.properties"/>

  <settings>
      <!--一级缓存作用范围, Session: 一次SqlSession中, Statement: 一次查询-->
      <setting name="localCacheScope" value="SESSION"/>
      <!--是否开启二级缓存-->
      <setting name="cacheEnabled" value="true"/>
      <!--开启驼峰式命名，数据库的列名能够映射到去除下划线驼峰命名后的字段名-->
      <setting name="mapUnderscoreToCamelCase" value="true"/>
      <setting name="logImpl" value="LOG4J"/>
  </settings>

  <environments default="development">
      <environment id="development">
          <!--使用默认的JDBC事务管理-->
          <transactionManager type="JDBC"/>
          <!--使用连接池-->
          <dataSource type="POOLED">
              <!--这里会替换为local-mysql.properties中的对应字段的值-->
              <property name="driver" value="${driver}"/>
              <property name="url" value="${url}"/>
              <property name="username" value="${username}"/>
              <property name="password" value="${password}"/>
          </dataSource>
      </environment>
  </environments>

  <!--SQL映射文件,mybatis的核心-->
  <mappers>
      <mapper resource="mapper/studentMapper.xml"/>
      <mapper resource="mapper/classMapper.xml"/>
    </mappers>
</configuration>
```

为执行和数据库的交互，首先需要初始化 `SqlSession`，通过 `DefaultSqlSessionFactory` 开启 `SqlSession`：

```java
@Override
public SqlSession openSession() {
  return openSessionFromDataSource(configuration.getDefaultExecutorType(), null, false);
}

private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
  Transaction tx = null;
  try {
    final Environment environment = configuration.getEnvironment();
    final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
    tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
    // 创建Executor
    final Executor executor = configuration.newExecutor(tx, execType);
    return new DefaultSqlSession(configuration, executor, autoCommit);
  } catch (Exception e) {
    closeTransaction(tx); // may have fetched a connection so lets call close()
    throw ExceptionFactory.wrapException("Error opening session.  Cause: " + e, e);
  } finally {
    ErrorContext.instance().reset();
  }
}
```

`Executor` 创建过程如下：

```java
public Executor newExecutor(Transaction transaction, ExecutorType executorType) {
  executorType = executorType == null ? defaultExecutorType : executorType;
  executorType = executorType == null ? ExecutorType.SIMPLE : executorType;
  Executor executor;
  if (ExecutorType.BATCH == executorType) {
    executor = new BatchExecutor(this, transaction);
  } else if (ExecutorType.REUSE == executorType) {
    executor = new ReuseExecutor(this, transaction);
  } else {
    executor = new SimpleExecutor(this, transaction);
  }
  // 二级缓存相关，如果开启了二级缓存，那么就返回CachingExecutor 
  if (cacheEnabled) {
    executor = new CachingExecutor(executor);
  }
  executor = (Executor) interceptorChain.pluginAll(executor);
  return executor;
}
```

下面通过 `SqlSession` 的 `selectList()` 方法，来看一下 `SqlSession` 和 `Executor` 的执行过程，从 `DefaultSqlSession` 中开始看：

```java
private <E> List<E> selectList(String statement, Object parameter, RowBounds rowBounds, ResultHandler handler) {
  try {
    MappedStatement ms = configuration.getMappedStatement(statement);
    // 调用executor的query方法
    return executor.query(ms, wrapCollection(parameter), rowBounds, handler);
  } catch (Exception e) {
    throw ExceptionFactory.wrapException("Error querying database.  Cause: " + e, e);
  } finally {
    ErrorContext.instance().reset();
  }
}
```

`Executor` 的 `query()` 方法

```java
@Override
public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
  BoundSql boundSql = ms.getBoundSql(parameter);
  // 创建CacheKey
  CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
  // 执行具体的查询逻辑
  return query(ms, parameter, rowBounds, resultHandler, key, boundSql);
}
```

注意其中的 `CacheKey`，这个 `CacheKey` 就是 `Mybatis` 的保存一级缓存时的 `key`，`Mybatis` 根据这个 `key` 来判断 `sql` 语句是否在一级缓存中存在，它重写了 `equals()` 方法。对于两次查询，如果下面的条件完全一样，那么认为它们是完全相同的两次查询：

- 传入的 `statementId` 
- 查询时要求的结果集中的结果范围 （结果的范围通过 `rowBounds.offset` 和 `rowBounds.limit` 表示）。*注：`mybatis` 的分页功能是通过 `rowBounds` 实现的。*
- 这次查询所产生的最终要传递给 `JDBC java.sql.Preparedstatement` 的 `Sql` 语句字符串（`boundSql.getSql()`）
- 传递给 `java.sql.Statement` 要设置的参数值。*与第三点要求联合使用：调用JDBC的时候，传入的SQL语句要完全相同，传递给JDBC的参数值也要完全相同。*

看下 `BaseExecutor.class` 中创建 `CacheKey` 相关的代码：

```java
@Override
public CacheKey createCacheKey(MappedStatement ms, Object parameterObject, RowBounds rowBounds, BoundSql boundSql) {
  if (closed) {
    throw new ExecutorException("Executor was closed.");
  }
  CacheKey cacheKey = new CacheKey();
  // CacheKey初始化后，将下面几个值传入，在`update`中，会将传入的值放进 `updateList` 中，然后重新计算 `hashcode` 值
  // statementId
  cacheKey.update(ms.getId());
  // rowBounds.offset
  cacheKey.update(rowBounds.getOffset());
  // rowBounds.limit
  cacheKey.update(rowBounds.getLimit());
  // SQL语句
  cacheKey.update(boundSql.getSql());
  // 每一个要传递给JDBC的参数值
  List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
  TypeHandlerRegistry typeHandlerRegistry = ms.getConfiguration().getTypeHandlerRegistry();
  // mimic DefaultParameterHandler logic
  for (ParameterMapping parameterMapping : parameterMappings) {
    if (parameterMapping.getMode() != ParameterMode.OUT) {
      Object value;
      String propertyName = parameterMapping.getProperty();
      if (boundSql.hasAdditionalParameter(propertyName)) {
        value = boundSql.getAdditionalParameter(propertyName);
      } else if (parameterObject == null) {
        value = null;
      } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
        value = parameterObject;
      } else {
        MetaObject metaObject = configuration.newMetaObject(parameterObject);
        value = metaObject.getValue(propertyName);
      }
      // 将每一个要传递给JDBC的参数值也更新到CacheKey中
      cacheKey.update(value);
    }
  }
  if (configuration.getEnvironment() != null) {
    // issue #176
    cacheKey.update(configuration.getEnvironment().getId());
  }
  return cacheKey;
}

// hashcode生成算法
public void update(Object object) {
  // 得到对象的hashcode;    
  int baseHashCode = object == null ? 1 : ArrayUtil.hashCode(object);

  count++;
  checksum += baseHashCode;
  // hashCode扩大count倍
  baseHashCode *= count;
  // hashCode * 拓展因子(默认37) + 拓展扩大后的对象hashcode值
  hashcode = multiplier * hashcode + baseHashCode;
  // 将传入的值放进updateList中
  updateList.add(object);
}

@Override
public boolean equals(Object object) {
  if (this == object) {
    return true;
  }
  if (!(object instanceof CacheKey)) {
    return false;
  }

  final CacheKey cacheKey = (CacheKey) object;
  // 比较hashcode
  if (hashcode != cacheKey.hashcode) {
    return false;
  }
  // 比较checksum
  if (checksum != cacheKey.checksum) {
    return false;
  }
  // 比较count
  if (count != cacheKey.count) {
    return false;
  }
  // 比较 `updateList` 中的值是否相等
  for (int i = 0; i < updateList.size(); i++) {
    Object thisObject = updateList.get(i);
    Object thatObject = cacheKey.updateList.get(i);
    if (!ArrayUtil.equals(thisObject, thatObject)) {
      return false;
    }
  }
  return true;
}
```

继续看 `query` 方法，注意最后，如果一级缓存的作用范围是 `Statement`，那么在一次查询结束后，就会清空一级缓存，也就是说一级缓存会失效：

```java
@Override
public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
  ErrorContext.instance().resource(ms.getResource()).activity("executing a query").object(ms.getId());
  if (closed) {
    throw new ExecutorException("Executor was closed.");
  }
  if (queryStack == 0 && ms.isFlushCacheRequired()) {
    clearLocalCache();
  }
  List<E> list;
  try {
    queryStack++;
    // resultHandler默认为null，所以这里会执行从 `localCache` 中获取 `key` 对应的值
    list = resultHandler == null ? (List<E>) localCache.getObject(key) : null;
    if (list != null) {
      // 一级缓存中有数据，直接从缓存中拿数据
      handleLocallyCachedOutputParameters(ms, key, parameter, boundSql);
    } else {
      // 一级缓存中无数据，查询数据库，查询后将结果写入一级缓存 `localCache` 中
      list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
    }
  } finally {
    queryStack--;
  }
  if (queryStack == 0) {
    for (DeferredLoad deferredLoad : deferredLoads) {
      deferredLoad.load();
    }
    // issue #601
    deferredLoads.clear();
    // 如果一级缓存的作用范围是 `StateMenet` 级别的，在一次查询结束，就清空缓存
    if (configuration.getLocalCacheScope() == LocalCacheScope.STATEMENT) {
      // issue #482
      clearLocalCache();
    }
  }
  return list;
}
```

一级缓存只有在执行查询方法才会命中，在执行 `update/insert` 方法时不会命中，看一下代码：

```java
@Override
public int insert(String statement, Object parameter) {
    return update(statement, parameter);
  }
   @Override
  public int delete(String statement) {
    return update(statement, null);
}
```

看下代码，每次执行时，都会执行 `clearLocalCache()` 清空一级缓存：

```java
@Override
public int update(MappedStatement ms, Object parameter) throws SQLException {
  ErrorContext.instance().resource(ms.getResource()).activity("executing an update").object(ms.getId());
  if (closed) {
    throw new ExecutorException("Executor was closed.");
  }
  // 清除一级缓存
  clearLocalCache();
  return doUpdate(ms, parameter);
}
```

下面来总结下关于一级缓存的几个关键点：

- 一级缓存使用 `HashMap` 维护，是一个粗粒度的缓存，没有更新缓存和缓存过期的概念。
- 每个 `SqlSession`  创建时都会持有单独的一级缓存，`SqlSession` 消亡后一级缓存也会被清空，执行 `updat/insert/delete` 操作也会清空一级缓存。

## 二级缓存(全局缓存)

`Mybatis` 的二级缓存有两种配置模式：

- **每个 `Mapper` 单独享有一个 `Cache` 缓存对象。**
  
  `MyBatis` 将 `Application` 级别的二级缓存细分到 `Mapper` 级别，即对于每一个 `Mapper.xml` ,如果在其中使用了`<cache/>` 节点，则 `MyBatis` 会为这个 `Mapper` 创建一个 `Cache` 缓存对象，如下图：
  
  ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642450559617330c3b4531253563ec25cfadbc2dbae.png)

- **多个 `Mapper` 共用一个 `Cache` 缓存对象。**
  
  如果你想让多个 `Mapper` 公用一个 `Cache` 的话，你可以使用 `<cache-ref namespace="">` 节点，来指定你的这个 `Mapper` 使用到了哪一个 `Mapper` 的 `Cache` 缓存。
  
  ![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245063939a4f0e1cb3ce1b9523cf7ac61060f7179.png)

在 `Mapper` 中配置了 `cache` 标签之后，这个 `Mapper` 中的 `Select` 语句就支持二级缓存了。如果想要单独关闭某条语句的二级缓存，可以使用 `useCache` 标签，在对应的语句中配置 `useCache = false`。`useCache` 默认为 `true`，所以除非要关闭，否则不用单独配置。

```xml
<select id="getStudentById" parameterType="int" resultType="entity.StudentEntity" useCache="false">
```

`Mybatis` 内部实现了一系列的 `Cache` 缓存实现类，如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664245074941cdec04662534432e51616c8df6d272ac.png)

它们各自的能力如下：

- `SynchronizedCache`：同步 `Cache`，实现比较简单，直接使用 `synchronized` 修饰方法。
- `LoggingCache`：日志功能，装饰类，用于记录缓存的命中率，如果开启了 `DEBUG` 模式，则会输出命中率日志。
- `SerializedCache`：序列化功能，将值序列化后存到缓存中。该功能用于缓存返回一份实例的 `Copy`，用于保存线程安全。
- `LruCache`：采用了 `Lru` 算法的 `Cache` 实现，移除最近最少使用的 `Key/Value`。
- `PerpetualCache`： 作为为最基础的缓存类，底层实现比较简单，直接使用了`HashMap`。

用户在配置二级缓存时，可以手动指定 `Cache` 的实现类，也可以自定义 `Cache` 实现类，将 `Cache` 实现类配置在 `<cache type="">` 的 `type` 属性上即可。

接着来分析一下源码，在看源码的时候带着一个疑问：**为什么 `select` 之后必须执行 `sqlSession` 的 `close()` 或 `commit()` 方法二级缓存才会生效？**

直接看 `CachingExecutor` 的 `query()` 方法：

```java
@Override
public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql)
    throws SQLException {
  Cache cache = ms.getCache();
  if (cache != null) {
    // 判断是否需要刷新缓存
    flushCacheIfRequired(ms);
    // ms.isUseCache默认开启，通过在sql语句上加useCache=true/false来控制开启关闭
    if (ms.isUseCache() && resultHandler == null) {
      // 处理存储过程
      ensureNoOutParams(ms, boundSql);
      @SuppressWarnings("unchecked")
      // 从tcm中获取缓存的数据
      List<E> list = (List<E>) tcm.getObject(cache, key);
      if (list == null) {
        // 如果缓存数据为空，则从数据库中查询数据
        list = delegate.query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
        // 如果查询到数据，则将数据存入缓存中
        tcm.putObject(cache, key, list); // issue #578 and #116
      }
      return list;
    }
  }
  return delegate.query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
}
```

判断是否需要刷新缓存的方法：`flushCacheIfRequired()`，这个方法只有在 `insert/update` 时才会调用

```java
private void flushCacheIfRequired(MappedStatement ms) {
  Cache cache = ms.getCache();
  if (cache != null && ms.isFlushCacheRequired()) {
    tcm.clear(cache);
  }
}
```

注意这里的 `tcm.clear()` 方法，上面 `query()` 方法中还有 `tcm.getObject()` 和 `tcm.putObject()`，这个 `tcm` 是 `TransactionalCacheManager` 对象的引用，来看下它的代码：

```java
public class TransactionalCacheManager {
  // 保存Cache和用TransactionalCache封装后的Cahce映射关系
  private final Map<Cache, TransactionalCache> transactionalCaches = new HashMap<>();
  // 清除指定的二级缓存数据
  public void clear(Cache cache) {
    getTransactionalCache(cache).clear();
  }
  // 根据缓存对象和sql查询缓存数据
  public Object getObject(Cache cache, CacheKey key) {
    return getTransactionalCache(cache).getObject(key);
  }
  // 添加缓存
  public void putObject(Cache cache, CacheKey key, Object value) {
    getTransactionalCache(cache).putObject(key, value);
  }
  
  public void commit() {
    for (TransactionalCache txCache : transactionalCaches.values()) {
      txCache.commit();
    }
  }

  public void rollback() {
    for (TransactionalCache txCache : transactionalCaches.values()) {
      txCache.rollback();
    }
  }

  private TransactionalCache getTransactionalCache(Cache cache) {
    return MapUtil.computeIfAbsent(transactionalCaches, cache, TransactionalCache::new);
  }
}
```

`TransactionalCacheManager` 中持有一个 `Cache` 和用 `TransactionalCache` 包装后的 `Cache` 的映射关系，`CachingExecutor` 默认就使用 `TransactionalCache` 包装初始生成的 `Cache`，它的作用是** 如果事务提交，对缓存的操作才会生效，如果事务回滚或者不提交事务，则不对缓存产生影响。**

看一下 `TransactionalCache` 的代码：

```java
@Override
public void clear() {
  // 设定提交时清空缓存
  clearOnCommit = true;
  // 清空需要在提交时加入缓存的列表
  entriesToAddOnCommit.clear();
}

@Override
public Object getObject(Object key) {
  // issue #116
  // 从缓存中获取指定key对应的数据
  Object object = delegate.getObject(key);
  if (object == null) {
    // 没查到，把key加入Miss集合，主要为了统计命中率
    entriesMissedInCache.add(key);
  }
  // issue #146
  // 如果设置了提交时清空缓存，这里直接返回null
  if (clearOnCommit) {
    return null;
  } else {
    return object;
  }
}

@Override
public void putObject(Object key, Object object) {
  // 把数据和key放入待提交的Map中
  entriesToAddOnCommit.put(key, object);
}

public void commit() {
  // 调用了clear()之后，clearOnCommit会变为true，具体的缓存清理工作在这里进行
  if (clearOnCommit) {
    delegate.clear();
  }
  // 将待提交的Map刷新到缓存到
  flushPendingEntries();
  // 将参数重新初始化
  reset();
}

private void flushPendingEntries() {
  // 遍历待提交的Map，将数据刷新到缓存中
  for (Map.Entry<Object, Object> entry : entriesToAddOnCommit.entrySet()) {
    delegate.putObject(entry.getKey(), entry.getValue());
  }
  for (Object entry : entriesMissedInCache) {
    if (!entriesToAddOnCommit.containsKey(entry)) {
      delegate.putObject(entry, null);
    }
  }
}

private void reset() {
  clearOnCommit = false;
  entriesToAddOnCommit.clear();
  entriesMissedInCache.clear();
}
```

回到开头提到的问题：**为什么 `select` 之后必须执行 `sqlSession` 的 `close()` 或 `commit()` 方法二级缓存才会生效？** 

首先来看一下 `sqlSession` 中的 `close()` 和 `commit()` 方法的代码：

```java
@Override
public void close() {
  try {
    // 开启了二级缓存，会进入到 `CachingExecutor` 的 `close()`
    executor.close(isCommitOrRollbackRequired(false));
    closeCursors();
    dirty = false;
  } finally {
    ErrorContext.instance().reset();
  }
}

@Override
public void commit(boolean force) {
  try {
    // 开启了二级缓存，会进入到 `CachingExecutor` 的 `commit()`
    executor.commit(isCommitOrRollbackRequired(force));
    dirty = false;
  } catch (Exception e) {
    throw ExceptionFactory.wrapException("Error committing transaction.  Cause: " + e, e);
  } finally {
    ErrorContext.instance().reset();
  }
}
```

开启了二级缓存，会执行 `CachingExecutor` 的 `close()` 和 `commit()` 方法：

```java
@Override
public void commit(boolean required) throws SQLException {
  delegate.commit(required);
  tcm.commit();
}

@Override
public void close(boolean forceRollback) {
  try {
    // issues #499, #524 and #573
    if (forceRollback) {
      tcm.rollback();
    } else {
      tcm.commit();
    }
  } finally {
    delegate.close(forceRollback);
  }
}
```

可以看到，这两个方法都执行了 `tcm.commit()`，在 `tcm.commit()` 中，会执行 `flushPendingEntries()` 方法，`flushPendingEntries()` 会 **将待提交的数据刷新到缓存中**，之后在 `query()` 时，通过 `tcm.getObject()` 才能拿到缓存数据。 

## 参考文章

[Mybatis详解 - Java全栈知识体系](https://www.pdai.tech/md/framework/orm-mybatis/mybatis-overview.html)

[聊聊MyBatis缓存机制 - 美团技术团队](https://tech.meituan.com/2018/01/19/mybatis-cache.html)
