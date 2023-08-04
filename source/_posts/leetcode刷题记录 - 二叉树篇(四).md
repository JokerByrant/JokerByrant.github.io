---
title: leetcode刷题记录 - 二叉树篇(四)
tags:
  - leetcode
  - 二叉树
categories: 算法
abbrlink: 24556
date: 2023-08-04 15:27:27
---
> 这是二叉树系列的最后一篇，上一篇看了二叉树 **回溯算法** 和 **二叉树的构造** 相关的题目，本篇要着重看一下 **二叉搜索树** 以及 **最近公共祖先** 相关的题目。

<!--more-->

## 二叉搜索树中的搜索

相关题目：

- 700.二叉搜索树中的搜索

在不了解 **二叉搜索树** 特性前，我们也可以解这道题，就是类似在数组中找等于目标值的元素下标，直接对其进行遍历一遍，然后分别比较即可，使用 **层序遍历**：

```java
public TreeNode searchBST(TreeNode root, int val) {
    if (root == null) {
        return null;
    }
    // 层序遍历处理
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int len = queue.size();
        while (len-- > 0) {
            TreeNode node = queue.poll();
            if (node.val == val) {
                return node;
            }
            if (node.left != null) {
                queue.add(node.left);
            }
            if (node.right != null) {
                queue.add(node.right);
            }
        }
    }
    return null;
}
```

再看一下利用 **二叉搜索树** 的特性来处理，二叉搜索树每个节点的左子树的值都小于节点的值，右子树的值都大于节点的值。先用 **递归法** 来解下，代码如下：

```java
public TreeNode searchBST(TreeNode root, int val) {
    // 二叉搜索树特性，节点左子树的值都小于节点的值，右子树的值都大于节点的值
    if (root == null) {
        return null;
    }
    if (val == root.val) {
        return root;
    } else if (val > root.val) {
        // 目标值比节点值大，搜索右子树
        return searchBST(root.right, val);
    } else {
        // 目标值比节点值小，搜索左子树
        return searchBST(root.left, val);
    }
}
```

同样的，**迭代法** 也能处理。对于普通二叉树，递归过程中还有回溯的过程，例如走一个左方向的分支走到头了，那么要调头，在走右分支。而 **对于二叉搜索树，不需要回溯的过程，因为节点的有序性就帮我们确定了搜索的方向**。代码如下：

```java
public TreeNode searchBST(TreeNode root, int val) {
    // 二叉搜索树特性，节点左子树的值都小于节点的值，右子树的值都大于节点的值
    while (root != null) {
        if (root.val == val) {
            return root;
        } else if (val > root.val) {
            root = root.right;
        } else {
            root = root.left;
        }
    }
    return null;
}
```

## 验证二叉搜索树

相关题目：

- 98.验证二叉搜索树

二叉搜索树是有序，此题我们需要借助它的一个特性：**中序遍历时，输出的二叉搜索树节点数值是有序序列(递增序列)**。

按照这个特性，先来看第一种解法，先拿到遍历结果，放入数组/集合中，然后看遍历序列是否是递增序列，代码如下：

```java
public boolean isValidBST(TreeNode root) {
    // 中序遍历时，输出的二叉搜索树节点数值是有序序列(递增序列)
    List<Integer> resList = new ArrayList<>();
    getResult(root, resList);
    // 中序遍历结果是有序递增序列，所以直接判断是否满足
    for (int i = 1; i < resList.size(); i++) {
        if (resList.get(i) <= resList.get(i - 1)) {
            return false;
        }
    }
    return true;
}

public void getResult(TreeNode node, List<Integer> resList) {
    if (node == null) {
        return;
    }
    getResult(node.left, resList);
    resList.add(node.val);
    getResult(node.right, resList);
}
```

上面代码是先遍历了所有的节点，然后再进行的比较。可以优化一下，直接在遍历时比较节点的值即可。这里的比较方法是，使用了一个变量记录上一个节点：**如果满足条件，上一个节点的值肯定比当前节点的值要小**。使用 **递归法** 处理如下：

