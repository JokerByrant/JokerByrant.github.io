---
title: leetcode刷题记录 - 链表篇
tags: leetcode
categories: 算法
abbrlink: 45798
date: 2023-07-17 11:50:59
---
在跟着 [代码随想录](https://www.programmercarl.com/) 刷链表篇的过程中，发现链表相关的题目绕不开两种解法：

*   虚拟头结点
*   双指针

其中 **虚拟头结点** 主要是在调整链表元素的位置时会用到，使用了这种方式可以省去对头结点单独处理的逻辑。相关题目包括：\[203.移除链表元素]、\[707.设计链表]、\[206.反转链表]、\[24.两两交换链表中的节点]、\[19.删除链表的倒数第N个节点]

**双指针** 则是用在 **寻找链表中指定节点的位置** 相关题目中，比如普通双指针相关的题目：\[160.链表相交]，快慢指针的题目：\[19.删除链表的倒数第N个节点]、\[8.环形链表II]

<!--more-->

### 移除链表元素

相关题目：

*   203.移除链表元素

这题有两种解法，取决于是否需要对头结点进行额外的处理，而两种解法都需要定义一个前置节点 `pre` 和当前节点 `cur`，之后再对节点进行遍历。

第一种解法，对头结点进行额外的处理：

```java
public ListNode removeElements(ListNode head, int val) {
    // 不创建虚拟节点
    // 需要对头结点单独处理
    while (head != null && head.val == val) {
        head = head.next;
    }
    // 如果头结点为null，提前返回
    if (head == null) {
        return head;
    }
    ListNode pre = head;
    ListNode cur = head.next;
    while (cur != null) {
        if (cur.val == val) {
            pre.next = cur.next;
        } else {
            pre = cur;
        }
        cur = cur.next;
    }
    return head;
}
```

第二种解法，创建一个虚拟的头结点，这样头结点可以像普通节点一样处理：

```java
public ListNode removeElements(ListNode head, int val) {
    // 创建一个虚拟头结点
    ListNode tmpHead = new ListNode(0, head);
    ListNode pre = tmpHead;
    ListNode cur = head;
    while (cur != null) {
        if (cur.val == val) {
            pre.next = cur.next;
        } else {
            pre = cur;
        }
        cur = cur.next;
    }
    return tmpHead.next;
}
```

在做了几道关于删除链表元素的题目后，发现虚拟头节点很好用，不用再对头节点的删除进行额外的判断。

### 翻转链表

相关题目：

*   206.反转链表

此题解法如下：

```java
public ListNode reverseList(ListNode head) {
    ListNode pre = null;
    ListNode cur = head;
    ListNode next;
    while (cur != null) {
        next = cur.next;
        // 当前节点指向前一节点
        cur.next = pre;
        // 前一节点后移
        pre = cur;
        // 当前节点后移
        cur = next;
    }
    return pre;
}
```

### 两两交换链表中的节点

相关题目：

*   24.两两交换链表中的节点

代码如下：

```java
public ListNode swapPairs(ListNode head) {
    // 创建一个虚拟的头部节点
    ListNode tmpHead = new ListNode(0, head);
    ListNode pre = tmpHead;
    ListNode cur = head;
    ListNode next;
    while (cur != null && cur.next != null) {
        next = cur.next;
        // 交换
        pre.next = next;
        cur.next = next.next;
        next.next = cur;
        // 指针右移
        pre = cur;
        cur = pre.next;
    }
    return tmpHead.next;
}
```

### 删除链表的倒数第N个节点

相关题目：

*   19.删除链表的倒数第N个节点

代码如下：

```java
public ListNode removeNthFromEnd(ListNode head, int n) {
    // 双指针(快慢指针)
    // 创建一个虚拟头结点
    ListNode tmpHead = new ListNode(0, head);
    ListNode fastNode = tmpHead;
    ListNode slowNode = tmpHead;
    // 快指针移动到第n + 1个节点处，这样慢指针移动的位置就是被删除节点的上一个节点，这样方便进行删除操作
    for (int i = 0; i <= n; i++) {
        fastNode = fastNode.next;
    }
    while (fastNode != null) {
        fastNode = fastNode.next;
        slowNode = slowNode.next;
    }
    // 慢指针指向的是被删除节点的上一个节点
    slowNode.next = slowNode.next.next;
    return tmpHead.next;
}
```

### 链表相交

相关题目：

*   160.链表相交

此题的关键在于求出两个链表长度差值x，然后定义两个指针，分别指向两个链表，其中较长的那个链表的指针指向的位置提前移动差值x，与较短链表的指针对齐，代码如下：

```java
public ListNode getIntersectionNode(ListNode headA, ListNode headB) {
    // 求出链表A和B的长度
    int sizeA = 0;
    ListNode curA = headA;
    while (curA != null) {
        curA = curA.next;
        sizeA++;
    }

    int sizeB = 0;
    ListNode curB = headB;
    while (curB != null) {
        curB = curB.next;
        sizeB++;
    }

    // 算出它们的差值
    int diff = sizeA - sizeB;
    if (diff < 0) {
        diff = -diff;
        // curA 中指向长度较长的链表
        curA = headB;
        curB = headA;
    } else {
        curA = headA;
        curB = headB;
    }

    // 将较长的那个链表的指针移动到差值处
    while (diff-- > 0) {
        curA = curA.next;
    }

    // 开始比较
    while (curA != null) {
        if (curA == curB) {
            return curA;
        }
        curA = curA.next;
        curB = curB.next;
    }
    return null;
}
```

### 环形链表II

相关题目：

*   142.环形链表II

解题关键点都在下面的注释中写出来了，代码如下：

```java
public ListNode detectCycle(ListNode head) {
    // 快慢指针
    ListNode fastNode = head;
    ListNode slowNode = head;
    while (fastNode != null && fastNode.next != null) {
        // 快指针每次走两个节点
        fastNode = fastNode.next.next;
        // 慢指针每次走一个节点
        slowNode = slowNode.next;
        // 快慢指针相遇
        if (fastNode == slowNode) {
            // 根据公式：假设头结点到入口节点距离为x，入口节点到快慢指针相遇节点距离为y，相遇节点到入口节点距离为z。
            // 相遇时：slow指针走的距离为 x + y，fast指针走的距离为 x + y + n * (y + z), n为fast指针在环内走了n圈才遇到slow指针.
            // fast指针一次走两个节点，slow指针一次走一个节点，所以 [slow指针走过的节点数 * 2 = fast指针走过的节点数]，即 2 * (x + y) = x + y + n * (y + z)，简化后公式为：x + y = n * (y + z)
            // 现在要求的是x，进一步简化：x = (n - 1) * (y + z) + z。注意这里n一定是大于等于1的，因为 fast指针至少要多走一圈才能相遇slow指针。
            // 先拿n为1的情况来举例，意味着fast指针在环形里转了一圈之后，就遇到了 slow指针了。
            // 当 n为1的时候，公式就化解为 x = z。这就意味着：从头结点出发一个指针，从相遇节点也出发一个指针，这两个指针每次只走一个节点，那么当这两个指针相遇的时候就是环形入口的节点。
            // 也就是在相遇节点处，定义一个指针index1，在头结点处定一个指针index2。让index1和index2同时移动，每次移动一个节点，那么他们相遇的地方就是环形入口的节点。

            // 从相遇节点出发的指针
            ListNode index1 = fastNode;
            // 从头结点出发的指针
            ListNode index2 = head;
            // 两个指针相遇的地方就是环形入口节点
            while (index1 != index2) {
                index1 = index1.next;
                index2 = index2.next;
            }
            return index2;
        }
    }
    return null;
}
```

