---
title: 如何优化项目中的SHIT MOUNTAIN
tags: 代码优化
categories: 后端技术
abbrlink: 45353
date: 2020-12-28 16:45:22
---

## 前言
最近经常接到要变更很久之前的功能的需求，盯着自己码的代码，竟是那么的陌生，就像在看一堆Shit Mountain。之前看到一张图很形象
![](https://img04.sogoucdn.com/app/a/100520146/3114d7a1916b7809d13e8719ab99bb97)
优雅的代码应该做到低耦合高内聚，所以学习一下代码的优化技巧还是很有必要的。

<!--more-->

## 软件开发原则---SOLID
`SOLID` 是五个软件开发原则的简称，它们分别是：`单一职责SRP(Single Responsibility Principle)`、`开放封闭原则OCP(Open Closed Principle)`、`里氏替换原则LSP(Liskov Substitution Principle)`、`接口隔离原则ISL(Interface Segregation Principle)`、`依赖倒置原则DIP(Dependency-Inversion Principle)`。
### `单一职责SRP`

### `开放封闭原则OCP`

### `里氏替换原则LSP`

### `接口隔离原则ISL`

### `依赖倒置原则DIP`

## 代码重构
推荐阅读：[《重构 改善既有代码的设计》](http://gdut_yy.gitee.io/doc-refact2/)

下面就说一说我从书中学到的一些技巧。

### 重构的原则
**在不改变软件可观察行为的前提下，对代码的结构进行调整**。
**可观察行为** 是指：经过重构之后的代码所做的事应该与重构之前大致一样，这里的一样是针对用户而言的。因为重构可能会对程序内部的代码结构进行调整，但对于用户而言，代码的功能仍与之前一样。
注意点：
1. 如果对代码的工作原理并不理解，那么就不要进行重构，因为这样很可能会破坏原有的逻辑。
2. 需求的变化使重构变得必要。如果一段代码能正常工作，并且不会再被修改，那么完全可以不去重构它。能改进之当然很好，但若没人需要去理解它，它就不会真正妨碍什么。

### 重构和性能优化
两者很相似，都需要修改代码，并且两者都不会改变程序的整体功能。他们的差别是在于最终目的：
* 重构是为了让代码**"更容易理解，更易于修改"**，这可能使程序运行得更快，也可能使程序运行得更慢。
* 在性能优化时，我只关心让程序运行得更快，最终得到的代码有可能更难理解和维护。

以前我在优化代码时，总是会担心优化后会不会性能变差了，但其实大多数时候我们的优化对性能的影响可以忽略不计。在聪明的编译器、现代的缓存技术面前，我们很多直觉都是不准确的。如果系统对性能的要求不高，那就更不用担心了。但也有例外的时候，可能我们的优化对性能产生了很显著的影响，但正如上面说的：重构是为了让代码**"更容易理解，更易于修改"**。所以保证可读性和易拓展性才是重构首先要考虑的，性能的调优可以在重构之后再进行。

### 两顶帽子
在进行软件开发时，应当让自己适应两种模式：**添加新功能** 和 **重构**。添加新功能时，不应该修改既有代码，只管添加新功能，这样任务的耗时才能被很好的掌握。重构时就不再添加功能，只管调整代码的结构。但当在添加新功能时，发现如果把代码再抽象一下，功能的添加会容易很多，那么这时候就可以换一顶帽子，切换到重构的工作中。但是如果这样的重构操作需要耗费几个小时，那么可以将手头的任务完成之后再进行。

### 重构的目的
总的来说，重构的终极目的就是：**添加功能更快**；**修复Bug更快**。

### 重构的手段
* 消除重复代码。
* 优化函数命名---函数名最好能清晰的指出函数做了什么工作。

### 自动化重构
[自动化重构](http://gdut_yy.gitee.io/doc-refact2/ch2.html#_2-10-%E8%87%AA%E5%8A%A8%E5%8C%96%E9%87%8D%E6%9E%84)
IntelliJ IDEA就支持自动化重构，比如在修改一个文件名时，勾选了对应的选项后，就能发现不只文件名发生了变化，引用了该文件的代码也会相应的发生变化。这是因为IDEA在语法树上实现了代码导航、静态检查等功能，不仅处理了文本，同时也处理了语法树。

### 重构的时机
1. 神秘命名（Mysterious Name）。函数、变量、模块的命名会让人感到疑惑。
2. 重复代码（Duplicated Code）。重复代码不光是指代码完全一致，相似的代码也可算作其中一部分。通过移动语句重组代码的顺序，将相似的部分提炼成单独的函数。
3. 过长函数（Long Function）。以多个小函数取代一个长函数，将函数以功能划分成多个部分，每个部分用一个命名清晰的小函数替代。
4. 过长参数列表（Long Parameter List）。如果一个函数所需参数过多，可以使用**中转数据结构**来替代，这样参数列表可以简洁一些。
5. 发散式变化（Divergent Change）。如果某个模块经常因为不同的原因在不同的方向上发生变化，发散式变化就出现了。当你看着一个类说：“呃，如果新加入一个数据库，我必须修改这 3 个函数；如果新出现一种金融工具，我必须修改这 4 个函数。”这就是发散式变化的征兆。

## 一些优化技巧
* 把复杂的代码块拆分成小的单元，也就是将一个很长的方法按照功能拆分成n个小的方法，这样的主要目的是便于理解。
* 在对相似代码进行重构时，可以使用**中转数据结构**来将公共部分代码抽象出来，使得抽象出的代码可以适应不同的场景。
* 抽象出的代码需要注意**数据的可变状态**，如果不希望数据在公共部分中发生变化，可以传入一个数据的副本进去。

### 剖解临时变量 [#](http://wangvsa.github.io/refactoring-cheat-sheet/composing-methods/#_6)
不要对一个临时变量进行赋值，使用多个临时变量代替，并使用 `final` 修饰。如果一段冗长的代码中，一个临时变量承担了多件事情，那么可能会使代码阅读者疑惑，应该使用多个临时变量代替。**集用临时变量**(负责运算和收集结果) -> `i = i + 1` 和 **循环变量** -> `for(int i = 0; i < 10; i++)` 除外。
*例：(来自《重构》)*
```java
// 优化前
double temp = 2 * (_height + _width);
System.out.println (temp);
temp = _height * _width;
System.out.println (temp);
```
```java
//优化后
final double perimeter = 2 * (_height + _width);
System.out.println (perimeter);
final double area = _height * _width;
System.out.println (area);
```

### 将查询函数和修改函数分离 [#](http://wangvsa.github.io/refactoring-cheat-sheet/making-method-calls-simpler/#_15)
将函数中查询操作和修改操作分离，提炼出两个函数，一个负责查询，一个负责修改。
![](https://img02.sogoucdn.com/app/a/100520146/996608bf705e87cc5c2eb6721cd5ddc8)

### 以查询取代临时变量 [#](http://wangvsa.github.io/refactoring-cheat-sheet/composing-methods/#_8)
*优化前：*
```java
double basePrice = _quantity * _itemPrice;
if (basePrice > 1000)
    return basePrice * 0.95;
else
    return basePrice * 0.98;
```
*优化后：*
```java
if (basePrice() > 1000)
    return basePrice() * 0.95;
else
    return basePrice() * 0.98;
```
```java
double basePrice() {
    return _quantity * _itemPrice;
}
```
优化步骤如下：
1. 首先确保临时变量只进行了一次赋值，使用 `final` 修饰对应的临时变量，这样如果该临时变量发生了多次赋值，编译器会给出对应的提示。
2. 将重复赋值的临时变量使用 **剖解临时变量** 的方式将其分割为多个临时变量。
3. 将 `=` 右侧的部分代码提炼成单独的函数，确保函数不进行任何修改操作，如果有，就对其进行 **将查询函数和修改函数分离** 的操作。
4. 替换使用了临时变量部分的代码。

### 移除参数 [#](http://wangvsa.github.io/refactoring-cheat-sheet/making-method-calls-simpler/#_7)
函数的参数尽可能的减少，这样在后续在复用时就不用为了一个参数该传什么值而绞尽脑汁。如果是多态函数，在进行复用时可以新建一个函数，在函数中进行必要的参数赋值操作，新函数的参数就可以精简了。
![](https://img01.sogoucdn.com/app/a/100520146/c12cda53a521e29460aa69706d712746)

### 移除对参数的赋值 [#](http://wangvsa.github.io/refactoring-cheat-sheet/composing-methods/#_7)
传递进来的参数尽量不要改变其值，如果一定要改变，最好以 `return` 方式返回，这样代码的意图更清晰。如果要返回的值有多个，尝试将大堆数据组装成对象，或者为每一个返回值设计一个对应的独立函数。

### 提炼函数 [#](http://wangvsa.github.io/refactoring-cheat-sheet/composing-methods/)
下面只记录一下 **对局部变量再赋值** 这个问题。
情况描述：在提炼出的函数中，修改了传入的局部变量的值。
> 被赋值的临时变量也分两种情况。较简单的情况是：这个变量只在被提炼码区段中使用。果真如此，你可以将这个临时变量的声明式移到被提炼码中，然后一起提炼出去。另一种情况是：被提炼码之外的代码也使用了这个变量。这又分为两种情况： 如果这个变量在被提炼码之后未再被使用，你只需直接在目标函数中修改它就可以了；如果被提炼码之后的代码还使用了这个变量，你就需要让目标函数返回该变量改变后的值。我以下列代码说明这几种不同情况：
解决：如果传入的局部变量在提炼的函数中值被改变，那么这时应该将其 `return` 出去。如果要返回的变量不只一个，那么可以再次提炼，尽量让一个函数只返回一个值。

### 去除代码中多余的if else
如果是`Spring`项目，可以利用`Spring`的依赖注入结合策略模式来对代码进行优化。参考[Spring优雅的实现策略模式](https://www.jianshu.com/p/5ccf1706297d)。
在 [去除多余的if else](https://www.pdai.tech/md/develop/refactor/dev-refactor-if-else.html) 这篇文章中也提到一些重构技巧。

## 编写单元测试

## 命名参考
[Java命名规范参考](https://zhuanlan.zhihu.com/p/96100037)

## 其他
变量声名在循环体内还是循环体外，这个问题困扰了我很久，我倾向于怎么方便怎么来。可以看看这篇文章的讨论：[变量声明在循环体内还是循环体外的争论，以及怎样才真正叫『避免在循环体中创建对象』](https://www.zhihu.com/question/31751468)

## 参考文章
[10个现代的软件过度设计错误](https://zhuanlan.zhihu.com/p/22166831)
[Refactoring -- Not on the backlog!](https://ronjeffries.com/xprog/articles/refactoring-not-on-the-backlog/)
[Spring优雅的实现策略模式](https://www.jianshu.com/p/5ccf1706297d)
[去除多余的if else](https://www.pdai.tech/md/develop/refactor/dev-refactor-if-else.html)