```java
TreeNode lastNode;
public boolean isValidBST(TreeNode root) {
    // 中序遍历时，输出的二叉搜索树节点数值是有序序列(递增序列)
    if (root == null) {
        return true;
    }
    // 左
    if (!isValidBST(root.left)) {
        return false;
    }
    // 中
    if (lastNode != null && lastNode.val >= root.val) {
        return false;
    }
    lastNode = root;
    // 右
    return isValidBST(root.right);
}
```

再来看下 **迭代法** 的处理：

```java
public boolean isValidBST(TreeNode root) {
    // 中序遍历时，输出的二叉搜索树节点数值是有序序列(递增序列)
    Stack<TreeNode> stack = new Stack<TreeNode>();
    stack.push(root);
    TreeNode pre = null;
    while (!stack.isEmpty()) {
        TreeNode node = stack.peek();
        if (node != null) {
            stack.pop();
            // 右中左
            if (node.right != null) {
                stack.push(node.right);
            }
            // 统一迭代法，中节点入栈后需要再入栈一个空节点
            stack.push(node);
            stack.push(null);
            if (node.left != null) {
                stack.push(node.left);
            }
        } else {
            // 空节点先出栈，之后目标节点再出栈
            stack.pop();
            node = stack.pop();
            if (pre != null && node.val <= pre.val) {
                return false;
            }
            pre = node;
        }
    }
    return true;
}
```

## 二叉搜索树的最小绝对差

相关题目：

- 530.二叉搜索树的最小绝对差

先看最常规的解法，先用获取树的中序遍历序列，然后在遍历这个序列，寻找结果，代码如下：

```java
public int getMinimumDifference(TreeNode root) {
    List<Integer> resList = new ArrayList<>();
    getResult(root, resList);
    int min = Integer.MAX_VALUE;
    for (int i = 1; i < resList.size(); i++) {
        min = Math.min(min, resList.get(i) - resList.get(i - 1));
    }
    return min;
}

public void getResult(TreeNode node, List<Integer> resList) {
    if (node == null) {
        return;
    }
    getResult(node.left, resList);
    resList.add(node.val);
    getResult(node.right, resList);
}
```

优化一下，一边遍历一遍寻找：

```java
TreeNode pre;
int min = Integer.MAX_VALUE;

public int getMinimumDifference(TreeNode root) {
    if (root == null) {
        return min;
    }
    // 左
    getMinimumDifference(root.left);
    // 中
    if (pre != null) {
        min = Math.min(min, root.val - pre.val);
    }
    pre = root;
    // 右
    getMinimumDifference(root.right);
    return min;
}
```

然后是 **迭代法**：

```java
public int getMinimumDifference(TreeNode root) {
    // 迭代法
    Stack<TreeNode> stack = new Stack<TreeNode>();
    stack.push(root);
    TreeNode pre = null;
    int min = Integer.MAX_VALUE;
    while (!stack.isEmpty()) {
        TreeNode node = stack.peek();
        if (node != null) {
            stack.pop();
            if (node.right != null) {
                stack.push(node.right);
            }
            stack.push(node);
            stack.push(null);
            if (node.left != null) {
                stack.push(node.left);
            }
        } else {
            stack.pop();
            node = stack.pop();
            if (pre != null) {
                min = Math.min(min, node.val - pre.val);
            }
            pre = node;
        }
    }
    return min;
}
```

## 二叉搜索树中的众数

相关题目：

- 501.二叉搜索树中的众数

利用二叉搜索树的特性，需要定义三个参数：元素出现的最大频率，当前节点的元素出现的频率，前一个节点。之后比较关键的点就是理清当前节点出现频率的变化场景即可，代码如下：

