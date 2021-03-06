---
title: Java并发---学习笔记
tags: Java并发
categories: 后端技术
abbrlink: 40693
date: 2020-08-25 11:51:57
---

## 前言
关于 `Java` 并发，之前曾经也学习过一段时间，但是只理解了其中一些简单的概念，学习的很片面，现在就来系统的学习一下这方面的知识。

计算机技术经历了从 **单进程** 到 **多进程** 再到现在的 **多线程** 的发展历程，`Java` 并发的出现就是为了支持现代计算机在 **多线程** 环境下运行程序的特点。

<!--more-->

### 多线程的优点和缺点
关于多线程优点和缺点的介绍可以看看这两篇文章：[多线程的优点](http://ifeve.com/benefits/)，[多线程的代价](http://ifeve.com/costs-of-multithreading/)。

其中在 [多线程的代价](http://ifeve.com/costs-of-multithreading/) 这篇中提到：
> 当CPU从执行一个线程切换到执行另外一个线程的时候，它需要先存储当前线程的本地的数据，程序指针等，然后载入另一个线程的本地数据，程序指针等，最后才开始执行。这种切换称为 **上下文切换** (`context switch`)。`CPU`会在一个上下文中执行一个线程，然后切换到另外一个上下文中执行另外一个线程。上下文切换并不廉价，如果没有必要，应该减少上下文切换的发生。

关于 **上下文切换** 的介绍可以参考这篇文章：[**上下文切换详解**](http://ifeve.com/context-switch-definition/)。这里我把对它的介绍贴出来：
> 上下文是指某一时间点 **`CPU` 寄存器** 和 **程序计数器** 的内容。**寄存器**是 `CPU` 内部的数量较少但是速度很快的内存（与之对应的是 `CPU` 外部相对较慢的 `RAM` 主内存）。**寄存器** 通过对常用值（通常是运算的中间值）的快速访问来提高计算机程序运行的速度。**程序计数器** 是一个专用的寄存器，用于表明指令序列中 `CPU` 正在执行的位置，**存的值为正在执行的指令的位置或者下一个将要被执行的指令的位置**，具体依赖于特定的系统。

### 并发编程模型
原文参考：[并发编程模型](http://ifeve.com/%e5%b9%b6%e5%8f%91%e7%bc%96%e7%a8%8b%e6%a8%a1%e5%9e%8b/)
> 并发系统可以采用多种并发编程模型来实现。并发模型指定了系统中的线程如何通过协作来完成分配给它们的作业。不同的并发模型采用不同的方式拆分作业，同时线程间的协作和交互方式也不相同。

#### 并行工作者模型
![并行工作者模型](https://ae01.alicdn.com/kf/U011338060bb94fe6a0ad232a7e07a9d0h.jpg)
上图就是并行工作者模型，使用这种模型，只需添加更多的工作者就可以提高系统的并行度。

这种模型有三个最明显的缺点：
1. 线程需要处理共享数据带来的 **竞态** 、 **死锁** 等并发性问题，以及在等待访问共享数据时线程的串行化问题。
2. 共享数据的在不同线程中的数据一致性问题
3. 线程的执行顺序是不确定的

上面提到的第一点 **共享数据带来的串行化问题** 有两种办法可以解决：
- 使用非阻塞并发算法
- 使用可持久化的数据结构

重点提一下 **可持久化的数据结构**，在 `Java` 中的 `CopyOnWriteArrayList` 就使用了这种结构，可以阅读一下这篇文章：[可持久化的数据结构](https://www.cnblogs.com/tedzhao/archive/2008/11/12/1332112.html)，文章中拿`.NET Framework`中的`String`类作为例子解释了一下这个结构：
> 一旦创建了一个 `String` 类型实例，它便不能被改变了，对于欲改变其值的任何操作都将被产生一个新的 `String` 对象，通过这样，每一个版本的 `String` 实例都将被驻留下来。这样的具有持久化特点的类型像 `String` 类型都内置了撤销（Undo）功能，当该对象的新一个版本产生的时候，旧版本将被压入栈中，如果需要执行撤销动作的时候，只需将旧版本从堆栈中取出。另外一个优点是由于可持久化数据类型不能更改其内部状态，很容易得知它是线程安全的。


#### 流水线并发模型
![](https://ae01.alicdn.com/kf/Ueaae6349d6ca4721ac036161ce3a83bcs.jpg)
> 类似于工厂中生产线上的工人们那样组织工作者。每个工作者只负责作业中的部分工作。当完成了自己的这部分工作时工作者会将作业转发给下一个工作者。每个工作者在自己的线程中运行，并且不会和其他工作者共享状态。有时也被成为 **无共享并行模型** 。
> 通常使用非阻塞的 `IO` --- `NIO` 来设计使用流水线并发模型的系统。非阻塞的 `IO` 意味着工作者在开始一个 `IO` 操作后，`CPU` 不必在工作者进行 `IO` 操作时进入阻塞状态，而是可以进行其他操作。当 `IO` 操作完成的时候，`IO` 操作的结果（比如读出的数据或者数据写完的状态）被传递给下一个工作者。

解释一下为何要使用 `NIO`。
- `BIO`会阻塞线程的运行，当一个连接在处理 `IO` 操作时，系统是阻塞的，如果是单线程的话必然就挂死在那里。但线程的阻塞不会影响到`CPU`，所以可以开启多线程，这样`CPU`就能处理更多的事情。但是这样就会创建大量的线程，在上文中提到过，线程的切换是有代价的。虽然说现在的多线程一般都使用线程池，可以让线程的创建和回收成本相对较低，但是这也只适用在活动连接数较少的情况，当面对十万甚至百万级连接的时候，传统的 `BIO` 模型是无能为力的。
- 再来看一下 `NIO` ，`NIO` 的读写函数可以立刻返回，它不会因为`IO`操作而被阻塞，因此它不需要像`BIO`一样开启一个新的线程来处理`IO`操作。这很符合流水线并发模型的特点：如果一个连接不能读写（`socket.read()`返回0或者`socket.write()`返回0），我们可以把这件事记下来，记录的方式通常是在`Selector`上注册标记位，然后切换到其它就绪的连接（`channel`）继续进行读写。

## Java是如何解决并发问题的

### 并发问题出现的根源
`Java` 中出现的并发问题可以总结为三种：**可见性**、**原子性**、**有序性**。这些问题出现的根源是计算机体系结构、操作系统、编译程序，为了平衡 `CPU`、内存、`I/O` 设备之间的速度差异，做出了一些调整。

#### 可见性
> 可见性：一个线程对共享变量的修改，另外一个线程能够立刻看到。

`CPU` 增加了缓存，以均衡与内存的速度差异，导致了**可见性**问题。

#### 原子性
> 原子性：即一个操作或者多个操作 要么全部执行并且执行的过程不会被任何因素打断，要么就都不执行。

操作系统增加了进程、线程，以分时复用 CPU，进而均衡 CPU 与 I/O 设备的速度差异，导致了**原子性**问题。

#### 有序性
> 有序性：即程序执行的顺序按照代码的先后顺序执行。

编译程序优化指令执行次序，使得缓存能够得到更加合理地利用，导致了**有序性**问题。
有序性问题主要是因为指令的重排序引起的，重排序分为三种：
- 编译器优化的重排序。编译器在不改变单线程程序语义的前提下，可以重新安排语句的执行顺序。 
- 指令级并行的重排序。现代处理器采用了指令级并行技术（Instruction-Level Parallelism， ILP）来将多条指令重叠执行。如果不存在数据依赖性，处理器可以改变语句对应机器指令的执行顺序。 
- 内存系统的重排序。由于处理器使用缓存和读 / 写缓冲区，这使得加载和存储操作看上去可能是在乱序执行。

## 线程安全的实现方法(理论)
### 互斥同步

### 非阻塞同步

### 无同步方案

## CAS、Unsafe和Atomicxxx
关于`CAS`和`Unsafe`相关的概念不多赘述，参考：[JUC原子类: CAS, Unsafe和原子类详解](https://www.pdai.tech/md/java/thread/java-thread-x-juc-AtomicInteger.html#cas-%e9%97%ae%e9%a2%98)、[美团-Java魔法类：Unsafe应用解析](https://tech.meituan.com/2019/02/14/talk-about-java-magic-class-unsafe.html)

### 总结
* `CAS`全称`Compare And Swap`---比较并交换，是一条`CPU`的原子指令，其作用是让`CPU`进行如下操作：先比较两个值是否相等，然后再原子地将旧值替换为新值。
* `Java`中在`Unsafe.class`中定义了三个`CAS`方法：`compareAndSwapObject`、`compareAndSwapInt`和`compareAndSwapLong`，三个都是`native`方法。`Unsafe.class`主要提供了一些**用于执行低级别、不安全操作的方法，如直接访问系统内存资源、自主管理内存资源等**，基本全部都是`native`方法。
* `Java`中提供的原子类---`Atomicxxx`，主要的实现方法就是调用了`Unsafe.class`的`CAS`方法实现了修改操作的原子性，通过`volatile`实现了待更新参数的可见性。

## AQS
这一块儿主要是同步器相关，是实现锁的关键，可以结合：[从ReentrantLock的实现看AQS的原理及应用-美团技术团队](https://tech.meituan.com/2019/12/05/aqs-theory-and-apply.html) 和 [JUC锁: ReentrantLock详解-Java全栈知识体系](https://www.pdai.tech/md/java/thread/java-thread-x-lock-ReentrantLock.html) 两篇文章一起服用。

下面来看`JUC`包中基于`AQS`实现的一些类。

### CountDownLatch
关于这个的概念和源码参考[JUC工具类: CountDownLatch详解](https://www.pdai.tech/md/java/thread/java-thread-x-juc-tool-countdownlatch.html)。
这个类可以用来替代传统的`notify()`、`wait()`线程模型，上`Demo`(例子来源于上面的链接)：
```java
/**
  * 1. 利用notify()、wait()实现监控List大小
  * notify()唤醒别的线程-不会释放锁，wait()阻塞当前线程-会释放锁。
  * 使用这种方式切换线程会涉及线程的阻塞，当调用notify()-wait()后，线程会阻塞
  */
@Test
public void fun3() {
    LinkedList<Integer> list = new LinkedList<>();
    Object lock = new Object();
    new Thread(() -> {
        synchronized (lock) {
            System.out.println("t2 start");
            if (list.size() != 5) {
                try {
                    // 阻塞当前t2
                    lock.wait();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("t2 end");
            }
            // 唤醒t1
            lock.notify();
        }
    },"t2").start();

    new Thread(() ->{
        synchronized (lock) {
            System.out.println("t1 start");
            for (int i = 1; i <= 10; i++) {
                list.add(i);
                System.out.println("add " + i);
                if (list.size() == 5) {
                    // 唤醒t2
                    lock.notify();
                    try {
                        // 阻塞当前t1
                        lock.wait();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }, "t1").start();
}
```
```java
/**
  * 2. 利用CountDown实现监控List大小
  * 这种方式不会阻塞线程，调用countDown()后，当前线程继续执行
  */
@Test
public void fun2() {
    LinkedList<Integer> list = new LinkedList<>();
    CountDownLatch cdl = new CountDownLatch(1);
    new Thread(() -> {
        System.out.println("t2 start");
        if (list.size() != 5) {
            try {
                // 阻塞当前线程
                cdl.await();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("t2 end");
        }
    },"t2").start();

    new Thread(() ->{
        System.out.println("t1 start");
        for (int i = 1; i <= 10; i++) {
            list.add(i);
            System.out.println("add " + i);
            if (list.size() == 5) {
                System.out.println("execute countDown");
                // 操作唤醒了t2
                cdl.countDown();
            }
        }
    }, "t1").start();

    try {
        Thread.currentThread().join();
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
}
```

## 线程池
结合这篇文章：[Java线程池实现原理及其在美团业务中的实践-美团技术团队](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html)，主要关注以下几点：
* 线程池的几个核心参数 以及 在不同业务场景下参数的配置方法
* 线程池的内部结构设计
* 线程池的生命周期和对其的管理
* 任务执行机制 以及 对Worker线程的管理
* 另外可以看一下这篇文章中关于线程池监控的实现方法

## 参考链接
[Java全栈知识体系](https://www.pdai.tech/md/java/thread/java-thread-x-overview.html)
[并发编程网](http://ifeve.com/java-concurrency-thread-directory/)
