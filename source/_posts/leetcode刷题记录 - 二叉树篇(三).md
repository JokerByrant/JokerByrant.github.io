---
title: leetcode刷题记录 - 二叉树篇(三)
tags:
  - leetcode
  - 二叉树
categories: 算法
abbrlink: 51472
date: 2023-08-02 15:25:10
---
> 有关二叉树的题目，最好是能掌握其递归的解法，递归的解法熟练运用后，就能清晰的知道题目的整体逻辑，之后再延伸到迭代的解法。

<!--more-->

## 二叉树的所有路径(回溯算法)

相关题目：

- 257.二叉树的所有路径

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

## 找树左下角的值

相关题目：

- 513.找树左下角的值

直接使用 **层序遍历** 处理即可，**层序遍历每次都从每层的最左侧开始，因此每一层的第一个节点就是最左侧的节点**。代码如下：

```java
public int findBottomLeftValue(TreeNode root) {
    // 层序遍历
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    int result = root.val;
    while (!queue.isEmpty()) {
        int len = queue.size();
        for (int i = 0; i < len; i++) {
            TreeNode node = queue.poll();
            // 层序遍历每次都从每层的最左侧开始，因此每一层的第一个节点就是最左侧的节点
            if (i == 0) {
                result = node.val;
            }
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
        }
    }
    return result;
}
```

再看下 **递归法**，要找最底层最左侧的节点，首先要找到 **深度最大的节点** 的值。接着找到左侧的节点，因为本题不需要处理中间节点，因此只要保证 **遍历时左侧节点在右侧节点前面** 即可，而 **前中后序遍历都是左侧节点优先遍历**，因此三种遍历法都可以。代码如下：

```java
int maxDeep = -1;
int value = 0;

public int findBottomLeftValue(TreeNode root) {
    // 递归法
    // 要找最后一行，那就要先找深度最大的那一行
    recurse(root, 1);
    return value;
}

public void recurse(TreeNode root, int deep) {
    if (root == null) {
        return;
    }
    // 当前节点是叶子节点
    if (root.left == null && root.right == null) {
        // 如果它的深度当前遍历到的节点中的最大深度，那么记录它的值
        if (deep > maxDeep) {
            value = root.val;
            maxDeep = deep;
        }
    }
    // 遍历左节点
    if (root.left != null) {
        // 这里是包含了回溯的
        recurse(root.left, deep + 1);
    }
    // 遍历右节点
    if (root.right != null) {
        recurse(root.right, deep + 1);
    }
}
```

## 路径总和

相关题目：

- 112.路径总和
- 113.路径总和ii

使用递归处理：

```java
int sum = 0;

public boolean hasPathSum(TreeNode root, int targetSum) {
    // 递归 + 回溯
    if (root == null) {
        return false;
    }
    sum += root.val;
    // 当前节点就是叶子节点，如果结果等于目标值，返回true
    if (root.left == null && root.right == null && sum == targetSum) {
        return true;
    }
    // 遍历左子树
    if (root.left != null) {
        boolean result = hasPathSum(root.left, targetSum);
        if (result) {
            return result;
        }
        // 回溯
        sum -= root.left.val;
    }
    // 遍历右子树
    if (root.right != null) {
        boolean result = hasPathSum(root.right, targetSum);
        if (result) {
            return result;
        }
        // 回溯
        sum -= root.right.val;
    }
    return false;
}
```

这里可以再优化一下，无需再定义计数器，直接在 `targetNum` 上进行操作。这样做的好处还有一个：**在处理完左右子节点后，无需再手动回溯了**。因为 **传递到方法中的基本类型参数的值发生变化后，不会影响到父作用域的原参数值**。代码如下：

```java
public boolean hasPathSum(TreeNode root, int targetSum) {
    // 递归 + 回溯
    if (root == null) {
        return false;
    }
    targetSum -= root.val;
    // 当前节点就是叶子节点，如果结果等于目标值，返回true
    if (root.left == null && root.right == null && targetSum == 0) {
        return true;
    }
    // 遍历左子树
    if (root.left != null) {
        boolean result = hasPathSum(root.left, targetSum);
        if (result) {
            return result;
        }
        // 注意，这里无需回溯，因为Java中传递基本类型的参数到方法中，参数在方法中发生变化，这个变化不会同步到父作用域中
    }
    // 遍历右子树
    if (root.right != null) {
        boolean result = hasPathSum(root.right, targetSum);
        if (result) {
            return result;
        }
    }
    return false;
}
```

再来看下 **迭代法** 的处理，与 [**257.二叉树的所有路径**] 代码相似，**定义的栈里一个元素不仅要记录该节点指针，还要记录从头结点到该节点的路径数值总和**。如下：