```java
int maxCount = Integer.MIN_VALUE;
int count = 0;
TreeNode pre;

public int[] findMode(TreeNode root) {
    List<Integer> resList = new ArrayList<>();
    getResult(root, resList);
    int[] arr = new int[resList.size()];
    for (int i = 0; i < resList.size(); i++) {
        arr[i] = resList.get(i);
    }
    return arr;
}

public void getResult(TreeNode node, List<Integer> resList) {
    if (node == null) {
        return;
    }
    // 左
    getResult(node.left, resList);
    // 中
    if (pre == null) {
        // 前一个节点为空，说明当前是根节点
        count = 1;
    } else if (pre.val == node.val) {
        // 当前节点的值与前一个节点相同，计数器+1
        count++;
    } else {
        // 当前节点的值与前一个节点不同，重置计数器
        count = 1;
    }
    pre = node;

    // 开始比较计数器
    if (count == maxCount) {
        resList.add(node.val);
    }
    // 当前节点的出现频率最大
    if (count > maxCount) {
        // 清空结果集
        resList.clear();
        resList.add(node.val);
        maxCount = count;
    }
    // 右
    getResult(node.right, resList);
}
```

**迭代法** 处理如下：

```java
int maxCount = Integer.MIN_VALUE;
int count = 0;
TreeNode pre;

public int[] findMode(TreeNode root) {
    // 使用迭代法处理
    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);
    int maxCount = Integer.MIN_VALUE;
    int count = 0;
    TreeNode pre = null;
    List<Integer> resList = new ArrayList<>();
    while (!stack.isEmpty()) {
        TreeNode node = stack.peek();
        if (node != null) {
            stack.pop();
            if (node.right != null) {
                stack.push(node.right);
            }
            stack.push(node);
            stack.push(null);
            if (node.left != null) {
                stack.push(node.left);
            }
        } else {
            stack.pop();
            node = stack.pop();
            if (pre == null) {
                count = 1;
            } else if (pre.val == node.val) {
                count++;
            } else {
                count = 1;
            }
            if (count == maxCount) {
                resList.add(node.val);
            }
            if (count > maxCount) {
                resList.clear();
                maxCount = count;
                resList.add(node.val);
            }
            pre = node;
        }
    }
    int[] arr = new int[resList.size()];
    for (int i = 0; i < resList.size(); i++) {
        arr[i] = resList.get(i);
    }
    return arr;
}
```

>  二叉搜索树相关的题目，只要解出了 **递归法**，那 **迭代法** 就是手到擒来。

再来看下这题的常规解法， 如果题目中没有给明是 **二叉搜索树**，也能用这种方法处理。这种方法就麻烦在最后对获取到的频率数据进行排序的操作上，代码如下：

```java
public int[] findMode(TreeNode root) {
    Map<Integer, Integer> map = new HashMap<>();
    List<Integer> list = new ArrayList<>();
    if (root == null) return list.stream().mapToInt(Integer::intValue).toArray();
    // 获得频率 Map
    searchBST(root, map);
    List<Map.Entry<Integer, Integer>> mapList = map.entrySet().stream()
            .sorted((c1, c2) -> c2.getValue().compareTo(c1.getValue()))
            .collect(Collectors.toList());
    list.add(mapList.get(0).getKey());
    // 把频率最高的加入 list
    for (int i = 1; i < mapList.size(); i++) {
        if (mapList.get(i).getValue() == mapList.get(i - 1).getValue()) {
            list.add(mapList.get(i).getKey());
        } else {
            break;
        }
    }
    return list.stream().mapToInt(Integer::intValue).toArray();
}

void searchBST(TreeNode curr, Map<Integer, Integer> map) {
  if (curr == null) return;
  map.put(curr.val, map.getOrDefault(curr.val, 0) + 1);
  searchBST(curr.left, map);
  searchBST(curr.right, map);
}
```

## 二叉树的最近公共祖先

相关题目：

- 236.二叉树的最近公共祖先

此题要根据子节点找父节点，需要从树的底部开始处理，因此使用 **后序遍历**。使用 **递归法** 处理，其中关键的处理逻辑是要：

