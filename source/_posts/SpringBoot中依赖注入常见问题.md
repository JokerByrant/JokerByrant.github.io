---
title: SpringBoot中依赖注入常见问题
tags: SpringBoot
categories: 后端技术
abbrlink: 21887
date: 2023-12-01 14:23:36
---

> 本文参考自：[Spring Bean 依赖注入常见错误](https://learn.lianglianglee.com/%e4%b8%93%e6%a0%8f/Spring%e7%bc%96%e7%a8%8b%e5%b8%b8%e8%a7%81%e9%94%99%e8%af%af50%e4%be%8b/02%20Spring%20Bean%20%e4%be%9d%e8%b5%96%e6%b3%a8%e5%85%a5%e5%b8%b8%e8%a7%81%e9%94%99%e8%af%af%ef%bc%88%e4%b8%8a%ef%bc%89.md)

<!--more-->

## Autowired无法确定装配的Bean 

### 问题复现

下面通过一段代码复现一下这个问题：

```java
public interface ITestService {
    void print();
}
```

```java
@Component
public class ValidManager implements ITestService {
    public void print() {
        System.out.println(this);
    }
}
```

```java
@Component
public class InvalidManager implements ITestService {
    @Override
    public void print() {
        System.out.println(this);
    }
}
```

```java
@RestController
public class TestController {
    @Autowired
    private ITestService testService;

    @RequestMapping(path = "test", method = RequestMethod.GET)
    public void test() {
        System.out.println("==================");
        testService.print();
    }
}
```

在 `TestController` 中，通过 `Autowired` 装配 `ITestService`，但是 `ITestService` 有两个实现类，按照上面的写法，程序就会出现问题，项目无法正常启动。如果使用的是 `IDEA`，那么编辑器会直接给出报错提示：

![17014117061819bcd47f95c1f4ae33220636e80fa76dc.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17014117061819bcd47f95c1f4ae33220636e80fa76dc.png)

### 原因分析

在 `TestController` 中，成员属性 `testService` 被 `Autowired` 注解标记，那么 `Spring` 就会通过 `AutowiredAnnotationBeanPostProcessor` 来完成装配：找出合适的 `ITestService` 的 `Bean` 并设置给 `TestController#testService`。

而上面的问题就是这个装配过程除了问题，我们来对源码进行 `Debug` 看下问题产生的原因，直接看 `DefaultListableBeanFactory#doResolveDependency()`，这是 `Spring` 寻找依赖的具体执行位置：

```java
Map<String, Object> matchingBeans = findAutowireCandidates(beanName, type, descriptor);
```

上面这行代码就是寻找依赖的具体实现，我们看下 `findAutowireCandidates()` 方法的注释：

![1701411726181bd33565ee25cb078fa0853ece24e4186.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1701411726181bd33565ee25cb078fa0853ece24e4186.png)

代入上面的案例，执行该方法后，`matchingBeans` 有两个值：`ValidManager` 和 `InvalidManager`。之后会进入到下面的代码段中：

![17014117361841de13cd749865a650b564da80918ca09.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/17014117361841de13cd749865a650b564da80918ca09.png)

再看下 `DefaultListableBeanFactory#determineAutowireCandidate()` 方法，这个方法是 `Spring` 从多个 `Bean` 中选取合适的 `Bean` 的具体实现：

```java
/**
	 * Determine the autowire candidate in the given set of beans.
	 * <p>Looks for {@code @Primary} and {@code @Priority} (in that order).
	 * @param candidates a Map of candidate names and candidate instances
	 * that match the required type, as returned by {@link #findAutowireCandidates}
	 * @param descriptor the target dependency to match against
	 * @return the name of the autowire candidate, or {@code null} if none found
	 */
	@Nullable
	protected String determineAutowireCandidate(Map<String, Object> candidates, DependencyDescriptor descriptor) {
		Class<?> requiredType = descriptor.getDependencyType();
		// 寻找Primary注解
		String primaryCandidate = determinePrimaryCandidate(candidates, requiredType);
		if (primaryCandidate != null) {
			return primaryCandidate;
		}
		// 寻找Proority注解
		String priorityCandidate = determineHighestPriorityCandidate(candidates, requiredType);
		if (priorityCandidate != null) {
			return priorityCandidate;
		}
		// Fallback
		for (Map.Entry<String, Object> entry : candidates.entrySet()) {
			String candidateName = entry.getKey();
			Object beanInstance = entry.getValue();
			if ((beanInstance != null && this.resolvableDependencies.containsValue(beanInstance)) ||
					// 根据beanName匹配
					matchesBeanName(candidateName, descriptor.getDependencyName())) {
				return candidateName;
			}
		}
		return null;
	}
```

如代码所示，优先级的决策是先根据 `@Primary` 来决策，其次是 `@Priority` 决策，最后是根据 `Bean` 名字的严格匹配来决策。如果这些帮助决策优先级的注解都没有被使用，名字也不精确匹配，则返回 `null`，告知无法决策出哪种最合适。

而上面的案例中，`ValidManager` 和 `InvalidManager` 都没有设置优先级注解，并且 `TestController` 中 `Autowired` 标记的成员属性名 `testService` 也无法匹配是哪个 `Bean`，因此最终会出现报错的情况。

### 解决办法

1. 增加优先级注解。比如给 `ValidManager` 添加一个 `Primary` 注解：
   ```java
   @Component
   @Primary
   public class ValidManager implements ITestService {}
   ```

2. 修改 `TestController` 中 `Autowired` 标记的成员属性名。
   ```java
   @Autowired
   private ITestService validManager;
   ```
   
   比如按上面这种方式修改，最终拿到的 `Bean` 就是 `ValidManager`。
3. 添加 `Qualifier` 注解。
   ```java
   @Autowired
   @Qualifier(value = "validManager")
   private ITestService testService;
   ```
   
   这种处理其实与上面一种是一样的，都是通过指定 `beanName` 来明确具体的 `Bean`
4. 成员属性的类型直接更改为要引入的 `Bean` 对应的类型。
   ```java
   @Autowired
   private ValidManager validManager;
   ```

## 通过beanName引入Bean时的大小写问题

这个问题主要针对上面给出的解决方案中的 `2` 和 `3`，它们的共同点都是通过 `beanName` 装配 `Bean`。

在上面的案例中，我们并没有给 `ValidManager` 指定 `beanName`，但是仍然可以通过这种方式获取，这是因为 `Spring` 在扫描 `Bean` 时就自动为这些 `Bean` 分配了默认的 `beanName`，看下具体实现，代码位置 `ClassPathBeanDefinitionScanner#doScan()`：

```java
String beanName = this.beanNameGenerator.generateBeanName(candidate, this.registry);
```

然后看下 `AnnotationBeanNameGenerator#generateBeanName()` 的具体实现：

```java
public String generateBeanName(BeanDefinition definition, BeanDefinitionRegistry registry) {
	if (definition instanceof AnnotatedBeanDefinition) {
		String beanName = determineBeanNameFromAnnotation((AnnotatedBeanDefinition) definition);
		if (StringUtils.hasText(beanName)) {
			// Explicit bean name found.
			return beanName;
		}
	}
	// Fallback: generate a unique default bean name.
	return buildDefaultBeanName(definition, registry);
}
```

可以看到，`generateBeanName()` 中生成 `beanName` 有两种方式，根据 `Bean` 有没有显式指明名称来确定：如果有则用显式名称，如果没有则产生一个默认名称。而上面的案例中，我们都是没有指定的，因此走的是默认生成 `beanName` 的方式，具体的代码实现见 `AnnotationBeanNameGenerator#buildDefaultBeanName()`：

```java
/**
 * Derive a default bean name from the given bean definition.
 * <p>The default implementation simply builds a decapitalized version
 * of the short class name: e.g. "mypackage.MyJdbcDao" -> "myJdbcDao".
 * <p>Note that inner classes will thus have names of the form
 * "outerClassName.InnerClassName", which because of the period in the
 * name may be an issue if you are autowiring by name.
 * @param definition the bean definition to build a bean name for
 * @return the default bean name (never {@code null})
 */
protected String buildDefaultBeanName(BeanDefinition definition) {
	String beanClassName = definition.getBeanClassName();
	Assert.state(beanClassName != null, "No bean class name set");
	String shortClassName = ClassUtils.getShortName(beanClassName);
	return Introspector.decapitalize(shortClassName);
}
```

具体的实现就是，先获取类名，然后再调用 `Introspector#decapitalize()` 方法。这里要注意一下上面的注释，完整的翻译如下：

> 从给定的bean定义中派生一个默认的bean名称。 默认实现只是构建一个小写版本的短类名：例如"mypackage.MyJdbcDao" -> "myJdbcDao"。 请注意，内部类的名称将以"outerClassName.InnerClassName"的形式存在，如果您按名称进行自动装配，这可能会成为一个问题，因为名称中有一个句点。

这里提到内部类的名称将会以 `outerClassName.InnerClassName` 的形式存在，因此生成的 `beanName` 也会是这个形式。

我们看下获取到类名后，在 `Introspector#decapitalize()` 是如何处理的：

```java
/**
 * Utility method to take a string and convert it to normal Java variable
 * name capitalization.  This normally means converting the first
 * character from upper case to lower case, but in the (unusual) special
 * case when there is more than one character and both the first and
 * second characters are upper case, we leave it alone.
 * <p>
 * Thus "FooBah" becomes "fooBah" and "X" becomes "x", but "URL" stays
 * as "URL".
 *
 * @param  name The string to be decapitalized.
 * @return  The decapitalized version of the string.
 */
public static String decapitalize(String name) {
    if (name == null || name.length() == 0) {
        return name;
    }
    if (name.length() > 1 && Character.isUpperCase(name.charAt(1)) &&
                    Character.isUpperCase(name.charAt(0))){
        return name;
    }
    char chars[] = name.toCharArray();
    chars[0] = Character.toLowerCase(chars[0]);
    return new String(chars);
}
```

看下这个方法的注释，翻译一下：

> 将一个字符串转换为普通的Java变量命名规范的实用方法。通常情况下，这意味着将第一个字符从大写转换为小写，但在（不寻常的）特殊情况下，如果有多个字符并且第一个和第二个字符都是大写，我们保持不变。 因此，"FooBah"变为"fooBah"，"X"变为"x"，但"URL"保持为"URL"。

也就是说，这个方法的具体实现是：**如果传入的字符串是以两个大写字母开头的，则首字母不变，其它情况下默认首字母变成小写。**

到这里我们就可以总结一下 `Spring` 中 `beanName` 的生成规则了：**如果指定了 `beanName`，那么使用这个 `beanName`。如果没有指定 `beanName`，则根据 `Bean` 的类名生成，如果类名的头两个字符都是大写，则首字母不变，其他情况下首字母变为小写；如果是内部类，还需要注意生成的 `beanName` 是 `outerClassName.innerClassName` 这种形式的。**

## 构造器参数隐式注入

这种方式平常开发时使用的并不多，看下代码实现：

```java
@RestController
public class TestController {
    private final ValidManager validManager;

    public TestController(ValidManager validManager) {
        this.validManager = validManager;
    }

    @RequestMapping(path = "test", method = RequestMethod.GET)
    public void test() {
        System.out.println("==================");
        validManager.print();
    }
}
```

上面的代码也可以正常运行，其中 `validManager` 与通过 `Autowired` 装配效果是一样的，其中的原理是：**我们定义一个类为 `Bean`，如果再显式定义了构造器，那么这个 `Bean` 在构建时，会自动根据构造器参数定义寻找对应的 `Bean`，然后反射创建出这个 `Bean`。**

上面案例中，我们显示定义了 `TestController` 的构造器，其中包含一个参数 `ValidManager`，那么 `Spring` 在构建 `TestController` 时，就会去寻找 `ValiadManager` 对应的 `Bean`，然后装配给 `TestController` 的成员属性。

## Value注释注入的值与预期不符

看如下案例，在 `application.yml` 定义了 `username` 属性：

```java
username: sxh
```

然后在 `TestController` 通过 `Value` 注解获取这个值：

```java
@RestController
public class TestController {
    @Value("${username}")
    private String username;

    @RequestMapping(path = "test", method = RequestMethod.GET)
    public void test() {
        System.out.println("==================");
        System.out.println(username);
    }
}
```

最终打印的结果却是如下

![1701411761183b075938e279353532a0ddd036fa0c05f.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1701411761183b075938e279353532a0ddd036fa0c05f.png)

这是因为定义的属性名与系统环境变量冲突了，因此我们在命名这类属性时，需要注意不要与环境变量和系统环境变量冲突。

## 参考文章

[Spring Bean 依赖注入常见错误](https://learn.lianglianglee.com/%e4%b8%93%e6%a0%8f/Spring%e7%bc%96%e7%a8%8b%e5%b8%b8%e8%a7%81%e9%94%99%e8%af%af50%e4%be%8b/02%20Spring%20Bean%20%e4%be%9d%e8%b5%96%e6%b3%a8%e5%85%a5%e5%b8%b8%e8%a7%81%e9%94%99%e8%af%af%ef%bc%88%e4%b8%8a%ef%bc%89.md)

[Spring中@Bean注解和@Configuration、@Component注解组合使用的差异](https://blog.csdn.net/qq_22076345/article/details/104687011)
