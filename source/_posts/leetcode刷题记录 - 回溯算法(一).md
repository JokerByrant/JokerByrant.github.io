---
title: leetcode刷题记录 - 回溯算法(一)
tags:
  - leetcode
  - 回溯
categories: 算法
abbrlink: 56219
date: 2023-08-07 13:21:57
---
> 回溯是递归的副产品，只要有递归就会有回溯。
> 
> 回溯法解决的问题都可以 **抽象为树形结构**，因为回溯法解决的都是 **在集合中递归查找子集，集合的大小就构成了树的宽度，递归的深度，就构成了树的深度**。
> 
> 本篇是 **回溯法** 的第一篇，主要来学习一下 **组合** 类的题目。

<!--more-->

回溯法，一般可以解决如下几种问题：

- **组合问题**：N个数里面 **按一定规则** 找出k个数的集合
- **切割问题**：一个字符串 **按一定规则** 有几种切割方式
- **子集问题**：一个N个数的集合里有多少 **符合条件** 的子集
- **排列问题**：N个数 **按一定规则** 全排列，有几种排列方式
- **棋盘问题**：N皇后，解数独等等

之前提到在写 **递归法** 时有三部曲可以遵循，**回溯法** 也有它的三步走模板：

- 确定函数参数和返回值。
- 确定其终止条件。
- 确定遍历过程。

另外，回溯法中函数的返回值一般是 `void`。

## 组合问题

### 组合

相关题目：

- 77.组合

此题是 **回溯法** 的经典题目，考察的是 **组合** 问题。再来回顾一下 **在集合中使用回溯法** 的概念：**集合的大小构成了树的宽度，递归的次数构成了树的深度。**在本题中，**树的宽度就是n，树的深度就是k**。

下面看下代码：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> pathList = new LinkedList<>();

public List<List<Integer>> combine(int n, int k) {
    // 组合：不用关心集合中元素的顺序
    backtracking(n, k, 1);
    return resList;
}

// startIndex：用于防止组合重复出现
public void backtracking(int n, int k, int startIndex) {
    if (pathList.size() == k) {
        // pathList中元素个数如果达到了k个，那么表示找到了一个新的元素组合，将其加入到结果集中
        resList.add(new ArrayList<>(pathList));
        return;
    }
    // #1
    for (int i = startIndex; i <= n; i++) {
        // pathlist存放的是当前搜索到的变量，可以看做是一个路径
        pathList.add(i);
        // 递归，向树的深处进行遍历，遇到叶子节点后就返回。搜索起点+1，这样防止找到重复的元素
        backtracking(n, k, i + 1);
        // 回溯，因为这里的树相当于是一个多叉树，我们递归到叶子节点后，回溯至上一个节点，然后继续处理下一个叶子节点。
        pathList.removeLast();
    }
}
```

注意上面的 `#1` 处代码，按照这种遍历方式，会有一些无效的遍历出现：**集合中剩余未遍历的元素个数可能不足 `k` 个了，这时就没必要继续遍历了**。因此可以对这个遍历的范围进行一下 **剪枝** 优化，剪枝的方法是：**如果 `for` 循环选择的起始位置之后的元素个数已经不足我们需要的元素个数了，那么就没有必要遍历了。**

我们在进行 "剪枝" 时，要保证 **剩余可遍历的元素的个数要大于等于结果集中缺少的元素个数**，比如如下的案例：`n = 15`，`k = 3`，如果 `path.size() == 0`，也就是说目前没有选择元素，那么还需要再从集合中选择三个元素，可以选择的最后一对组合是 `(13, 14, 15)`；如果 `path.size() == 1`，也就是目前已经选择了一个元素，那么还需要再从集合中选择两个元素，可以选择的最后一对组合是 `(14, 15)`。

因此可以得出一个结论，我们只需要将遍历的范围控制在 `n - (k - path.size()) + 1` 范围内即可，因此可以优化为如下的遍历：

```java
for (int i = startIndex; i <= n - (k - path.size()) + 1; i++) // i为本次搜索的起始位置
```

代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> pathList = new LinkedList<>();

public List<List<Integer>> combine(int n, int k) {
    // 组合：不用关心集合中元素的顺序
    backtracking(n, k, 1);
    return resList;
}