1. **明确递归函数的返回值**。返回值是两个条件节点 `p` 和 `q` 在二叉树中的公共祖先，这棵树的根节点是 `root`。
2. **明确终止条件。**如果找到了公共祖先，或者 `root` 为 `null`，那么就返回。***注：`root` 为 `null` 也是一种找到公共祖先的情况，此时的情况是 `p` 和 `q` 在树中不存在。***
3. **确定单层递归的逻辑。**
   
   如果遍历到当前节点为空，表示此时是个空树，则返回 `null`。
   
   如果当前节点等于 `p` 或 `q` ，那么返回当前节点，因为：(*假设当前节点是 `p`*)
   1. 如果当前节点的子树中有 `q`，那么 `p` 肯定是最近公共祖先，返回 `p`；
   2. 如果当前节点的子树中没有 `q`，那么 `p` 也是公共祖先，因为题目中给出了定义：**一个节点也可以是它自己的公共祖先**。
   
   如果上面的情况都没满足，则 `p` 或 `q` 要么在子树中，要么不在子树中，对当前节点的左右子节点调用函数：***注：上面提到函数的返回值是 `p` 、`q` 在树中的公共祖先***
   1. 如果左右子树返回值都为空，表示此时 `p` 和 `q` 不在左右子树中，返回 `null`，**返回值 `null` 也是一种找到公共祖先的情况**。
   2. 如果左右子树返回值都不为空，那么表示 `p` 和 `q` 分别位列左右子树中，那么此时当前节点就是 `p` 和 `q` 的公共祖先，返回当前节点。
   3. 如果左子树返回值不为空，右子树返回值为空，那么表示 `p` 和 `q` 的公共祖在左子树中，左子树的返回值就是这个公共祖先对应的节点。
   4. 如果右子树返回值不为空，左子树返回值为空，那么表示 `p` 和 `q` 的公共祖在右子树中，右子树的返回值就是这个公共祖先对应的节点。

此处的逻辑梳理是通过下面这篇文章理顺的：[【最近公共祖先】通过延伸定义，让你捋清递归思路](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/solutions/369490/zui-jin-gong-gong-zu-xian-tong-guo-yan-shen-ding-y/)。其他的题解中对于 `root == null || root == p || root == q` 这处逻辑梳理的并不是很清晰。

具体的代码如下：

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    // 要根据子节点找父节点，需要从树的底部开始处理，因此使用后序遍历
    if (root == null || root == p || root == q) {
        return root;
    }
    // 左
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    // 右
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    // 中
    if (left != null && right != null) {
        // 左右节点都找到了，说明当前节点就是最近公共祖先
        // 因为使用的是后序遍历：从底向上遍历。所以最先找到的那个符合条件的节点就是目标节点。
        return root;
    } else if (left == null && right != null) {
        // 左节点为空，右节点不为空，那么此时最近公共节点肯定在右子树上，把这个结果返回即可
        return right;
    } else if (left != null && right == null) {
        // 反之亦然
        return left;
    }
    return null;
}
```

## 二叉搜索树的最近公共祖先

相关题目：

- 235.二叉搜索树的最近公共祖先

利用二叉搜素树的特性：**节点左子树上节点的值都小于当前节点的值，右子树上节点的值都大于当前节点的值**。因此可以得出结论：**如果中间节点是 `p` 和 `q` 的公共祖先，那么中间节点的值一定在 [p, q] 区间内，并且从根节点向下遍历的过程中，碰到的第一个满足条件的节点一定是它们的最近公共祖先。**具体可以参考 [代码随想录](https://www.programmercarl.com/0235.%E4%BA%8C%E5%8F%89%E6%90%9C%E7%B4%A2%E6%A0%91%E7%9A%84%E6%9C%80%E8%BF%91%E5%85%AC%E5%85%B1%E7%A5%96%E5%85%88.html#%E6%80%9D%E8%B7%AF) 里面的这张图，更好理解

![1691133849681aa796de1f52695ab9f218cb93a7ccaef.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1691133849681aa796de1f52695ab9f218cb93a7ccaef.png)

**递归法** 处理如下：

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    // 思路：如果当前节点在 [p, q] 区间里，那么表示当前节点就是p和q的最近公共祖先
    // 并且因为此题我们可以明确递归的方向，不需要遍历整棵树，得到结果后可以直接返回因此此题前中后序遍历都可以
    if (root == null) {
        return root;
    }
    if (root.val > p.val && root.val > q.val) {
        // 当前节点的值比p和q节点都要大，说明目标值在当前节点的左子树上
        return lowestCommonAncestor(root.left, p, q);
    } else if (root.val < p.val && root.val < q.val) {
        // 当前节点的值比p和q节点都要小，说明目标值在当前节点的右子树上
        return lowestCommonAncestor(root.right, p, q);
    } else {
        // 当前节点的值在 [p,q] 区间中
        return root;
    }
}
```

