---
title: leetcode刷题记录 - 二叉树篇(二)
tags:
  - leetcode
  - 二叉树
categories: 算法
abbrlink: 22962
date: 2023-07-31 13:26:55
---
> 上一篇学习了二叉树的遍历方式：**前中后序遍历** 和 **层序遍历**。本篇学习一下二叉树其他的一些特性。

<!--more-->

## 翻转二叉树

相关题目：

*   226.翻转二叉树

此题有多种解法，要对二叉树进行翻转，就要首先对二叉树进行遍历，因此使用前一篇提到的几种遍历方式即可。

下面只放上使用 **前序遍历** 和 **层序遍历** 处理的代码，以及 **中序遍历** 的 **迭代法** 解法，因为 **中序遍历** 的 **迭代法** 有些特殊。 而 **统一迭代法** 的 **中后序遍历** 的代码与 **前序遍历** 的代码基本一致，因此这里就不放上来了。

### 前序遍历

递归法，代码如下：

```java
public TreeNode invertTree(TreeNode root) {
    // 使用前序遍历来处理(递归法)
    recurse(root);
    return root;
}

public void recurse(TreeNode node) {
    if (node == null) {
        return;
    }
    TreeNode tmpNode = node.left;
    node.left = node.right;
    node.right = tmpNode;
    recurse(node.left);
    recurse(node.right);
}
```

栈(统一迭代法)：

```java
public TreeNode invertTree(TreeNode root) {
    // 使用前序遍历(直接上统一迭代法)
    if (root == null) {
        return root;
    }
    Stack<TreeNode> stack = new Stack<TreeNode>();
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
            // 弹出空节点
            stack.pop();
            // 弹出目标节点
            node = stack.pop();
            TreeNode tmpNode = node.left;
            node.left = node.right;
            node.right = tmpNode;
        }
    }
    return root;
}
```

### 中序遍历

中序遍历的递归法，常规的 **中序遍历** 最后遍历的是 **右子节点**，而这里在中间对左右节点进行了交换，因此最后仍然需要处理 **左子节点**：

```java
public TreeNode invertTree(TreeNode root) {
    // 使用中序遍历来处理(递归法)
    recurse(root);
    return root;
}

public void recurse(TreeNode node) {
    if (node == null) {
        return;
    }
    recurse(node.left);
    TreeNode tmpNode = node.left;
    node.left = node.right;
    node.right = tmpNode;
    // 注意，使用中序遍历法处理时，这里仍然需要递归左节点，因为上面对左节点进行了交换操作
    recurse(node.left);
}
```

### 层序遍历

层序遍历的 **递归法** 处理似乎不太适合这一题，因为最终解出来与 **前序遍历** 的递归法类似，因此直接使用 **队列法**:

```java
public TreeNode invertTree(TreeNode root) {
    // 使用层序遍历来处理
    if (root == null) {
        return root;
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
                queue.add(node.right);mark

            }
            // 交换每个节点的左右子节点
            TreeNode tmp = node.left;
            node.left = node.right;
            node.right = tmp;
            len--;
        }
    }
    return root;
}
```

## 对称二叉树

相关题目：

*   101.对称二叉树
*   100.相同的树
*   572.另一棵树的子树

以 \[101.对称二叉树] 这题为例，本题对对称二叉树的定义是：**根节点的左右子树是否轴对称**。也就是说，我们要求的是 **根结点的左右子树是否是互相翻转**。

### 递归法

首先按照 **递归法** 来处理，遵循递归法的三步走逻辑：

1.  \*\*确定参数和返回值。\*\*要比较的是左右子树，因此参数是左节点和右节点；返回值是左节点和右节点是否相互翻转。
2.  \*\*确定终止条件。\*\*将左右节点不是相互翻转的条件列出来。
3.  **确定单层递归的逻辑。** 单层递归的逻辑就是，在左右节点都不为空时，它们的外侧节点和内侧节点是否相同，如果相同则返回 `true`。

代码如下：