```java
public boolean hasPathSum(TreeNode root, int targetSum) {
    // 迭代法处理
    if (root == null) {
        return false;
    }
    // 节点和路径同时入栈
    Stack<Object> stack = new Stack<>();
    stack.push(root);
    stack.push(root.val);
    while (!stack.isEmpty()) {
        // 节点和路径同时出栈
        int sum = (int) stack.pop();
        TreeNode node = (TreeNode) stack.pop();
        // 遇到叶子节点，并且路径总和等于目标值，返回true
        if (node.left == null && node.right == null && sum == targetSum) {
            return true;
        }
        if (node.right != null) {
            stack.push(node.right);
            // 这里省略了回溯，因为sum的值并没有变
            stack.push(sum + node.right.val);
        }
        if (node.left != null) {
            stack.push(node.left);
            stack.push(sum + node.left.val);
        }
    }
    return false;
}
```

### 路径总和ii

再来看下 [**113.路径总和ii**] 这题，这题要求返回所有满足条件的路径。

首先看 **迭代法**，在上一题的基础上稍作修改即可，注意，在获取到满足条件的路径时，添加到结果集中的路径集合需要创建一个新的集合，如果仍然使用之前的集合，那之后做回溯时，会造成数据的污染。代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
// 记录路径
List<Integer> tmpList = new ArrayList<>();

public List<List<Integer>> pathSum(TreeNode root, int targetSum) {
    // 递归法
    if (root != null) {
        recurse(root, targetSum);
    }
    return resList;
}

public void recurse(TreeNode node, int targetNum) {
    if (node == null) {
        return;
    }
    tmpList.add(node.val);
    targetNum -= node.val;
    // 找到叶子结点，并且路径的和等于目标值，将路径加入到结果集中
    if (node.left == null && node.right == null && targetNum == 0) {
        // 注意，后面tmpList内的元素仍会发生变化，这会影响结果集中的值，因此这里创建一个新的集合来存放结果
        resList.add(new ArrayList<>(tmpList));
        return;
    }
    if (node.left != null) {
        recurse(node.left, targetNum);
        // 回溯
        tmpList.remove(tmpList.size() - 1);
    }
    if (node.right != null) {
        recurse(node.right, targetNum);
        // 回溯
        tmpList.remove(tmpList.size() - 1);
    }
}
```

再来看下 **迭代法**，`Stack` 中要额外存放一个路径集合数据，并且每次迭代都要创建一个新的集合来处理，这样可以避免集合数据被污染，同时能够避免再手动进行回溯处理。代码如下：

```java
public List<List<Integer>> pathSum(TreeNode root, int targetSum) {
    // 迭代法
    List<List<Integer>> resList = new ArrayList<>();
    if (root != null) {
        // 栈中分别存放节点、路径和、路径集合
        Stack<Object> stack = new Stack<>();
        stack.push(root);
        stack.push(root.val);
        stack.push(new ArrayList<Integer>());
        while (!stack.isEmpty()) {
            // 出栈
            ArrayList<Integer> list = (ArrayList<Integer>) stack.pop();
            int sum = (int) stack.pop();
            TreeNode node = (TreeNode) stack.pop();
            list.add(node.val);
            // 找到了叶子节点，并且结果符合
            if (node.left == null && node.right == null && sum == targetSum) {
                resList.add(list);
            }
            if (node.right != null) {
                stack.push(node.right);
                // 没有对sum值进行改变，无需回溯
                stack.push(sum + node.right.val);
                // 创建一个新的集合，无需回溯
                stack.push(new ArrayList<>(list));
            }
            if (node.left != null) {
                stack.push(node.left);
                stack.push(sum + node.left.val);
                stack.push(new ArrayList<>(list));
            }
        }
    }
    return resList;
}
```

## 从中序与后续遍历序列构造二叉树

相关题目：

- 106.从中序与后续遍历序列构造二叉树
- 105.从前序与中序遍历序列构造二叉树
- 654.最大二叉树

本题的关键是要对数组进行切割，找到切割点，然后根据切割点将数组分成左右数组，代码如下：

```java
public TreeNode buildTree(int[] inorder, int[] postorder) {
    // 中序：左中右；后序：左右中。
    // 思路：以后序数组最后一个元素为切割点，先切割中序数组，然后再切割后序数组
    // 递归法
    // 终止条件
    if (postorder.length == 0) {
        return null;
    }
    // 找到第一个元素，就是后序数组的最后一个元素，构建根节点
    TreeNode root = new TreeNode(postorder[postorder.length - 1]);
    if (postorder.length == 1) {
        return root;
    }

    // 先切割中序数组，切割点是根节点元素在中序数组中的位置
    // 切割中序数组，分成中序左数组和中序右数组，切割点就是根节点，切割后的两个数组就是二叉树根节点的左右两个子树
    int cuttingPoint = 0;
    while (cuttingPoint < inorder.length) {
        if (inorder[cuttingPoint] == root.val) {
            break;
        }
        cuttingPoint++;
    }
    // 切割成中序左数组和中序右数组，切割后的数组左闭右开
    int[] leftInorder = Arrays.copyOfRange(inorder, 0, cuttingPoint);
    // 切割点是树的根节点，无需放入数组
    int[] rightInorder = Arrays.copyOfRange(inorder, cuttingPoint + 1, inorder.length);

    // 切割后序数组，根据切割后的中序数组来切分，左右后序数组和左右中序数组的大小应该是一致的(细品一下)
    int[] leftPostorder = Arrays.copyOfRange(postorder, 0, leftInorder.length);
    // 最后一个元素是树的根节点，无需放入数组
    int[] rightPostorder = Arrays.copyOfRange(postorder, leftInorder.length, postorder.length - 1);

    // 递归处理左右两区间
    root.left = buildTree(leftInorder, leftPostorder);
    root.right = buildTree(rightInorder, rightPostorder);

    return root;
}
```

对上面的代码进行优化，将递归中的数组复制操作替换为索引，代码如下：

```java
public TreeNode buildTree(int[] inorder, int[] postorder) {
    if (inorder.length == 0 || postorder.length == 0) {
        return null;
    }
    return recurse(inorder, 0, inorder.length, postorder, 0, postorder.length);
}

