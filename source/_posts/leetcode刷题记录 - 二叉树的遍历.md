---
title: leetcode刷题记录 - 二叉树的遍历
tags: leetcode
categories: 算法
abbrlink: 9573
date: 2023-07-26 16:56:58
---
> 树相关的知识点有点多，这里将它拆分开，这是第一篇。本篇先对二叉树做个简单的介绍，然后着重看一下二叉树的遍历，包括：**前中后序遍历(深度优先遍历)** 和 **层序遍历(广度优先遍历)** 。

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

![16904456772883ef9856caf2bf8747bc88b0fe4ca3a35.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16904456772883ef9856caf2bf8747bc88b0fe4ca3a35.png)

在实际的应用中，对二叉树进行遍历时，遍历方式如下：

- 如果进行的是 **深度优先遍历** ，一般会使用 **递归** 的方式来处理。而 **栈是递归的一种实现结构**，因此可以使用 **栈** 来实现遍历。
- 如果进行的是 **广度优先遍历** ，一般使用 **队列** 来处理。因为需要先进先出的结构，才能一层一层的来遍历二叉树。

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

## 前中后序遍历(深度优先遍历)

相关题目：

- 144.二叉树的前序遍历
- 145.二叉树的后序遍历
- 94.二叉树的中序遍历

上面三种遍历在实现方式上的区别就是：**根节点的值在何时被遍历到** 。下面我们用三种解法来实现 **二叉树的前中后序遍历** 。

### 递归法

关于递归算法的设计，遵循下面三个原则即可：

1. **确定递归函数的参数和返回值** ：确定哪些参数是递归的过程中需要处理的，那么就在递归函数里加上这个参数， 并且还要明确每次递归的返回值是什么进而确定递归函数的返回类型。
2. **确定终止条件** ：写完了递归算法, 运行的时候，经常会遇到栈溢出的错误，就是没写终止条件或者终止条件写的不对，操作系统也是用一个栈的结构来保存每一层递归的信息，如果递归没有终止，操作系统的内存栈必然就会溢出。
3. **确定单层递归的逻辑** ：确定每一层递归需要处理的信息，在这里也就会重复调用自己来实现递归的过程。

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

## 层序遍历(广度优先遍历)

相关题目：

- 102.二叉树的层序遍历
- 107.二叉树的层次遍历II
- 199.二叉树的右视图
- 637.二叉树的层平均值
- 429.N叉树的层序遍历
- 515.在每个树行中找最大值
- 116.填充每个节点的下一个右侧节点指针
- 117.填充每个节点的下一个右侧节点指针II
- 104.二叉树的最大深度
- 111.二叉树的最小深度

**层序遍历** 一个二叉树，就是从左到右一层一层的去遍历二叉树。需要借用 **队列** 来实现，队列先进先出，符合一层一层遍历的逻辑，而用栈先进后出适合模拟深度优先遍历也就是前中后序遍历的逻辑。

而这种层序遍历方式就是图论中的广度优先遍历，只不过我们应用在二叉树上。

层序遍历同样有两种解法：**递归法** 和 **队列法**。先看 **[102.二叉树的层序遍历]** 这题：

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    // 递归法
    List<List<Integer>> resList = new ArrayList<List<Integer>>();
    checkFun(root, 0, resList);
    return resList;
}

public void checkFun(TreeNode node, Integer deep, List<List<Integer>> resList) {
    if (node == null) {
        return;
    }
    // 层级+1
    deep++;
    if (resList.size() < deep) {
        // 当层级增加时，结果集中增加一个新的子集合
        List<Integer> item = new ArrayList<Integer>();
        resList.add(item);
    }
    // 将当前节点的值放入子集合中
    resList.get(deep - 1).add(node.val);
    // 处理左右子节点
    checkFun(node.left, deep, resList);
    checkFun(node.right, deep, resList);
}
```

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    // 队列法
    List<List<Integer>> resList = new ArrayList<List<Integer>>();
    if (root == null) {
        return resList;
    }
    Queue<TreeNode> que = new LinkedList<TreeNode>();
    que.offer(root);
    while (!que.isEmpty()) {
        List<Integer> itemList = new ArrayList<Integer>();
        int len = que.size();
        while (len > 0) {
            // 当前节点出队，并加入结果集
            TreeNode tmpNode = que.poll();
            itemList.add(tmpNode.val);
            // 左右节点入队，后面继续遍历
            if (tmpNode.left != null) {
                que.offer(tmpNode.left);
            }
            if (tmpNode.right != null) {
                que.offer(tmpNode.right);
            }
            // 队列长度-1
            len--;
        }
        resList.add(itemList);
    }
    return resList;
}
```

下面的题目，统一使用队列法来处理，[**107.二叉树的层次遍历II**] ，这题的解法是在 **层序遍历** 的基础上将结果集翻转，代码如下：

