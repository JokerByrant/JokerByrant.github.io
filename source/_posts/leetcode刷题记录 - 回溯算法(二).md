---
title: leetcode刷题记录 - 回溯算法(二)
tags:
  - leetcode
  - 回溯
categories: 算法
abbrlink: 6975
date: 2023-08-11 13:23:05
---
> 本篇是 **回溯法** 的第二篇，主要看一下 **排列** 类的题目。

<!--more-->

在 **组合** 类的题目中，我们写的回溯法函数中都包含了 `startIndex`，用来剔除已经遍历过的节点（*注：从多个集合中找组合关系也不需要 `startIndex`，例如 [**17.电话号码的字母组合**] 这一题，因为多个集合中元素不会相互影响*）。

而在 **排列** 类的题目中，回溯法函数中不需要使用 `startIndex`，因为 **排列是有序的，也就是说 `{1, 2}` 和 `{2, 1}` 是两个集合，元素 `1` 在 `{1, 2}` 中已经使用过了，但是在 `{2,1}` 中还要在使用一次 `1`，所以处理排列问题就不用使用 `startIndex` 了**。

## 排列问题

相比于 **组合问题**，在处理 **排列问题** 时，我们需要关注下面几个问题：

- 每层都是从 `0` 开始搜索而不是 `startIndex`，因为 `{1, 2}` 和 `{2, 1}` 是两个排列结果，而组合中这两个是一个组合。
- 需要 `used` 数组记录 `path` 里都放了哪些元素了，这个 `used` 数组是为了在递归处理时剔除已经处理过的元素。

### 全排列

相关题目：

- 46.全排列

上面说过在处理 **排列** 问题时，回溯函数无需使用 `startIndex`，这就意味着我们每次进行递归时，都会遍历数组的所有元素，包括上面已经遍历过的父节点元素，这就会导致回溯函数陷入无限递归的死循环，因此我们需要对回溯函数进行一下遍历范围的限制：**父节点处理过的节点无需在子节点中再处理一遍**。

可以使用一个 **全局的哈希表** 来记录在纵向递归树的某个枝干时处理过的节点，哈希表中放的元素是 **数组的下标索引**，**这个哈希表也需要进行回溯操作**。代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
Set<Integer> set = new HashSet<>();

public List<List<Integer>> permute(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    backtracking(nums);
    return resList;
}

public void backtracking(int[] nums) {
    if (tmpList.size() == nums.length) {
        resList.add(new ArrayList<>(tmpList));
    }
    for (int i = 0; i < nums.length; i++) {
        // 树的同层节点中重复节点不重复处理
        if (set.contains(i)) {
            continue;
        }
        set.add(i);
        tmpList.add(nums[i]);
        backtracking(nums);
        tmpList.removeLast();
        set.remove(i);
    }
}
```

对我而言，**哈希表** 更好理解，但是如果条件允许的话，最好还是将 **哈希表** 替换成 **数组**，这样效率更高。代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
boolean[] used;

public List<List<Integer>> permute(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    used = new boolean[nums.length];
    Arrays.fill(used, false);
    backtracking(nums);
    return resList;
}

public void backtracking(int[] nums) {
    if (tmpList.size() == nums.length) {
        resList.add(new ArrayList<>(tmpList));
    }
    for (int i = 0; i < nums.length; i++) {
        // 树的同层节点中重复节点不重复处理
        if (used[i]) {
            continue;
        }
        used[i] = true;
        tmpList.add(nums[i]);
        backtracking(nums);
        tmpList.removeLast();
        used[i] = false;
    }
}
```

上面的哈希表中进行的判重处理，针对的是数组的下标索引。因为本题中数组的元素是不可重复的，因此哈希表中放数组元素的值也是一样的。因此可以进行一下优化，要看当前节点的值是否在父节点中处理过，我们直接看 **递归当前枝干拿到的路径(`tmpList`)** 中是否包含当前节点的值即可，如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();

public List<List<Integer>> permute(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    backtracking(nums);
    return resList;
}

public void backtracking(int[] nums) {
    if (tmpList.size() == nums.length) {
        resList.add(new ArrayList<>(tmpList));
    }
    for (int i = 0; i < nums.length; i++) {
        // 树的同层节点中重复节点不重复处理
        if (tmpList.contains(nums[i])) {
            continue;
        }
        tmpList.add(nums[i]);
        backtracking(nums);
        tmpList.removeLast();
    }
}
```

### 全排列ii

相关题目：

- 47.全排列ii

题目中给出了条件：**数组中包含重复的数字，但是结果集不能重复**。因此我们需要在上一题 [**46.全排列**] 的基础上，对数组进行 **对父节点下同层节点的去重** 操作，因此只要先对数组进行 **排序**，然后在回溯函数中加上一个 **哈希表去重** 的处理即可，代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
boolean[] used;

public List<List<Integer>> permute(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    used = new boolean[nums.length];
    Arrays.fill(used, false);
    backtracking(nums);
    return resList;
}

public void backtracking(int[] nums) {
    if (tmpList.size() == nums.length) {
        resList.add(new ArrayList<>(tmpList));
    }
    for (int i = 0; i < nums.length; i++) {
        // 树的同层节点中重复节点不重复处理
        if (used[i]) {
            continue;
        }
        used[i] = true;
        tmpList.add(nums[i]);
        backtracking(nums);
        tmpList.removeLast();
        used[i] = false;
    }
}
```