```java
public boolean isSymmetric(TreeNode root) {
    // 使用后序遍历求解(递归法)
    // 思路：要比较的是根结点的左右子树是否是互相翻转
    return reverse(root.left, root.right);
}

/**
 * 确定参数：比较的是左右节点，因此参数是左节点和右节点
 * 确定返回值：返回值是 [是否相等]
 * @param left
 * @param right
 * @return
 */
public boolean reverse(TreeNode leftNode, TreeNode rightNode) {
    // 确定终止条件
    if (leftNode == null && rightNode != null) {
        return false;
    } else if (leftNode != null && rightNode == null) {
        return false;
    } else if (leftNode == null && rightNode == null) {
        return true;
    } else if (leftNode.val != rightNode.val) {
        return false;
    }
    // 确定单层递归的逻辑
    // 比较外层是否相等(左节点左孩子和右节点右孩子比较)
    boolean outside = reverse(leftNode.left, rightNode.right);
    // 内层是否相等(左节点右孩子和右节点左孩子比较)
    boolean inside = reverse(leftNode.right, rightNode.left);
    return outside && inside;
}
```

### 迭代法

首先使用 **队列** 来求解，虽然用了 **队列**，但是并不是 **层序遍历**，代码如下：

```java
public boolean isSymmetric(TreeNode root) {
    // 使用迭代法求解
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root.left);
    queue.add(root.right);
    while (!queue.isEmpty()) {
        // 确定终止条件
        TreeNode left = queue.poll();
        TreeNode right = queue.poll();
        if (left == null && right == null) {
            continue;
        } else if (left == null || right == null || (left.val != right.val)) {
            return false;
        }
        // 比较外侧
        queue.add(left.left);
        queue.add(right.right);
        // 比较内侧
        queue.add(left.right);
        queue.add(right.left);
    }
    return true;
}
```

***

看下 \[**100.相同的树**] 这题，递归法就不贴了，直接贴迭代法的处理，代码如下：

```java
public boolean isSameTree(TreeNode p, TreeNode q) {
    // 迭代法
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(p);
    queue.add(q);
    while (!queue.isEmpty()) {
        TreeNode left = queue.poll();
        TreeNode right = queue.poll();
        if (left == null && right == null) {
            continue;
        } else if (left == null || right == null || left.val != right.val) {
            return false;
        }
        // 比较左节点
        queue.add(left.left);
        queue.add(right.left);
        // 比较右节点
        queue.add(left.right);
        queue.add(right.right);
    }
    return true;
}
```

再来看下 \[**572.另一棵树的子树**] 这题，解法类似，主要是要确定好需要比较的范围，这次需要判断的情况有如下三种：

*   B树是A树 **从根节点开始的子树**。
*   B树是A树 **左子树的子树**。
*   B树是A树 **右子树的子树**。

递归法的处理如下：

```java
public boolean isSubtree(TreeNode root, TreeNode subRoot) {
    // 递归法处理
    // B如果是A的子树，那它有可能是下面的三种情况：
    // 从根节点开始的子树
    // 左子树的子树
    // 右子树的子树
    if (root == null || subRoot == null) {
        return false;
    }
    return reverse(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}

public boolean reverse(TreeNode left, TreeNode right) {
    if (left == null && right != null) {
        return false;
    } else if (left != null && right == null) {
        return false;
    } else if (left == null && right == null) {
        return true;
    } else if (left.val != right.val) {
        return false;
    }
    boolean leftResult = reverse(left.left, right.left);
    boolean rightResult = reverse(left.right, right.right);
    return leftResult && rightResult;
}
```

再来看下迭代法，使用了 **层序遍历**，相当于加了两层 `for` 循环：**第一层for循环遍历A树，找到与B树跟节点一样值的节点，然后沿着该节点继续遍历，判断B树是否是子树**。代码如下：