```java
public List<List<Integer>> levelOrderBottom(TreeNode root) {
    // 队列法，在 #102 结果的基础上将结果翻转
    List<List<Integer>> resList = new ArrayList<List<Integer>>();
    if (root == null) {
        return resList;
    }
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        List<Integer> tmpList = new ArrayList<>();
        int len = queue.size();
        while (len > 0) {
            TreeNode tmpNode = queue.poll();
            tmpList.add(tmpNode.val);
            if (tmpNode.left != null) {
                queue.add(tmpNode.left);
            }
            if (tmpNode.right != null) {
                queue.add(tmpNode.right);
            }
            len--;
        }
        resList.add(tmpList);
    }
    // 在层序遍历结果的基础上，将结果翻转
    Collections.reverse(resList);
    return resList;
}
```

[**199.二叉树的右视图**]，此题要求返回从右侧能看到的节点值，也就是返回 **每层最后一个节点的值**，代码如下：

```java
public List<Integer> rightSideView(TreeNode root) {
    // 使用队列法
    List<Integer> resList = new ArrayList<>();
    if (root == null) {
        return resList;
    }
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int len = queue.size();
        while (len > 0) {
            TreeNode node = queue.poll();
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
            len--;
            // 将每层最后一个节点放入结果集
            if (len == 0) {
                resList.add(node.val);
            }
        }
    }
    return resList;
}
```

[**637.二叉树的层平均值**]，代码如下：

```java
public List<Double> averageOfLevels(TreeNode root) {
    List<Double> resList = new ArrayList<>();
    if (root == null) {
        return resList;
    }
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        double tmpSum = 0D;
        int len = queue.size();
        int total = len;
        while (len > 0) {
            TreeNode node = queue.poll();
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
            tmpSum += node.val;
            len--;
        }
        resList.add(tmpSum / total);
    }
    return resList;
}
```

[**429.N叉树的层序遍历**]，与二叉树的层序遍历写法一致，区别是左右子节点变成了多个子节点：

```java
public List<List<Integer>> levelOrder(Node root) {
    List<List<Integer>> resList = new ArrayList<>();
    if (root == null) {
        return resList;
    }
    Queue<Node> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        List<Integer> tmpList = new ArrayList<>();
        int len = queue.size();
        while (len > 0) {
            Node node = queue.poll();
            if (node.children != null && node.children.size() > 0) {
                for (Node childNode : node.children) {
                    queue.add(childNode);
                }
            }
            tmpList.add(node.val);
            len--;
        }
        resList.add(tmpList);
    }
    return resList;
}
```

[**515.在每个树行中找最大值**]，代码如下：

```java
public List<Integer> largestValues(TreeNode root) {
    List<Integer> resList = new LinkedList<>();
    if (root == null) {
        return resList;
    }
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int max = Integer.MIN_VALUE;
        int len = queue.size();
        while (len > 0) {
            TreeNode node = queue.poll();
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
            max = Math.max(max, node.val);
            len--;
        }
        resList.add(max);
    }
    return resList;
}
```

[**116.填充每个节点的下一个右侧节点指针**]，代码如下：

```java
public Node connect(Node root) {
    if (root == null) {
        return null;
    }
    Queue<Node> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int len = queue.size();
        while (len > 0) {
            Node node = queue.poll();
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
            len--;
            // 最后一个节点的next节点填充Null
            if (len > 0) {
                node.next = queue.peek();
            } else {
                node.next = null;
            }
        }
    }
    return root;
}
```

[**117.填充每个节点的下一个右侧节点指针II**]，这道题与上一题 [**116.填充每个节点的下一个右侧节点指针**] 的解法一样。代码如下：

```java
public Node connect(Node root) {
    // 与上一题 [116.填充每个节点的下一个右侧节点指针] 解法一样
    if (root == null) {
        return null;
    }
    Queue<Node> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int len = queue.size();
        while (len > 0) {
            Node node = queue.poll();
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
            len--;
            // 最后一个节点的next节点填充Null
            if (len > 0) {
                node.next = queue.peek();
            } else {
                node.next = null;
            }
        }
    }
    return root;
}
```

[**104.二叉树的最大深度**]，只需要使用 **层序遍历** 遍历所有节点，然后深度逐层累加即可，代码如下：

```java
public int maxDepth(TreeNode root) {
    if (root == null) {
        return 0;
    }
    int deep = 0;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int len = queue.size();
        while (len > 0) {
            TreeNode node = queue.poll();
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
            len--;
        }
        deep++;
    }
    return deep;
}
```

[**111.二叉树的最小深度**]，仍然使用层序遍历，在碰到第一个 **没有左右子节点的叶子节点** 时，表明找到了最小深度，最小深度等于 **第一个碰到的叶子节点到根节点的距离**。代码如下：

```java
public int minDepth(TreeNode root) {
    if (root == null) {
        return 0;
    }
    int deep = 0;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int len = queue.size();
        deep++;
        while (len > 0) {
            TreeNode node = queue.poll();
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
            // 左右子节点都为空，表明这是叶子节点，第一个碰到的叶子节点到根节点的距离，即是二叉树的最小深度
            if (node.left == null && node.right == null) {
                return deep;
            }
            len--;
        }
    }
    return deep;
}
```