// startIndex：用于防止组合重复出现
public void backtracking(int n, int k, int startIndex) {
    if (pathList.size() == k) {
        // pathList中元素个数如果达到了k个，那么表示找到了一个新的元素组合，将其加入到结果集中
        resList.add(new ArrayList<>(pathList));
        return;
    }
    // 注意这里的"剪枝"操作
    for (int i = startIndex; i <= n - (k - pathList.size()) + 1; i++) {
        // pathlist存放的是当前搜索到的变量，可以看做是一个路径
        pathList.add(i);
        // 递归，向树的深处进行遍历，遇到叶子节点后就返回。搜索起点+1，这样防止找到重复的元素
        backtracking(n, k, i + 1);
        // 回溯，因为这里的树相当于是一个多叉树，我们递归到叶子节点后，回溯至上一个节点，然后继续处理下一个叶子节点。
        pathList.removeLast();
    }
}
```

### 组合总和iii

相关题目：

- 216.组合总和iii

本题的解题思路与 [**77.组合**] 一致，直接上代码：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> pathList = new LinkedList<>();
int sum = 0;

public List<List<Integer>> combinationSum3(int k, int n) {
    backtracking(n, k, 1);
    return resList;
}

public void backtracking(int targeSum, int k, int startIndex) {
    if (pathList.size() == k) {
        if (sum == targeSum) {
            // 注意这里加入结果集中的组合，一定要新创建一个集合，否则会造成污染
            resList.add(new ArrayList<>(pathList));
        }
        return;
    }
    for (int i = startIndex; i <= 9; i++) {
        // 处理
        sum += i;
        pathList.add(i);
        // 继续递归
        backtracking(targeSum, k, i + 1);
        // 回溯
        sum -= i;
        pathList.removeLast();
    }
}
```

进行 **剪枝** 处理：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> pathList = new LinkedList<>();
int sum = 0;

public List<List<Integer>> combinationSum3(int k, int n) {
    backtracking(n, k, 1);
    return resList;
}

public void backtracking(int targeSum, int k, int startIndex) {
    // 剪枝
    if (sum > targeSum) {
        return;
    }
    if (pathList.size() == k) {
        if (sum == targeSum) {
            // 注意这里加入结果集中的组合，一定要新创建一个集合，否则会造成污染
            resList.add(new ArrayList<>(pathList));
        }
        return;
    }
    for (int i = startIndex; i <= 9 - (k - pathList.size()) + 1; i++) {
        // 处理
        sum += i;
        pathList.add(i);
        // 继续递归
        backtracking(targeSum, k, i + 1);
        // 回溯
        sum -= i;
        pathList.removeLast();
    }
}
```

### 电话号码的字母组合

相关题目：

- 17.电话号码的字母组合

此题中给出的条件并不明显， 需要对题目中的要素进行一些梳理：

- 每个数字都映射到了指定的字符串上。我们可以定义一个映射关系，来管理这个映射，可以使用数组处理。
- 确定树的深度和宽度对应的要素。题目中给出输入的 `digits` 中对应的数的个数就是树的深度，也就是我们递归时需要处理的；而每个数字在映射中对应的字符就是树的宽度，是我们每次递归中需要进行遍历的。

代码如下：

```java
List<String> resList = new ArrayList<>();
StringBuilder tmpStr = new StringBuilder();
// 建立数组，映射到 2-9 对应的字符串
String[] strArr = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

public List<String> letterCombinations(String digits) {
    if (digits == null || digits.length() == 0) {
        return resList;
    }
    backtracking(digits, 0);
    return resList;
}

public void backtracking(String digits, int index) {
    // index是从0开始递归的，因此当index==digits.length()时，说明所有数字都已经递归处理过
    if (index == digits.length()) {
        resList.add(tmpStr.toString());
        return;
    }
    // 获取当前遍历到的数字对应的字母序列
    String str = strArr[digits.charAt(index) - '0'];
    // 遍历字母序列，并对剩余未遍历的数字进行递归处理
    for (int i = 0; i < str.length(); i++) {
        tmpStr.append(str.charAt(i));
        backtracking(digits, index + 1);
        tmpStr.deleteCharAt(tmpStr.length() - 1);
    }
}
```

关于本题的 **剪枝** 处理，由于本题中每次递归的数字对应的遍历范围(字母)都是独立的，因此无法对遍历范围进一步的缩小。与上面两题的区别是：**本题每一个数字代表的是不同集合，也就是求不同集合之间的组合，而上面两题都是是求同一个集合中的组合！**

另外，注意本题没有使用 `startIndex` 来限制每次遍历的范围， 因为本题是 **多个集合取组合**，各个集合中相互不影响，因此不用 `startIndex`。

### 组合总和

相关题目：

- 39.组合总和

相比于前两题求组合的和，本题有一个特殊的条件：**本题中的元素可以被重复选取。**

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
int sum = 0;

public List<List<Integer>> combinationSum(int[] candidates, int target) {
    backtreacking(candidates, target, 0);
    return resList;
}

public void backtreacking(int[] candidates, int target, int startIndex) {
    // 终止条件有两个：和大于目标值，和等于目标值
    if (sum > target) {
        return;
    }
    if (sum == target) {
        resList.add(new ArrayList<>(tmpList));
        return;
    }
    for (int i = startIndex; i < candidates.length; i++) {
        tmpList.add(candidates[i]);
        sum += candidates[i];
        // 元素可以重复选取，因此这里在进行递归处理时，需要对当前索引下的元素的也进行递归处理
        backtreacking(candidates, target, i);
        tmpList.removeLast();
        sum -= candidates[i];
    }
}
```