```java
public boolean isSubtree(TreeNode root, TreeNode subRoot) {
    // 迭代法
    // 先用层序遍历，找到和subRoot的根节点一样值的节点，然后沿着该节点向后遍历，判断是否是相同的树
    // 相当于使用了两层for循环
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int len = queue.size();
        while (len-- > 0) {
            TreeNode node = queue.poll();
            if (node.val == subRoot.val) {
                boolean result = isSame(node, subRoot);
                if (result) {
                    return result;
                }
            }
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
        }
    }
    return false;
}

// 判断两个树是否相同
public boolean isSame(TreeNode root, TreeNode subRoot) {
    if (root == null && subRoot == null) {
        return true;
    } else if (root == null || subRoot == null) {
        return false;
    }
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    queue.add(subRoot);
    while (!queue.isEmpty()) {
        TreeNode left = queue.poll();
        TreeNode right = queue.poll();
        if (left == null && right == null) {
            continue;
        } else if (left == null || right == null || left.val != right.val) {
            return false;
        }
        queue.add(left.left);
        queue.add(right.left);
        queue.add(left.right);
        queue.add(right.right);
    }
    return true;
}
```

## 完全二叉树的节点个数

相关题目：

*   222.完全二叉树的节点个数

### 普通解法(层序遍历)

先不用管题目中的 **完全二叉树**，将其按照普通的二叉树来处理，直接使用层序遍历即可，代码如下：

```java
public int countNodes(TreeNode root) {
    // 层序遍历
    if (root == null) {
        return 0;
    }
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    int num = 0;
    while (!queue.isEmpty()) {
        int len = queue.size();
        num += len;
        while (len-- > 0) {
            TreeNode node = queue.poll();
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
        }
    }
    return num;
}
```

### 利用完全二叉树的特性(递归)

再来结合题目中给出 **完全二叉树** 的条件来解答，对于一个完全二叉树，它有两种情况：

1.  它是一个满二叉树
2.  它的最后一层叶子节点没有填满

对于 **满二叉树**，我们可以利用公式 \[**`2 ^ depth - 1`**] 来计算它的节点数量，因此利用这个特性，我们可以写出下面的代码：

```java
public int countNodes(TreeNode root) {
    // 利用题目中的 完全二叉树 的定义来解答
    // 完全二叉树有两种情况：是满二叉树，最后一层叶子节点没填满
    // 满二叉树的节点数量计算可以通过公式 [2 ^ depth - 1] 来计算
    // 因此使用递归，分别遍历左右子树，如果是满二叉树，直接利用公式进行计算
    if (root == null) {
        return 0;
    }
    TreeNode left = root.left;
    TreeNode right = root.right;
    int leftDepth = 0, rightDepth = 0;
    // 左子树深度
    while (left != null) {
        left = left.left;
        leftDepth++;
    }
    // 右子树深度
    while (right != null) {
        right = right.right;
        rightDepth++;
    }
    if (leftDepth == rightDepth) {
        // 如果子树是 满二叉树，则可以直接利用 [2 ^ depth - 1] 公式计算树的节点数目
        return (2 << leftDepth) - 1;
    }
    // 左右子树的节点数加上根节点的数量1，就是总的节点数量
    return countNodes(root.left) + countNodes(root.right) + 1;
}
```

## 平衡二叉树

相关题目：

*   110.平衡二叉树

在解答本题前，需要首先需要了解二叉树的 **深度** 和 **高度** 的概念：**二叉树的深度是从根节点开始递增的，根节点的深度是1；高度是从根节点开始递减的，最后的叶子节点的高度是1**。

因此我们求深度时，可以从上到下去查，因此需要用到 **前序遍历** (*使用 **层序遍历** 也可以*)；而求高度时，需要从下到上去查，因此需要用到 **后序遍历**。这里再补充一点，如果要求的是二叉树的 **最大深度**，那么可以转换成求二叉树的高度，因为根节点的高度就是二叉树的最大深度。

回到题目上来，本题的解题思路是求各个节点的树的高度，然后比较左右子树的高度差值是否大于1，如果大于1，那么就返回 `false`。要求的是二叉树的高度，因此需要用到 **后序遍历**。代码如下：