还有另一种处理方式，在处理 **[纵向递归树的枝干时，跳过已经处理过的指定下标的数组元素]** 时，我们使用了一个存放数组下标索引的 **哈希表(数组)**。可以利用这个数组来进行 **对父节点下同层子节点的去重** 操作，如下，注意看其中的注释： 

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
boolean[] used;

public List<List<Integer>> permuteUnique(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    used = new boolean[nums.length];
    Arrays.fill(used, false);
    Arrays.sort(nums);
    backtracking(nums);
    return resList;
}

public void backtracking(int[] nums) {
    if (nums.length == tmpList.size()) {
        resList.add(new ArrayList<>(tmpList));
    }
    for (int i = 0; i < nums.length; i++) {
        // 在对某个节点的子树支进行遍历，如果当前节点被处理过了，那就直接跳过
        if (used[i]) {
            continue;
        }
        // 当 nums[i] == nums[i - 1] 时，有下面两种情况：
        //   - 如果used[i - 1] == true，那么表示nums[i - 1]在同一树支(纵向)使用过
        //   - 如果used[i - 1] == false，那么表示 nums[i - 1] 在同一树层中使用过
        // 这里关于used[i - 1]两种状态的定义有些抽象，下面解释一下，可以结合下面的代码一起看，理解一下过程：
        //   - 在处理父节点(i-1)时，会将used[i-1]赋值为true，然后进入递归，所以如果对当前节点的处理是由父节点递归处理子节点触发的，那这时我们拿到的used[i-1]==true.
        //   - 在处理兄弟节点(i-1)时，used[i-1]同样会被赋值为true，但是处理完会进行回溯，used[i-1]重新被赋值为false，当处理到当前节点时(i)，拿到的used[i-1]==false
        // 这里我们要保证同一树层下，相同值的节点不重复处理，因此只要剔除 used[i - 1] == false 的情况即可
        if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) {
            continue;
        }
        tmpList.add(nums[i]);
        used[i] = true;
        backtracking(nums);
        tmpList.removeLast();
        used[i] = false;
    }
}
```

在 [**46.全排列**] 中，我们最后贴了一个最优方案：**直接通过递归当前枝干拿到的路径(`tmpList`)来判断当前节点是否在父节点中处理过了**，在本题中并不适用。因为 [**46.全排列**] 中可以使用这种处理的前提是：**数组中不包含重复的元素，因此哈希表对下标索引去重和对值去重效果是一样的**。而本题中 **数组中包含重复的数字**，因此 **无法通过某个值确定它的索引**，因此只能使用 **哈希表存数组元素下标** 的方式来处理。

## 重新安排行程

相关题目：

- 322.重新安排行程

本题是一道 **hard** 题，题目中给出的条件包含了一条航班行程，其中的元素是 **{出发机场, 到达机场}**，然后限定了 **最开始的出发机场是 "JFK"**，让我门找一条行程组合，如果有多条那么返回那条按照机场名称的字典排序较小的那条（*比如机场1名称为 `A`，机场2名称为 `B`，那么 `A` 相对 `B` 在字典的排序更小*）。

比较简单的处理是，我们先将给出的航班路径进行转换，创建一个哈希表来存储航班路径，里面的结构是 **{出发机场, {到达机场, 航班次数}}**。然后在递归函数中，我们的处理就是 **找到从每个机场出发包含的路径，找到一条就将映射关系中的次数相应的减少**。

代码如下：

```java
LinkedList<String> resList = new LinkedList<>();
// 这里存放的映射关系是：{出发机场, {到达机场, 航班次数}}
Map<String, Map<String, Integer>> pathMap = new HashMap<>();

public List<String> findItinerary(List<List<String>> tickets) {
    for (List<String> list : tickets) {
        // 题目中要求的按字典排序，是针对机场的名字，较小的在前面，因此我们这里使用TreeMap，默认是递增的
        Map<String, Integer> map = pathMap.getOrDefault(list.get(0), new TreeMap<>());
        map.put(list.get(1), map.getOrDefault(list.get(1), 0) + 1);
        pathMap.put(list.get(0), map);
    }
    // 出发机场设置为JFK
    resList.add("JFK");
    backtracking(tickets.size());
    return resList;
}