本题中是对一个集合中的元素进行求组合，因此可以对遍历的范围进行 **剪枝** 处理。本题做的剪枝相比上面两题比较复杂：**对总集合排序之后，如果下一层的 `sum`（就是本层的 `sum + candidates[i]`）已经大于`target`，就可以结束本轮 `for` 循环的遍历。**

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
int sum = 0;

public List<List<Integer>> combinationSum(int[] candidates, int target) {
    // 先排序，方便后面进行剪枝
    Arrays.sort(candidates);
    backtreacking(candidates, target, 0);
    return resList;
}

public void backtreacking(int[] candidates, int target, int startIndex) {
    // 终止条件有两个：和大于目标值，和等于目标值
    if (sum > target) {
        return;
    }
    if (sum == target) {
        resList.add(new ArrayList<>(tmpList));
        return;
    }
    for (int i = startIndex; i < candidates.length; i++) {
        // 之前对数组进行了排序，现在是个递增序列
        // 因此如果当前一次遍历与历史和超过目标和了，那么接下来的几次遍历肯定都会超
        if (sum + candidates[i] > target) {
            break;
        }
        tmpList.add(candidates[i]);
        sum += candidates[i];
        // 元素可以重复选取，因此这里在进行递归处理时，需要对当前索引下的元素的也进行递归处理
        backtreacking(candidates, target, i);
        tmpList.removeLast();
        sum -= candidates[i];
    }
}
```

### 组合总和ii

相关题目：

- 40.组合总和ii

这题与上面几题的区别是，给定条件中增加了限制：**包含重复的数字**。并且对结果集增加了限制条件：**不能包含相同的组合**。

这题的难点就在对重复组合的剔除，关键点在于我们要保证 **同一父节点下的相同值的同层节点不重复处理**，因此我们可以使用 **哈希表** 来处理：**因为递归函数中的遍历代表的含义就是对同层节点进行遍历，所以我们在递归函数中初始化一个哈希表，记录一下已经遍历过的节点的值，相同值的节点不重复处理**。

并且这里需要着重记一下：**在求组合时，如果题目中给出的数组中包含重复元素，结果要求不能包含相同的组合，那我们在进行上面的对 [同一父节点下同层节点的去重处理] 前，需要对原数组进行排序。如果不进行排序直接进行去重，结果集中会出现排列顺序不同的相同组合。**

为什么一定要排序呢？看一下下面的案例：

比如现在有数组 `{2, 1, 2, 2}`，目标结果是 `3`。

- 我们按照正常的顺序处理，先处理 `2`，它的子节点是 `{1, 2, 2}`，最终的组合是 `{2, 1}`；然后处理 `1`，它的子节点是 `{2, 2}`，由于我们的去重处理是 **对同一父节点下的同层元素进行去重**，所以这里能拿到一个组合 `{1, 2}`。可以看到结果中包含了 `{2, 1}` 和 `{1, 2}`，但它们实际上是一个组合！
- 再看下将其排序后的处理。排序后数组是 `{1, 2, 2, 2}`，先处理 `1`，它的子节点是 `{2, 2, 2}`，最终的组合是 `{1, 2}`；之后处理 `2`，它的子节点是 `{2, 2}`，可以看到已经不包含 `1` 了，之后处理的节点中也都不会有 `1` 了，因此不会出现重复组合的情况。

也就是说，如果要进行 **对父节点下同层节点去重**，不是说必须要对数组的元素进行排序，而是一定要 **保证数组中相同的元素是相邻的**。比如这个数组：`{10, 1, 3, 3, 5, 5, 7}`，不是有序的，但是相同的元素都是相邻的，也是可以不用进行排序的。

但是为了求解的方便性，我们还是使用 **对原数组进行排序** 的方式来 **保证相同元素在相邻位置**。

首先看一下使用 **哈希表** 的处理，代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
int sum = 0;

public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    if (candidates == null || candidates.length == 0) {
        return resList;
    }
    Arrays.sort(candidates);
    backtracking(candidates, target, 0);
    return resList;
}

public void backtracking(int[] candidates, int target, int startIndex) {
    if (sum == target) {
        resList.add(new ArrayList<>(tmpList));
    }
    Set<Integer> set = new HashSet<>();
    for (int i = startIndex; i < candidates.length; i++) {
        // 这一步判断是进行额外的剪枝处理，因为candidates已经排过序了，是递增的，所以如果加入当前节点后组合总和超出范围，那后面的节点肯定都不符合条件
        if (sum + candidates[i] > target) {
            break;
        }
        if (set.contains(candidates[i])) {
            continue;
        }
        sum += candidates[i];
        tmpList.add(candidates[i]);
        set.add(candidates[i]);
        backtracking(candidates, target, i + 1);
        sum -= candidates[i];
        tmpList.removeLast();
    }
}
```