**迭代法** 处理如下：

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    // 思路：如果当前节点在 [p, q] 区间里，那么表示当前节点就是p和q的最近公共祖先
    // 迭代法的处理
    while (root != null) {
        if (root.val > p.val && root.val > q.val) {
            // 当前节点的值比p和q节点都要大，说明目标值在当前节点的左子树上
            return lowestCommonAncestor(root.left, p, q);
        } else if (root.val < p.val && root.val < q.val) {
            // 当前节点的值比p和q节点都要小，说明目标值在当前节点的右子树上
            return lowestCommonAncestor(root.right, p, q);
        } else {
            // 当前节点的值在 [p,q] 区间中
            return root;
        }
    }
    return null;
}
```

## 二叉搜索树中的插入操作

相关题目：

- 701.二叉搜索树中的插入操作

代码如下：

```java
public TreeNode insertIntoBST(TreeNode root, int val) {
    if (root == null) {
        return new TreeNode(val);
    }
    if (root.val > val) {
        // 当前节点值大于目标节点，目标节点需要插入到左子树中
        root.left = insertIntoBST(root.left, val);
    } else if (root.val < val) {
        // 当前节点值小于目标节点，目标节点需要插入到右子树中
        root.right = insertIntoBST(root.right, val);
    }
    // 返回根节点
    return root;
}
```

再来看下没有返回值的递归处理，上面的代码其实是从下面的代码优化过去的：

```java
TreeNode parent;
public void recurse(TreeNode node, int val) {
    if (node == null) {
        node = new TreeNode(val);
        // 赋值后的node是叶子节点
        if (parent != null) {
            // 与父节点的值进行比较
            if (val > parent.val) {
                // 如果当前节点值大于父节点，那么它就插入到父节点的右子树上
                parent.right = node;
            } else if (val < parent.val) {
                // 如果当前节点值小于父节点，那么它就插入到父节点的左子树上
                parent.left = node;
            }
        }
    } else {
        parent = node;
        // 当前节点值不为空，继续进行遍历
        if (node.val > val) {
            recurse(node.left, val);
        } else if (node.val < val) {
            recurse(node.right, val);
        }
    }
}