public TreeNode recurse(int[] inorder, int inorderBegin, int inorderEnd, int[] postorder, int postorderBegin, int postorderEnd) {
    if (postorderBegin == postorderEnd) {
        return null;
    }
    // 找到第一个元素，就是后序数组的最后一个元素，构建根节点
    TreeNode root = new TreeNode(postorder[postorderEnd - 1]);
    if (postorder.length == 1) {
        return root;
    }
    // 找切割中序数组的切割点
    int cuttingPoint = 0;
    while (cuttingPoint < inorderEnd) {
        if (inorder[cuttingPoint] == root.val) {
            break;
        }
        cuttingPoint++;
    }

    // 确定切割后的中序和后序数组的范围
    // 中序左数组
    int leftInorderBegin = inorderBegin;
    int leftInorderEnd = cuttingPoint;
    // 中序右数组
    int rightInorderBegin = cuttingPoint + 1;
    int rightInorderEnd = inorderEnd;
    // 后序左数组
    int leftPostorderBegin = postorderBegin;
    int leftPostorderEnd = postorderBegin + (leftInorderEnd - leftInorderBegin);
    // 后序右数组
    int rightPostorderBegin = leftPostorderEnd;
    int rightPostorderEnd = postorderEnd - 1;

    // 递归遍历左右数组
    root.left = recurse(inorder, leftInorderBegin, leftInorderEnd, postorder, leftPostorderBegin, leftPostorderEnd);
    root.right = recurse(inorder, rightInorderBegin, rightInorderEnd, postorder, rightPostorderBegin, rightPostorderEnd);

    return root;
}
```

### 从前序与中序遍历序列构造二叉树

再来看下 [**105.从前序与中序遍历序列构造二叉树**] 这题，与上面的处理类似：

```java
public TreeNode buildTree(int[] preorder, int[] inorder) {
    // 前序：中左右；中序：左中右
    // 按照 #106 的思路，先找切割点，对数组进行切割s
    if (inorder.length == 0 || preorder.length == 0) {
        return null;
    }
    // 确定根节点
    TreeNode root = new TreeNode(preorder[0]);
    // 找切割点
    int cuttingPoint = 0;
    while (cuttingPoint < inorder.length) {
        if (inorder[cuttingPoint] == root.val) {
            break;
        }
        cuttingPoint++;
    }
    // 切割中序数组
    int[] leftInorder = Arrays.copyOfRange(inorder, 0, cuttingPoint);
    int[] rightInorder = Arrays.copyOfRange(inorder, cuttingPoint + 1, inorder.length);
    // 切割前序数组
    int[] leftPreorder = Arrays.copyOfRange(preorder, 1, leftInorder.length + 1);
    int[] rightPreorder = Arrays.copyOfRange(preorder, leftInorder.length + 1, preorder.length);

    // 递归处理
    root.left = buildTree(leftPreorder, leftInorder);
    root.right = buildTree(rightPreorder, rightInorder);

    return root;
}
```

优化一下：

```java
public TreeNode buildTree(int[] preorder, int[] inorder) {
    // 前序：中左右；中序：左中右
    // 按照 #106 的思路，先找切割点，对数组进行切割
    if (inorder.length == 0 || preorder.length == 0) {
        return null;
    }
    return recurse(preorder, 0, preorder.length, inorder, 0, inorder.length);
}