之前在 **哈希表** 篇提到过：**数组就是简单的哈希表**，元素较少的情况下可以使用数组替代哈希表。本题中给出了一个条件：`1 <= candidates[i] <= 50`，因此本题可以使用数组替代哈希表。代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
int sum = 0;

public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    if (candidates == null || candidates.length == 0) {
        return resList;
    }
    Arrays.sort(candidates);
    backtracking(candidates, target, 0);
    return resList;
}

public void backtracking(int[] candidates, int target, int startIndex) {
    if (sum == target) {
        resList.add(new ArrayList<>(tmpList));
    }
    boolean[] used = new boolean[51];
    Arrays.fill(used, false);
    Set<Integer> set = new HashSet<>();
    for (int i = startIndex; i < candidates.length; i++) {
        // 这一步判断是进行额外的剪枝处理，因为candidates已经排过序了，是递增的，所以如果加入当前节点后组合总和超出范围，那后面的节点肯定都不符合条件
        if (sum + candidates[i] > target) {
            break;
        }
        if (used[candidates[i]]) {
            continue;
        }
        sum += candidates[i];
        tmpList.add(candidates[i]);
        used[candidates[i]] = true;
        backtracking(candidates, target, i + 1);
        sum -= candidates[i];
        tmpList.removeLast();
    }
}
```

上面的去重处理可以进一步优化，直接移除额外开辟的 **数组/哈希表**，因为原数组是排过序的，所以同层节点中相同值的两个节点肯定是相邻的，因此直接通过 `nums[i - 1] == nums[i]` 即可找出相同值的两个同层节点。代码如下

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();
int sum = 0;

public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    if (candidates == null || candidates.length == 0) {
        return resList;
    }
    Arrays.sort(candidates);
    backtracking(candidates, target, 0);
    return resList;
}

public void backtracking(int[] candidates, int target, int startIndex) {
    if (sum == target) {
        resList.add(new ArrayList<>(tmpList));
    }
    for (int i = startIndex; i < candidates.length; i++) {
        if (sum + candidates[i] > target) {
            break;
        }
        if (i > startIndex && candidates[i] == candidates[i - 1]) {
            continue;
        }
        sum += candidates[i];
        tmpList.add(candidates[i]);
        backtracking(candidates, target, i + 1);
        sum -= candidates[i];
        tmpList.removeLast();
    }
}
```

## 切割问题

关于切割问题，有以下几个关键点：

- 切割问题其实类似组合问题
- 如何模拟那些切割线
- 切割问题中递归如何终止
- 在递归循环中如何截取子串
- 如何判断回文

在解题时，对这几个关键点处理到位了，那么问题就能解决了。

### 分割回文串

相关题目：

- 131.分割回文串

本题主要的难点在于 **如何对字符串进行切割**，我们每次递归时传入了一个 `startIndex` 参数，这个 `startIndex` 就是切割点，`[startIndex, i]` 就是要截取的子串，我们要在每次遍历时，**判断这个子串是否是回文串**，如果是，则加入结果集中，如果不是，则直接跳过，需要寻找新的组合。代码如下：