```java
public boolean isBalanced(TreeNode root) {
    // 求二叉树的高度需要使用后序遍历
    return getHeight(root) == -1 ? false : true;
}

public int getHeight(TreeNode node) {
    if (node == null) {
        return 0;
    }
    // 左节点
    int leftHeight = getHeight(node.left);
    if (leftHeight == -1) {
        return -1;
    }
    // 右节点
    int rightHeight = getHeight(node.right);
    if (rightHeight == -1) {
        return -1;
    }
    // 中间节点
    if (Math.abs(leftHeight - rightHeight)  > 1) {
        // 如果子树不是平衡二叉树，返回-1
        return -1;
    } else {
        return 1 + Math.max(leftHeight, rightHeight);
    }
}
```

看完这题，我们再回过头看下 \[**104.二叉树的最大深度**]。现在我们知道求二叉树的深度需要用到 **前序遍历**，因为本题是求 **最大深度**，所以可以转换为求二叉树的高度，所以也可以使用 **后序遍历** 或 **层序遍历** 来处理。之前使用的是 **层序遍历** 来处理的，现在尝试使用 **前序遍历** 来处理一下：

```java
int maxDepth = 0;

public int maxDepth(TreeNode root) {
    // 前序遍历
    if (root != null) {
        getDepth(root, 1);
    }
    return maxDepth;
}

public void getDepth(TreeNode node, int depth) {
    // 中
    maxDepth = maxDepth < depth ? depth : maxDepth;
    // 左
    if (node.left != null) {
        getDepth(node.left, depth + 1);
    }
    // 右
    if (node.right != null) {
        getDepth(node.right, depth + 1);
    }
}
```

## 二叉树的所有路径(回溯算法)

相关题目：

*   257.二叉树的所有路径

此题引入了一种新的算法：**回溯算法**。回溯算法是在递归的基础上做的一些优化，本题中要返回二叉树根节点到叶子结点的所有路径，因此要用到 **前序遍历**，在前序遍历的基础上进行回溯处理，代码如下：

```java
public List<String> binaryTreePaths(TreeNode root) {
    // 前序遍历-回溯算法
    List<String> resList = new ArrayList<>();
    if (root != null)  {
        List<Integer> path = new ArrayList<>();
        getNode(root, path, resList);
    }
    return resList;
}

/**
 * @param node
 * @param path 记录路径，方便回溯
 * @param resList 结果集
 */
public void getNode(TreeNode node, List<Integer> path, List<String> resList) {
    path.add(node.val);
    // 终止条件，找到了叶子结点
    if (node.left == null && node.right == null) {
        // 将记录过的路径打印出来
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < path.size(); i++) {
            sb.append(path.get(i));
            if (i != path.size() - 1) {
                sb.append("->");
            }
        }
        // 放入结果集中
        resList.add(sb.toString());
    }
    if (node.left != null) {
        getNode(node.left, path, resList);
        // 处理完左节点，回溯到原节点上
        path.remove(path.size() - 1);
    }
    if (node.right != null) {
        getNode(node.right, path, resList);
        // 回溯到原节点上
        path.remove(path.size() - 1);
    }
}
```

将上面的递归法改造为迭代法，处理如下：

```java
public List<String> binaryTreePaths(TreeNode root) {
    // 前序遍历 - 迭代法
    List<String> resList = new ArrayList<>();
    if (root != null)  {
        // 节点和路径同时入栈
        Stack<Object> stack  = new Stack<>();
        stack.push(root);
        stack.push(root.val + "");
        while (!stack.empty()) {
            // 节点和路径同时出栈
            String path = stack.pop().toString();
            TreeNode node = (TreeNode) stack.pop();
            // 遇到叶子节点，将结果放入结果集
            if (node.left == null && node.right == null) {
                resList.add(path);
            }
            if (node.right != null) {
                stack.push(node.right);
                stack.push(path + "->" + node.right.val);
            }
            if (node.left != null) {
                stack.push(node.left);
                stack.push(path + "->" + node.left.val);
            }
        }
    }
    return resList;
}
```

