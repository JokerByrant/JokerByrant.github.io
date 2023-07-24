---
title: Netty的读空闲检测机制
abbrlink: 6356
date: 2023-07-24 13:41:15
tags:
categories:
---
> 这篇文章记录了一次因对 `Netty` 读空闲机制了解不够透彻导致的问题。

最近 `App` 的 `Socket` 连接出现了问题，客户端的 `Socket` 连接已经中断了，但是服务端还保留着与客户端的连接信息，导致转发消息时出现了消息没有送达并且丢失的问题。

定位到问题是 `Netty` 心跳机制导致的问题，服务端代码中设置的是如果 `150s` 没有收到来自客户端的数据时(***服务端是通过 `channelRead()` 方法是否触发来判断的***)，判断客户端读空闲，将客户端的 `Socket` 连接中断。

<!-- more -->

初步猜测是 `Netty` 的读空闲的机制导致的：**设置的读超时 `150s`，实际的触发时间可能会延后**。对源码进行分析：

```java
    private final class ReaderIdleTimeoutTask extends AbstractIdleTask {
        ReaderIdleTimeoutTask(ChannelHandlerContext ctx) {
            super(ctx);
        }

        @Override
        protected void run(ChannelHandlerContext ctx) {
            // 这里的 `readerIdleTimeNanos` 就是我们设置的读超时时间 `150s`
            long nextDelay = readerIdleTimeNanos;
            // `reading` 字段为 `true` 时表示 `channelRead()` 仍在处理中，为 `fasle` 时表示 `channelRead()` 方法处理完毕
            if (!reading) {
                // 计算时间差：读超时时间 `150s` - (当前时间 - 上一次 `channelRead()` 触发时间)
                nextDelay -= ticksInNanos() - lastReadTime;
            }

            // 如果时间差小于0，表示上一次 `channelRead()` 触发时间已经超过了 `150s`
            if (nextDelay <= 0) {
                // 重置定时任务，触发事件设置为 `150s`
                // Reader is idle - set a new timeout and notify the callback.
                readerIdleTimeout = schedule(ctx, this, readerIdleTimeNanos, TimeUnit.NANOSECONDS);

                boolean first = firstReaderIdleEvent;
                firstReaderIdleEvent = false;

                try {
                    IdleStateEvent event = newIdleStateEvent(IdleState.READER_IDLE, first);
                    // `channelIdle` 实际调用的是 `ctx.fireUserEventTriggered(evt)`，触发下一个 `handler` 的 `UserEventTriggered` 方法，也就是在这里执行了关闭客户端 `Socket` 连接的操作
                    channelIdle(ctx, event);
                } catch (Throwable t) {
                    ctx.fireExceptionCaught(t);
                }
            } else {
                // 如果时间差大于0，表示上一次 `channelRead()` 触发时间在 `150s` 以内，没有超时
                // 重置定时任务，将下一次读空闲检测任务的触发事间设置为 `nextDelay`，这个 `nextDelay` 的值可能在 `1 ~ 150` 之间
                // Read occurred before the timeout - set a new timeout with shorter delay.
                readerIdleTimeout = schedule(ctx, this, nextDelay, TimeUnit.NANOSECONDS);
            }
        }
    }
```

注意上面的 `lastReadTime`，这个参数会在每次 `channelRead()` 结束后更新，代码如下：

```java
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        if ((readerIdleTimeNanos > 0 || allIdleTimeNanos > 0) && reading) {
            // 更新 `lastReadTime`
            lastReadTime = ticksInNanos();
            reading = false;
        }
        ctx.fireChannelReadComplete();
    }
```

根据上面的分析，给出如下案例(***模拟 `IOS` 丢数据时的操作***)：客户端A连接 `Socket`，服务端在 `00:00:00` 触发读空闲检测， `1s` 后A发送了一个心跳给服务端，之后A没有给服务端发送过报文，由上面的分析可知，`149s` 后服务端会再次触发读空闲检测，这时计算 `150 - (当前时间 - lastReadTime) = 1`，没有超时，之后设置 `1s` 后再次进行读空闲检测，`1s` 后检测到超时，触发断开 `Socket` 连接的操作。

> 总结：分析后可知，`Netty` 的读空闲检测并没有问题，`150s` 的超时会准确的触发。

### 问题原因

在测试时发现，有时会出现读空闲的定时任务没有触发的情况，比如设置了 `readerIdleTimeout = schedule(ctx, this, nextDelay, TimeUnit.NANOSECONDS)` 在 `23s` 后触发，但实际上并没有触发，这导致读空闲机制不会触发，对应的客户端 `Socket` 不会被中断。继续对代码进行分析，在 `IdleStateHandlet.java` 中发现了如下方法：

```java
    private void destroy() {
        state = 2;

        if (readerIdleTimeout != null) {
            readerIdleTimeout.cancel(false);
            readerIdleTimeout = null;
        }
        if (writerIdleTimeout != null) {
            writerIdleTimeout.cancel(false);
            writerIdleTimeout = null;
        }
        if (allIdleTimeout != null) {
            allIdleTimeout.cancel(false);
            allIdleTimeout = null;
        }
    }
```

上面的方法会将读空闲的定时任务取消，它的调用位置有两处：

```java
    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        destroy();
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        destroy();
        super.channelInactive(ctx);
    }
```

对代码进行 `Debug`，发现在 `IOS` 将 手机熄屏一段时间后(***大约 `10s`***)，就会触发 `channelInactive()` 方法，之后就会将读空闲定时任务取消。

### 解决办法

在心跳处理类 `HeartBeatServerHandler` 中增加代码，当触发 `handlerRemoved()` 方法后(***在 `channelInactive()` 后触发***)，将对应的客户端 `Socket` 连接移除:

```java
    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        super.handlerRemoved(ctx);
        LocalSession session = ctx.channel().attr(LocalSession.SESSION_KEY).get();
        if (null != session && session.isValid()) {
            log.error("触发 handlerRemoved() 方法，关闭连接: {}", ctx.channel().attr(LocalSession.CHANNEL_NAME).get());
            SessionManager.inst().closeSession(ctx, 0);
        }
    }
```

### 测试结果

测试通过，暂时没有发现别的问题。