public TreeNode recurse(int[] preorder, int preBegin, int preEnd, int[] inorder, int inBegin, int inEnd) {
    if (preBegin >= preEnd || inBegin >= inEnd) {
        return null;
    }
    // 确定根节点，注意这里要用preBegin
    TreeNode root = new TreeNode(preorder[preBegin]);
    // 前序数组只有一个元素，这个元素就是目标节点
    if (preEnd - preBegin == 1) {
        return root;
    }
    // 找切割点
    int cuttingPoint = 0;
    while (cuttingPoint < inorder.length) {
        if (inorder[cuttingPoint] == root.val) {
            break;
        }
        cuttingPoint++;
    }

    int leftInbegin = inBegin;
    int leftInend = cuttingPoint;
    int rightInbegin = cuttingPoint + 1;
    int rightInend = inEnd;

    int leftPrebegin = preBegin + 1;
    int leftPreend = leftPrebegin + (leftInend - leftInbegin);
    int rightPrebegin = leftPreend;
    int rightPreend = preEnd;

    root.left = recurse(preorder, leftPrebegin, leftPreend, inorder, leftInbegin, leftInend);
    root.right = recurse(preorder, rightPrebegin, rightPreend, inorder, rightInbegin, rightInend);

    return root;
}
```

引申一下：**想要通过两个遍历序列构造一个二叉树，那这个遍历序列中必须要有中序遍历序列。因为通过前后序遍历可以确定根节点的值，而只有中序遍历才能确定根节点左右子树。**所以，想要通过 **前序遍历序列和后序遍历序列** 是无法构造二叉树的。

### 最大二叉树

再来看下 [**654.最大二叉树**] 这题，同样是构造二叉树，与上面两题的处理方式类似：

```java
public TreeNode constructMaximumBinaryTree(int[] nums) {
    if (nums.length == 0) {
        return null;
    }
    if (nums.length == 1) {
        return new TreeNode(nums[0]);
    }
    // 获取最大数
    int maxIndex = 0;
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] > nums[maxIndex]) {
            maxIndex = i;
        }
    }
    TreeNode root = new TreeNode(nums[maxIndex]);
    int[] left = Arrays.copyOfRange(nums, 0, maxIndex);
    int[] right = Arrays.copyOfRange(nums, maxIndex + 1, nums.length);
    root.left = constructMaximumBinaryTree(left);
    root.right = constructMaximumBinaryTree(right);
    return root;
}
```

优化其中的数组拷贝：

```java
public TreeNode constructMaximumBinaryTree(int[] nums) {
    if (nums.length == 0) {
        return null;
    }
    return recurse(nums, 0, nums.length);
}

public TreeNode recurse(int[] nums, int begin, int end) {
    if (begin >= end) {
        return null;
    }
    // 获取最大数
    int maxIndex = begin;
    for (int i = begin; i < end; i++) {
        if (nums[i] > nums[maxIndex]) {
            maxIndex = i;
        }
    }
    TreeNode root = new TreeNode(nums[maxIndex]);
    // 这里的左右子数组都是左闭右开，并且左右子数组要剔除根节点的元素
    root.left = recurse(nums, begin, maxIndex);
    root.right = recurse(nums, maxIndex + 1, end);
    return root;
}
```

使用 **迭代法** 处理也是可以的，代码如下：

```java
public TreeNode mergeTrees(TreeNode root1, TreeNode root2) {
    // 使用迭代法处理(层序遍历)
    if (root1 == null) {
        return root2;
    }
    if (root2 == null) {
        return root1;
    }
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root1);
    queue.add(root2);
    while (!queue.isEmpty()) {
        TreeNode node1 = queue.poll();
        TreeNode node2 = queue.poll();
        // 在root1的基础上进行操作
        node1.val += node2.val;
        if (node1.left != null && node2.left != null) {
            queue.add(node1.left);
            queue.add(node2.left);
        }
        if (node1.right != null && node2.right != null) {
            queue.add(node1.right);
            queue.add(node2.right);
        }
        if (node1.left == null && node2.left != null) {
            node1.left = node2.left;
        }
        if (node1.right == null && node2.right != null) {
            node1.right = node2.right;
        }
    }
    return root1;
}
```