```java
List<List<String>> resList = new ArrayList<>();
LinkedList<String> tmpList = new LinkedList<>();

public List<List<String>> partition(String s) {
    if (s == null || s.length() == 0) {
        return resList;
    }
    backtracking(s, 0);
    return resList;
}

public void backtracking(String s, int startIndex) {
    if (startIndex >= s.length()) {
        resList.add(new ArrayList<>(tmpList));
        return;
    }
    for (int i = startIndex; i < s.length(); i++) {
        if (isPalindrome(s, startIndex, i)) {
            // 如果前i个字符是回文串，那么将子串加入结果集，并继续遍历
            tmpList.add(s.substring(startIndex, i + 1));
        } else {
            // 如果前i个字符不是回文串，那么当前分割的子串不满足条件，继续遍历字符串
            continue;
        }
        backtracking(s, i + 1);
        tmpList.removeLast();
    }
}

public boolean isPalindrome(String s, int start, int end) {
    while (start < end) {
        if (s.charAt(start) != s.charAt(end)) {
            return false;
        }
        start++;
        end--;
    }
    return true;
}
```

### 复原IP地址

相关题目

- 93.复原IP地址

此题与 [**131.分割回文串**] 类似，在递归中进行的操作是判断子串是否满足要求（**需要新建一个方法用来验证字串是否是合法的 `ip` 段**），因此需要首先判断是否满足 `startIndex - i` 范围内的子串满足要求了，才能进行下一步的递归，如果不满足则说明当前组合的子串不符合要求，需要继续寻找别的组合。代码如下：

```java
List<String> resList = new ArrayList<>();
int ponitNum = 0;

public List<String> restoreIpAddresses(String s) {
    if (s == null || s.length() == 0) {
        return resList;
    }
    backtracking(new StringBuilder(s), 0);
    return resList;
}

public void backtracking(StringBuilder s, int startIndex) {
    if (ponitNum == 3) {
        // 如果"."数量达到3个，则验证最后一个子串是否符合要求，如果符合要求，加入到结果集中
        if (isValid(s, startIndex, s.length() - 1)) {
            resList.add(s.toString());
        }
        return;
    }
    for (int i = startIndex; i < s.length(); i++) {
        if (isValid(s, startIndex, i)) {
            // 因为这里是在原字符串上进行的修改，因此这里需要指定插入的位置，不能直接append()
            s.insert(i + 1, ".");
            ponitNum++;
            // 这里递归操作下一个子串，需要将位置置为i+2，因为上面插入了一个"."
            backtracking(s, i + 2);
            // 回溯操作，这里删除插入的"."字符，也要指定指定的位置
            s.deleteCharAt(i + 1);
            ponitNum--;
        } else {
            break;
        }
    }
}

public boolean isValid(StringBuilder s, int start, int end) {
    if (start > end) {
        return false;
    }
    if (s.charAt(start) == '0' && start != end) { // 0开头的数字不合法
        return false;
    }
    int num = 0;
    for (int i = start; i <= end; i++) {
        if (s.charAt(i) > '9' || s.charAt(i) < '0') { // 遇到⾮数字字符不合法
            return false;
        }
        num = num * 10 + (s.charAt(i) - '0');
        if (num > 255) { // 如果⼤于255了不合法
            return false;
        }
    }
    return true;
}
```

## 子集问题

相比于 **组合问题** 而言，**子集问题** 的区别是 **不需要添加终止条件了**，因此其实 **子集问题** 处理起来更加简单一下。在树形结构中 **子集问题** 是要 **收集所有节点的结果**，而 **组合问题** 是 **收集叶子节点的结果**。

### 子集

相关题目：

- 78.子集

此题中给出的条件是：**寻找指定数组所有可能的子集**，并没有限制子集满足的条件，因此在使用递归处理的过程中，直接将每次递归的子集结果输出即可，代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();

public List<List<Integer>> subsets(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    backTracking(nums, 0);
    return resList;
}