public boolean backtracking(int ticketsNum) {
    if (ticketsNum + 1 == resList.size()) {
        // 找到了一条路径，直接返回
        return true;
    }
    // 结果集中的最后一条数据是上一次航班的到达机场，也就是这一次航班的出发机场
    // 这里拿到以 [上一次航班的到达机场] 为 [出发机场] 的航班路径
    Map<String, Integer> map = pathMap.get(resList.getLast());
    if (map != null) {
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            int count = entry.getValue();
            // 只处理航班次数大于0的航班路径
            if (count > 0) {
                resList.add(entry.getKey());
                entry.setValue(count - 1);
                // 递归剩余路径
                if (backtracking(ticketsNum)) {
                    return true;
                }
                // 回溯
                resList.removeLast();
                entry.setValue(count);
            }
        }
    }
    return false;
}
```

## 棋盘问题

棋盘问题要处理的都是 **二维数组**。

### N皇后

相关题目：

- 51.N皇后

> 这个题目应该是算法题中出现频率/名气比较大的题目吧，因为之前还没开始刷算法题，一想到算法题我就会自动联想到 **N皇后**...

之前处理的都是一维数组，而这题要处理的是一个 **二维数组**，但是其实解法与一维数组是一样的，只不过在回溯函数的参数上我们需要做一下调整：**如果递归中遍历的是行，那么就要传入列作为参数。**下面的处理是：**棋盘的宽度就是 `for` 循环的长度，递归的深度就是棋盘的高度。**

个人认为本题比较难处理的点有两个：

- 理解回溯函数是如何对二维数组进行回溯处理的。
- 对皇后的位置是否满足条件的验证函数。

代码如下：

```java
List<List<String>> resList = new ArrayList<>();
// 模拟棋盘
char[][] chessboard;

public List<List<String>> solveNQueens(int n) {
    chessboard = new char[n][n];
    for (char[] chars : chessboard) {
        Arrays.fill(chars, '.');
    }
    backtracking(n, 0);
    return resList;
}

public void backtracking(int n, int row) {
    if (row == n) {
        resList.add(Array2List(chessboard));
        return;
    }
    // 这里拿到的是棋盘中的列，遍历操作在棋盘中的表现是纵向的
    // 整体的处理流程是：纵向遍历棋盘的列，然后对每列再进行递归，递归的方向是横向的，处理的是棋盘的行
    for (int col = 0; col < n; col++) {
        if (isValid(col, row, n)) {
            chessboard[row][col] = 'Q';
            backtracking(n, row + 1);
            chessboard[row][col] = '.';
        }
    }
}

public List<String> Array2List(char[][] chessboard) {
    List<String> list = new ArrayList<>();
    for (char[] chars : chessboard) {
        list.add(String.copyValueOf(chars));
    }
    return list;
}

// 检查同一列、同一对角线是否包含皇后
public boolean isValid(int col, int row, int n) {
    // 下面的检查都进行了剪枝处理，因为我们尚未处理到的行和列肯定没有皇后存在
    // 检查同一列是否包含皇后
    for (int i = 0; i < row; i++) {
        if (chessboard[i][col] == 'Q') {
            return false;
        }
    }
    // 检查45度对角线
    for (int i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
        if (chessboard[i][j] == 'Q') {
            return false;
        }
    }
    // 检查135度对角线
    for (int i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
        if (chessboard[i][j] == 'Q') {
            return false;
        }
    }
    return true;
}
```

### 解数独

相关题目：

- 37.解数独

> 回溯算法 + 二维数组，就是 `hard` 题，但是如果掌握了套路，解起来也不是很难。

本题的处理与 **N皇后** 类似，但是还是有一些区别，在上面 **N皇后** 的代码中，虽然题目中给出的条件也是 **二维数组**，但是因为 **N皇后每一行每一列只放一个皇后**，因此只需要通过 `for` 循环遍历行，递归遍历列，找到放置皇后的位置即可。而本题中，**棋盘的每一个位置都要放一个数字，并需要检查数字是否满足条件，因此我们需要对行和列都进行 `for` 循环遍历**。代码如下：

```java
public void solveSudoku(char[][] board) {
    backtracking(board);
}

public boolean backtracking(char[][] board) {
    // N皇后给出的条件也是二维数组，但是N皇后里每一行只需填充一个数字，因此我们只需一次遍历操作即可
    // 但是本题中我们需要将一行中的数字填满，因此我们需要分别对行和列进行遍历
    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) {
            // 当前位置有值了
            if (board[i][j] != '.') {
                continue;
            }
            // 往当前位置填充数值，需要将 1~9 都填充进去试试
            for (char k = '1'; k <= '9'; k++) {
                // 如果满足条件，则继续进行递归
                if (isValid(i, j, k, board)) {
                    board[i][j] = k;
                    backtracking(board);
                    board[i][j] = '.';
                }
            }
            // 9个数都不满足条件，那么说明当前board无法填满
            return false;
        }
    }
    return true;
}

public boolean isValid(int row, int col, char val, char[][] board) {
    // 判断行是否重复
    for (int i = 0; i < 9; i++) {
        if (board[row][i] == val) {
            return false;
        }
    }
    // 判断列是否重复
    for (int i = 0; i < 9; i++) {
        if (board[i][col] == val) {
            return false;
        }
    }
    // 判断9方格是否重复
    int startRow = (row / 3) * 3;
    int startCol = (col / 3) * 3;
    for (int i = startRow; i < startRow + 3; i++) {
        for (int j = startCol; j < startCol + 3; j++) {
            if (board[i][j] == val) {
                return false;
            }
        }
    }
    return true;
}
```
