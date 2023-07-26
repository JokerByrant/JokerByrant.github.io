---
title: leetcode刷题记录 - 二叉树的前中后序遍历
tags: leetcode
categories: 算法
abbrlink: 9573
date: 2023-07-26 16:56:58
---
> 树相关的知识点有点多，这里将它拆分开，这是第一篇，学习一下 **二叉树的前中后序遍历**。

<!--more-->

## 二叉树介绍

二叉树按照 **种类** 分为下面几种：

- 满二叉树
- 完全二叉树
- 二叉搜索树
- 平衡二叉搜索树

按照 **存储方式** 分为下面两种：

- 链式存储：通过指针(链表)进行存储
- 顺序存储：通过数组进行存储

**遍历方式** 分为两种：

- 深度优先遍历：先往深走，遇到叶子节点再往回走。
  - 前序遍历
  - 中序遍历
  - 后续遍历
- 广度优先遍历：一层一层的去遍历。
  - 层次遍历

其中 **深度优先遍历** 的三种顺序：前中后序遍历。可以通过区分在遍历中 **中间节点(根节点)** 的位置来分辨，如下：

![截图](attachment:3ef9856caf2bf8747bc88b0fe4ca3a35

在实际的应用中，对二叉树进行遍历时，遍历方式如下：

- 如果进行的是 **深度优先遍历**，一般会使用 **递归** 的方式来处理。而 **栈是递归的一种实现结构**，因此可以使用 **栈** 来实现遍历。
- 如果进行的是 **广度优先遍历**，一般使用 **队列** 来处理。因为需要先进先出的结构，才能一层一层的来遍历二叉树。

二叉树一般在实际应用中都是使用链式存储，相关的定义如下：

```java
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
```

## 前中后序遍历

相关题目：

- 144.二叉树的前序遍历
- 145.二叉树的后序遍历
- 94.二叉树的中序遍历

上面三种遍历在实现方式上的区别就是：**根节点的值在何时被遍历到**。下面我们用三种解法来实现 **二叉树的前中后序遍历**。

### 递归法

关于递归算法的设计，遵循下面三个原则即可：

1. **确定递归函数的参数和返回值**：确定哪些参数是递归的过程中需要处理的，那么就在递归函数里加上这个参数， 并且还要明确每次递归的返回值是什么进而确定递归函数的返回类型。
2. **确定终止条件**：写完了递归算法, 运行的时候，经常会遇到栈溢出的错误，就是没写终止条件或者终止条件写的不对，操作系统也是用一个栈的结构来保存每一层递归的信息，如果递归没有终止，操作系统的内存栈必然就会溢出。
3. **确定单层递归的逻辑**：确定每一层递归需要处理的信息，在这里也就会重复调用自己来实现递归的过程。

首先使用递归来处理上面三种算法。先看前序遍历，代码如下：

```java
public List<Integer> preorderTraversal(TreeNode root) {
    // 使用递归处理
    List<Integer> resultList = new ArrayList<>();
    preorder(root, resultList);
    return resultList;
}

public void preorder(TreeNode cur, List<Integer> resultList) {
    if (cur == null) {
        return;
    }
    // 前序遍历
    resultList.add(cur.val);
    preorder(cur.left, resultList);
    preorder(cur.right, resultList);
}
```

然后是中序遍历：

```java
public List<Integer> inorderTraversal(TreeNode root) {
    // 使用递归处理
    List<Integer> resultList = new ArrayList<>();
    postorder(root, resultList);
    return resultList;
}

public void postorder(TreeNode cur, List<Integer> resultList) {
    if (cur == null) {
        return;
    }
    // 中序遍历
    postorder(cur.left, resultList);
    resultList.add(cur.val);
    postorder(cur.right, resultList);
}
```

后序遍历：

```java
public List<Integer> postorderTraversal(TreeNode root) {
    // 使用递归处理
    List<Integer> resultList = new ArrayList<>();
    postorder(root, resultList);
    return resultList;
}

public void postorder(TreeNode cur, List<Integer> resultList) {
    if (cur == null) {
        return;
    }
    // 后序遍历
    postorder(cur.left, resultList);
    postorder(cur.right, resultList);
    resultList.add(cur.val);
}
```

### 栈

然后尝试使用 **栈** 来处理上面三种算法。我们在处理二叉树的数据时，**先访问的节点是二叉树的顶部节点，即中间节点**。

而 **前序遍历** 对节点的遍历顺序是 **中左右**，先处理的元素也是**中间节点**，**访问节点的顺序与处理节点的顺序是一致的**，因此直接在一个循环中处理即可。

而 **中序遍历** 就不能按照上面的处理了，它先访问的节点也是 **中间节点**，但是开始处理的节点是 **树左边最底部的节点**，**访问节点的顺序和处理节点的顺序不一致**，因此需要额外增加一个指针用来访问节点，栈仍然用来处理节点上的数据。

**后序遍历** 的处理有些特殊，**前序遍历** 处理元素的顺序是 **中左右**，**后序遍历** 处理元素的顺序是 **左右中**，我们只要在 **前序遍历** 代码的基础上，将 **先将右节点入栈** 调整为 **先将左节点入栈**（这时处理元素的顺序是 **中右左**），然后再将拿到的结果 **翻转** 一下，就能拿到按 **左右中** 处理元素的结果了。

前序遍历代码如下：

```java
public List<Integer> preorderTraversal(TreeNode root) {
    // 使用栈处理
    Stack<TreeNode> stack = new Stack<>();
    List<Integer> resultList = new ArrayList<>();
    if (root == null) {
        return resultList;
    }
    stack.push(root);
    while (!stack.empty()) {
        TreeNode node = stack.pop();
        resultList.add(node.val);
        // 前序遍历顺序是：中左右，栈是后进先出，所以这里先将右节点入栈
        if (node.right != null) {
            stack.push(node.right);
        }
        if (node.left != null) {
            stack.push(node.left);
        }
    }
    return resultList;
}
```

中序遍历：

```java
public List<Integer> inorderTraversal(TreeNode root) {
    // 使用栈处理
    Stack<TreeNode> stack = new Stack<>();
    List<Integer> resultList = new ArrayList<>();
    if (root == null) {
        return resultList;
    }
    TreeNode cur = root;
    while (cur != null || !stack.empty()) {
        if (cur != null) {
            // 遍历树的左节点，直到找到左边最底部的节点
            stack.push(cur);
            cur = cur.left; // 左
        } else {
            cur = stack.pop(); // 中
            resultList.add(cur.val);
            cur = cur.right; // 右
        }
    }
    return resultList;
}
```

后续遍历：

```java
public List<Integer> postorderTraversal(TreeNode root) {
    // 使用栈处理
    Stack<TreeNode> stack = new Stack<>();
    List<Integer> resultList = new ArrayList<>();
    if (root == null) {
        return resultList;
    }
    stack.push(root);
    // 这里处理完后，拿到的结果是通过 中右左 顺序遍历二叉树获取的数据
    while (!stack.empty()) {
        TreeNode cur = stack.pop(); // 中
        resultList.add(cur.val);
        if (cur.left != null) {
            stack.push(cur.left); // 左
        }
        if (cur.right != null) {
            stack.push(cur.right); // 右
        }
    }
    // 将结果翻转，拿到的就是按 左右中 顺序遍历二叉树获取的数据
    Collections.reverse(resultList);
    return resultList;
}
```

### 统一迭代法

统一迭代法就是 **前中后序遍历** 使用同一种风格的代码，对其中一种遍历方法的代码内容稍加修改就能变成另一种遍历方法。

上面的两种处理中，递归法其实风格也算统一，而栈处理的三种代码则因为 **无法同时解决访问节点（遍历节点）和处理节点（将元素放进结果集）不一致的情况** 导致代码风格无法统一。因此这里处理的就是栈的解法，处理方法是：**将访问的节点放入栈中，把要处理的节点也放入栈中但是要做标记。标记的方法是要处理的节点放入栈中后，接着放入一个空指针作为标记**。下面看代码

前序遍历：

```java
public List<Integer> preorderTraversal(TreeNode root) {
    // 统一迭代法，前序遍历：中左右
    Stack<TreeNode> stack = new Stack<>();
    List<Integer> resultList = new ArrayList<>();
    if (root == null) {
        return resultList;
    }
    stack.push(root);
    while (!stack.empty()) {
        TreeNode node = stack.peek();
        if (node != null) {
            stack.pop();
            // 右
            if (node.right != null) {
                stack.push(node.right);
            }
            // 左
            if (node.left != null) {
                stack.push(node.left);
            }
            // 中
            stack.push(node);
            stack.push(null);
        } else {
            stack.pop();
            node = stack.pop();
            resultList.add(node.val);
        }
    }
    return resultList;
}
```

中序遍历：

```java
public List<Integer> inorderTraversal(TreeNode root) {
    // 统一迭代法，中序遍历：左中右
    Stack<TreeNode> stack = new Stack<>();
    List<Integer> resultList = new ArrayList<>();
    if (root == null) {
        return resultList;
    }
    stack.push(root);
    while (!stack.empty()) {
        TreeNode node = stack.peek();
        if (node != null) {
            // 目标节点先出栈，之后再放回去，保证顺序
            stack.pop();
            // 入栈顺序：右中左
            if (node.right != null) {
                stack.push(node.right);
            }
            stack.push(node);
            // 中节点后加入一个空节点作为标记，表示这个中节点还没有访问过
            stack.push(null);
            if (node.left != null) {
                stack.push(node.left);
            }
        } else {
            // 遇到了空节点，栈中空节点以及下一个节点出栈，并将其放入结果集
            // 空节点出栈
            stack.pop();
            // 目标节点出栈
            node = stack.pop();
            resultList.add(node.val);
        }
    }
    return resultList;
}
```

后序遍历：

```java
public List<Integer> postorderTraversal(TreeNode root) {
    // 统一迭代法，后序遍历：左右中
    Stack<TreeNode> stack = new Stack<>();
    List<Integer> resultList = new ArrayList<>();
    if (root == null) {
        return resultList;
    }
    stack.push(root);
    while (!stack.empty()) {
        TreeNode node = stack.peek();
        if (node != null) {
            stack.pop();
            // 中
            stack.push(node);
            stack.push(null);
            // 右
            if (node.right != null) {
                stack.push(node.right);
            }
            // 左
            if (node.left != null) {
                stack.push(node.left);
            }
        } else {
            stack.pop();
            node = stack.pop();
            resultList.add(node.val);
        }
    }
    return resultList;
}
```