public void backTracking(int[] nums, int startIndex) {
    // 需要返回所有的子集，因此每次递归处理的结果都加上
    resList.add(new ArrayList<>(tmpList));
    for (int i = startIndex; i < nums.length; i++) {
        tmpList.add(nums[i]);
        backTracking(nums, i + 1);
        tmpList.removeLast();
    }
}
```

> 本题处理的是 **求子集** 问题，因此只要遍历整棵树，将每个节点的值输出即可，**求子集问题就是收集树形结构中所有节点的结果**。
> 
> 而 **组合** 问题、**分割** 问题是 **收集树形结构中叶子节点的结果**，因此需要首先判断节点的值是否满足结果，才能进行输出。

### 子集ii

相关题目：

- 90.子集ii

题目中给出了限定条件：**数组中增加了重复元素，结果集中不能包含重复的子集**。 这与上面出现的：[**40.组合总和ii**] 中给出的条件一样！因此我们需要 **对同一父节点下同层节点进行去重处理**，进行这个处理有两个关键点：

- **对数组进行排序**
- 遍历同层节点时，如果遍历到的节点与之前处理过的节点值相同，不重复处理。

先使用 **哈希表** 来处理，代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();

public List<List<Integer>> subsetsWithDup(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    // 必须要进行排序，不然结果集会出现 {1,2}，{2,1} 这样重复的结果
    Arrays.sort(nums);
    backtracking(nums, 0);
    return resList;
}

public void backtracking(int[] nums, int startIndex) {
    resList.add(new ArrayList<>(tmpList));
    Set<Integer> set = new HashSet<>();
    for (int i = startIndex; i < nums.length; i++) {
        // 树的同层级里，相同的元素直接跳过，防止结果集重复
        if (set.contains(nums[i])) {
            continue;
        }
        tmpList.add(nums[i]);
        set.add(nums[i]);
        backtracking(nums, i + 1);
        tmpList.removeLast();
    }
}
```

使用数组替换哈希表的处理就不贴了，这里再放一下移除额外开辟的 **哈希表/数组** 的解法，代码如下：

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();

public List<List<Integer>> subsetsWithDup(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    Arrays.sort(nums);
    backtracking(nums, 0);
    return resList;
}

public void backtracking(int[] nums, int startIndex) {
    resList.add(new ArrayList<>(tmpList));
    for (int i = startIndex; i < nums.length; i++) {
        // 树的同层级里，相同的元素直接跳过，防止结果集重复
        if (i > startIndex && nums[i] == nums[i - 1]) {
            continue;
        }
        tmpList.add(nums[i]);
        backtracking(nums, i + 1);
        tmpList.removeLast();
    }
}
```

### 递增子序列

相关题目：

- 491.递增子序列

题目中给出的条件是：**找出递增子序列，意味着我们不能对原数组进行排序**。并且题目中给出了限定条件：**数组的元素可能包含重复的，子序列不能相同**。

因此本题的难点是 **在不对原数组进行排序的情况下，对父节点下的同层节点进行去重处理**。上面我们在讲 [**40.组合总和ii**] 中提到过，如果要对 **父节点下的同层节点进行去重处理** 就必须保证 **原数组中相同的元素是相邻的**，如果不是的话，会导致结果集中出现元素顺序排列不同的相同组合，而我们的处理是 **对数组提前排序**。

本题中无法对原数组进行排序，那该如何处理呢？再看一下题目，**在保证原数组顺序的前提下，求递增子序列**，这就意味着我们求得的递增子序列顺序是固定的，递增子序列中元素的先后顺序与其在原数组中的先后顺序一致。因此我们无需关心原数组中元素的先后顺序问题，而每一个 **递增子序列** 在结果集中都是唯一，改变了其中元素的位置，那就不是递增子序列了。因此我们无需担心会出现 `{1, 2}` 、 `{2, 1}` 这样的结果，也就是说，我们可以直接在原数组的基础上进行 **对父节点下的同层子节点去重** 的操作。

代码如下： 

```java
List<List<Integer>> resList = new ArrayList<>();
LinkedList<Integer> tmpList = new LinkedList<>();

public List<List<Integer>> findSubsequences(int[] nums) {
    if (nums == null || nums.length == 0) {
        return resList;
    }
    backtracking(nums, 0);
    return resList;
}

public void backtracking(int[] nums, int startIndex) {
    if (tmpList.size() > 1) {
        resList.add(new ArrayList<>(tmpList));
    }
    // 记录树的相同父节点下同层节点的使用情况，相同父节点下同层节点使用过的节点数值不再重复使用
    Set<Integer> set = new HashSet<>();
    for (int i = startIndex; i < nums.length; i++) {
        if ((!tmpList.isEmpty() && nums[i] < tmpList.getLast())
                || set.contains(nums[i])) {
            continue;
        }
        tmpList.add(nums[i]);
        set.add(nums[i]);
        backtracking(nums, i + 1);
        tmpList.removeLast();
    }
}
```