public TreeNode insertIntoBST(TreeNode root, int val) {
    if (root == null) {
        return new TreeNode(val);
    }
    recurse(root, val);
    return root;
}
```

**迭代法** 的处理如下：

```java
public TreeNode insertIntoBST(TreeNode root, int val) {
    // 迭代法处理
    if (root == null) {
        return new TreeNode(val);
    }
    TreeNode cur = root;
    TreeNode parent = null;
    // 找到满足条件的节点
    while (cur != null) {
        parent = cur;
        if (cur.val > val) {
            cur = cur.left;
        } else {
            // val的值与二叉树中现有节点值不一致
            cur = cur.right;
        }
    }
    // 上面找到的cur就是新节点插入的位置，parent是它的父节点
    TreeNode node = new TreeNode(val);
    // 再判断一下是放入左子节点还是右子节点
    if (val < parent.val) {
        parent.left = node;
    } else {
        parent.right = node;
    }
    return root;
}
```

## 删除二叉搜索树中的节点

相关题目：

- 450.删除二叉搜索树中的节点

此题的关键在于 **删除节点后，需要对树中原节点的位置进行调整**，理清了这一点，这题就比较好处理了。

使用递归处理，本题中递归函数的返回值是 **删除了指定节点后的新节点信息**。

首先我们需要找到目标节点，因为二叉搜索树，所以很好确定搜索路径：**比当前节点的值大，就去右子树上找，反之去左子树上找。**

找到对应节点位置后，对其执行删除操作，这里的删除操作实际上是对树的结构进行调整。我们按照下面四种情况处理：

1. **左右节点都是空。**此时当前节点是叶子节点，直接将其删除，新的节点是 `null`。
2. **左右子节点中一个为空，另一个不为空。**删除当前节点后，将不为空的那个子节点放到被删除的节点位置即可，新的节点是 **不为空的那个子节点**。
3. **左右子节点都不为空**。删除当前节点后，将 [**被删除节点的左子树头结点**]，放到 [**被删除节点的右子树头结点**] 的 [**左子树的最左侧节点**] 上，返回删除节点右孩子为新的根节点。（***注：这里的处理还有很多，这里只是单列了其中一种***）

代码处理如下：

```java
public TreeNode deleteNode(TreeNode root, int key) {
    // 节点被删除后，左子节点替代之前的节点，如果左子节点为空，右子节点代替
    // 也可以先用右节点替代，如果右节点不存在再用左节点替代
    if (root == null) {
        return root;
    }
    if (root.val == key) {
        if (root.left == null && root.right == null) {
            // 左右节点都为空(叶子节点)的情况也要处理
            return null;
        } else if (root.left != null && root.right == null) {
            return root.left;
        } else if (root.right != null && root.left == null) {
            return root.right;
        } else {
            // 左右节点都不为空
            // 找右子节点左子树左边最底部的节点
            TreeNode tmp = root.right;
            while (tmp.left != null) {
                tmp = tmp.left;
            }
            // 将原节点左子树放在找到的节点左侧
            tmp.left = root.left;
            return root.right;
        }
    }
    if (root.val > key) {
        root.left = deleteNode(root.left, key);
    }
    if (root.val < key) {
        root.right = deleteNode(root.right, key);
    }
    return root;
}
```

> 上面两题关于二叉搜素树增加节点和删除节点的题目，其中增加节点不需要对原树结构进行调整，但是删除节点是需要的。删除节点后在对原节点的位置进行调整时，要注意被调整的节点左右子树也需要响应的调整。
> 
> 二叉搜索树在递归时，一定要注意递归左子树和右子树的时机：当目标值大于当前节点值时，递归右子树；当目标值小于当前节点值时，递归左子树。

## 修剪二叉搜索树

相关题目：

- 669.修剪二叉搜索树

此题与上面一题类似，都是要移除二叉搜索树中的节点，但是区别是这次给的条件是包括指定范围内的节点，这就意味着要删除多个节点。

一开始，我想着仍然按照上一题的方法来处理：*找到不满足条件的节点后，按照上一步的四部逻辑将其移除。并且结果不直接返回，重构后的树继续处理。*但是提交时才发现无法通过。

实际上只要遵循下面的逻辑处理即可：

1. 如果当前节点的值小于 `low`，那么说明值在 [`low`, `high`] 范围内的节点肯定要比当前节点大，也就是在当前节点右子树上，因此返回右子树的递归结果即可。
2. 如果当前节点的值大于 `high`，那么说明值在 [`low`, `high`] 范围内的节点肯定要比当前节点小，也就是在当前节点左子树上，因此返回左子树的递归结果即可。
3. 如果当前节点的值在 [`low`, `high`] 范围内，说明当前节点满足条件，继续递归获取其左子树和右子树的修剪结果，然后返回当前节点即可。

代码如下：

```java
public TreeNode trimBST(TreeNode root, int low, int high) {
    if (root == null) {
        return null;
    }
    if (root.val < low) {
        // 当前节点的值小于 [low, high]，那么修建后的结果肯定从当前节点的右子树上返回
        return trimBST(root.right, low, high);
    }
    if (root.val > high) {
        // 当前节点的值大于 [low, high]，那么修建后的结果肯定从当前节点的左子树上返回
        return trimBST(root.left, low, high);
    }
    // 如果当前节点的值再 [low,high] 范围内，就对其左右子树分别进行修剪
    root.left = trimBST(root.left, low, high);
    root.right = trimBST(root.right, low, high);
    return root;
}
```

## 将有序数组转换为二叉搜索树

相关题目：

- 108.将有序数组转换为二叉搜索树

此题是 **构造二叉树** 类的题目，与 [**654.最大二叉树**] 的处理类似，要先找分割点，然后将分割点作为当前节点，递归处理左区间和右区间。

题目中给出了有序数组，并且要构造一个平衡二叉搜索树，那么只要将数组的中间元素作为分割点即可，这样左右两颗子树的高度差就限制在了1以内。

代码如下：

```java
public TreeNode sortedArrayToBST(int[] nums) {
    if (nums.length == 0) {
        return null;
    }
    // 寻找分割点，分割点是数组的中间一个元素
    int cuttingPoint = nums.length / 2;
    TreeNode root = new TreeNode(nums[cuttingPoint]);
    root.left = sortedArrayToBST(Arrays.copyOfRange(nums, 0, cuttingPoint));
    root.right = sortedArrayToBST(Arrays.copyOfRange(nums, cuttingPoint + 1, nums.length));
    return root;
}
```

## 把二叉搜索树转换为累加树

相关题目：

- 538.把二叉搜索树转换为累加树

查看题目中给出的示例图，发现最终的结果就是**原树通过反中序遍历，依次对节点元素值进行累加，然后赋给原节点值**。

![16911338376793eedd0fa7c5aeed7d34648624071de23.png](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16911338376793eedd0fa7c5aeed7d34648624071de23.png)

先用 **递归法** 处理，代码如下:

```java
int pre = 0;
public TreeNode convertBST(TreeNode root) {
    // 反中序遍历，对节点元素逐个累加
    if (root == null) {
        return null;
    }
    // 右
    convertBST(root.right);
    // 中
    root.val += pre;
    pre = root.val;
    // 左
    convertBST(root.left);
    return root;
}
```

再用 **迭代法** 处理，代码如下：

```java
public TreeNode convertBST(TreeNode root) {
    if (root == null) {
        return null;
    }
    // 使用迭代法处理
    Stack<TreeNode> stack = new Stack<TreeNode>();
    stack.push(root);
    int pre = 0;
    while (!stack.isEmpty()) {
        TreeNode node = stack.peek();
        if (node != null) {
            stack.pop();
            // 左
            if (node.left != null) {
                stack.push(node.left);
            }
            // 中
            stack.push(node);
            stack.push(null);
            // 右
            if (node.right != null) {
                stack.push(node.right);
            }
        } else {
            stack.pop();
            node = stack.pop();
            node.val += pre;
            pre = node.val;
        }
    }
    return root;
}
```

## 总结

二叉树相关的题目到这里就告一段落了，下面进行一下总结。

- 二叉树的 **深度** 是从根节点开始递增的，根节点的深度是1；二叉树的 **高度** 是从根节点开始递减的，最后的叶子节点的高度是1。
  
  如果是求 **二叉树某个节点的深度**，那就需要从根节点开始遍历，因此使用 **前序遍历**。
  
  如果是求 **二叉树的最大深度**，那么就等于是求 **二叉树根节点的高度**，需要从叶子节点开始遍历，因此使用 **后序遍历**。
- 一般来讲，如果是求普通二叉树的属性(*比如高度、最大深度、节点个数、是否平衡等*)，使用 **后序遍历** 就能解决。使用 **前序遍历** 处理的情况是 **求二叉树某个节点的深度**，以及 **找出二叉树的所有路径**。
- 对于二叉搜索树，要利用好它的特性：**中序遍历的结果序列是有序递增的**。
- 对于 **二叉树的构造**(*节点的增删也属于这一类*) 相关的题目，要先构造中间节点，因此需要使用 **前序遍历**。
- 使用结果序列构造二叉树，要记住只有结果序列是 [**前序 + 中序**] 或 [**中序 + 后序**] 才能构造出二叉树。在构造时先通过 **前序/后序** 序列找到分割点(根节点)，然后根据分割点将 **中序序列** 分割，之后再根据分割后 **中序序列** 左右子树的大小分割 **前序序列**。
- 遍历二叉树时，要思考一下是否需要对整棵树进行遍历，还是只要遍历 **左子树** 或 **右子树** 即可。
- 关于 **回溯算法**，代码中可能没有明显的体现回溯的过程，但是我们要理解回溯触发的位置在哪里。
- 最后再来回顾一下 **递归法三部曲**：
  1. **确定递归函数的参数和返回值**
  2. **确定终止条件**
  3. **确定单层递归的逻辑**
