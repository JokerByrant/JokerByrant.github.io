---
title: leetcode刷题记录 - 贪心算法(二)
tags:
  - leetcode
  - 贪心
categories: 算法
abbrlink: 6749
date: 2023-08-24 11:43:28
---

> 上一篇中通过一些题目对贪心算法有了一定的了解，本篇中重点看两种特定类型的贪心题目：两个维度权衡问题、区间问题。

<!--more-->

## 两个维度权衡问题

这类题目给出的条件会包含两个维度，而在使用 **贪心算法** 处理时，我们要对两个维度分别处理。

### 分发糖果

相关题目：

- 135.分发糖果

使用 **贪心算法** 处理，思路如下：

- 先从左向右遍历，比较右孩子的评分大于左孩子的情况，满足的话将 [左孩子的糖果数量加一后的值] 作为右孩子的糖果数量。
- 之后再从右向左遍历，比较左孩子的评分大于右孩子的情况，满足的话比较 [左糖果数量加一后的值] 和 [原左孩子的值]，取其中较大的那个作为左孩子的值。

代码如下：

```java
public int candy(int[] ratings) {
    // 贪心算法
    // 先从左向右遍历，找到右孩子大于左孩子的情况
    int[] candyArr = new int[ratings.length];
    candyArr[0] = 1;
    for (int i = 1; i < ratings.length; i++) {
        if (ratings[i] > ratings[i - 1]) {
            candyArr[i] = candyArr[i - 1] + 1;
        } else {
            candyArr[i] = 1;
        }
    }
    // 再从右向左遍历，找到左孩子大于右孩子的情况
    for (int i = ratings.length - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i + 1]) {
            candyArr[i] = Math.max(candyArr[i], candyArr[i + 1] + 1);
        }
    }
    return Arrays.stream(candyArr).sum();
}
```

### 根据身高重建队列

相关题目：

- 406.根据身高重建队列

本题有两个维度：`k` 和 `h`，在使用 **贪心算法** 处理这种多维度的数据时，要将多个维度分别处理：

- 本题中考虑先对身高进行处理，对身高进行排序：身高高的站前面，身高相同 `k` 更小的站前面。
- 排序完成后，对 `k` 这个维度进行处理，按照排序后的顺序将元素插入到新的数组即可，插入的位置就是 `k` 对应的值。
- 这里可能有些难理解，举个例子，比如现在有个元素 `[5, 2]`，按照身高排序完后，这个 `[5, 2]` 的前面几个元素身高都大于 `5`，而 `[5, 2]` 表示它前面应该有两个身高大于等于它的元素，因此直接将其插入到目标数组下标为 `2` 的位置即可，插入之后它前面有两个元素，身高一定大于等于它，满足条件。

代码如下：

```java
public int[][] reconstructQueue(int[][] people) {
    // 先按照身高进行排序
    Arrays.sort(people, (a, b) -> {
        // 身高相同的k小的站前面
        if (a[0] == b[0]) {
            return a[1] - b[1];
        }
        // 身高高的站前面
        return b[0] - a[0];
    });
    // 排序后的数组按照顺序执行插入操作，插入的下标是对应的k
    LinkedList<int[]> list = new LinkedList<>();
    for (int[] arr : people) {
        list.add(arr[1], arr);
    }
    return list.toArray(new int[people.length][]);
}
```

## 区间问题

区间问题一般是要找 **重叠区间** 或 **不重叠区间**，我们要注意的是区间边界的移动。

### 跳跃游戏

相关题目：

- 55.跳跃游戏

**贪心算法**，本题的思路是：

- 对数组元素进行遍历，遍历的范围是 **当前以及之前的元素可以访问的最大范围**，这个范围随着遍历的进行应该是不断变更的。
- 具体的代码实现类似双指针，左指针不断遍历数组元素，右指针用来确定当前可以访问的最大范围。
- **局部最优：每次最大跳跃步数(覆盖范围)；整体最优：得到整体最大覆盖范围，看是否能到终点。**

代码如下：

```java
public boolean canJump(int[] nums) {
    // 贪心算法
    if (nums.length == 1) {
        return true;
    }
    int coverRange = 0;
    // 相当于使用了双指针
    // 左指针不断遍历数组元素，右指针用来确定当前可以访问的最大范围
    for (int i = 0; i <= coverRange; i++) {
        // 获取当前可以覆盖的最大范围
        coverRange = Math.max(coverRange, i + nums[i]);
        // 如果最大可访问范围超过数组长度，那么返回true
        if (coverRange >= nums.length - 1) {
            return true;
        }
    }
    return false;
}
```

### 跳跃游戏ii

相关题目：

- 45.跳跃游戏ii

贪心算法，思路如下：

- 要求的结果是最小步数，那么我们要保证每一步都要充分利用。找到每一步可以覆盖的最大范围，如果当前覆盖范围不能达到数组重点，那么将范围内的元素遍历一遍，找下一步可以覆盖的最大范围。
- 当前范围的元素遍历完毕后，步数加一，进入下一个范围，重复上面的过程。
- **局部最优：求当前这一步的最大覆盖范围，将覆盖范围内的元素遍历一遍，这是一步；整体最优：到达终点，步数最少。**

代码如下：

```java
public int jump(int[] nums) {
    if (nums.length == 1) {
        return 0;
    }
    // 贪心算法
    // 走的最大步数
    int step = 0;
    // 当前覆盖的最远距离下标
    int currentCoverRange = 0;
    // 下一步覆盖的最远距离下标
    int nextCoverRange = 0;
    for (int i = 0; i < nums.length; i++){
        // 记录下一次可以跳跃到的最大元素下标
        nextCoverRange = Math.max(nextCoverRange, nums[i] + i);
        // 到达当前覆盖的最远距离下标
        if (i == currentCoverRange) {
            // 进入到下一个覆盖范围
            currentCoverRange = nextCoverRange;
            // 发生跳跃，步数加一
            step++;
            // 如果当前的覆盖范围包括终点，那么说明找到了最小跳跃次数
            if (currentCoverRange >= nums.length - 1) {
                break;
            }
        }
    }
    return step;
}
```

### 用最少数量的箭引爆气球

相关题目：

- 452.用最少数量的箭引爆气球

其实本题就是要找坐标 **有重叠** 的坐标有几处，代码如下：

```java
public int findMinArrowShots(int[][] points) {
    Arrays.sort(points, (a, b) -> Integer.compare(a[0], b[0]));
    int count = 1;
    for (int i = 1; i < points.length; i++) {
        // 气球i和气球i-1没有重叠的坐标，需要的箭加一
        if (points[i][0] > points[i - 1][1]) {
            count++;
        } else {
            // 更新重叠气球的最小右边界，这样如果第i+1个气球想要与当前两个气球重叠，那么它的左边界就必须小于等于这个最小右边界
            points[i][1] = Math.min(points[i - 1][1], points[i][1]);
        }
    }
    return count;
}
```

### 无重叠区间

相关题目：

- 435.无重叠区间

与上一题的思路类似，题目要求将 [**重叠区间的重叠部分**] 移除，返回 [**被移除的重叠区间**] 的数量，那么要求结果也就是 [**重叠区间**] 的数量，我们可以先找 [**不重叠区间**] 的数量，然后用 [**总的区间**] 数量减去 [**不重叠区间数量**] 即可。

代码如下：

```java
public int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    int count = 1;
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= intervals[i - 1][1]) {
            // count中记录不重合区间的数量
            count++;
        } else {
            // 更新重叠区间的最小右边界
            intervals[i][1] = Math.min(intervals[i - 1][1], intervals[i][1]);
        }
    }
    return intervals.length - count;
}
```

### 划分字母区间

相关题目：

- 763.划分字母区间

思路如下：

- 先统计每个字符最远出现的位置。
- 之后顺序遍历字符串，并同步的更新当前字符片段的最大右边界。
- 如果遍历的元素下标到达了当前的最大右边界，那么说明一个字符片段遍历结束，记录当前字符片段的长度。

代码如下：

```java
public List<Integer> partitionLabels(String s) {
    List<Integer> list = new LinkedList<>();
    // 先统计每个字符最远出现的位置
    int[] position = new int[27];
    for (int i = 0; i < s.length(); i++) {
        position[s.charAt(i) - 'a'] = i;
    }
    // 之后遍历整个字符串
    int preFarthestPosition = -1;
    int farthestPosition = 0;
    for (int i = 0; i < s.length(); i++) {
        // 找最大右边界
        farthestPosition = Math.max(farthestPosition, position[s.charAt(i) - 'a']);
        // 遍历到了最大右边界，找到一个片段
        if (i == farthestPosition) {
            list.add(farthestPosition - preFarthestPosition);
            // 记录上一个最大右边界，方便计算字符片段长度
            preFarthestPosition = farthestPosition;
        }
    }
    return list;
}
```

### 合并区间

相关题目：

- 56.合并区间

代码如下：

```java
public int[][] merge(int[][] intervals) {
    List<int[]> list = new LinkedList<>();
    // 先对数组进行排序，升序
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    // 记录左区间和右区间
    int left = intervals[0][0];
    int right = intervals[0][1];
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] > right) {
            // 第i个区间与上个区间不重叠，则记录上个区间的范围
            list.add(new int[]{left, right});
            left = intervals[i][0];
        }
        right = Math.max(intervals[i][1], right);
    }
    // 最后一个区间
    list.add(new int[]{left, right});
    return list.toArray(new int[list.size()][]);
}
```

## 监控二叉树

相关题目：

- 968.监控二叉树

本题是 **贪心算法** 和 **二叉树** 两个知识点交叉的题目。

思路：

- 首先要确定节点的状态，有三种：0->未被覆盖，1->已安装摄像头，2->已被覆盖。
- 接着在确定遍历方向，安装摄像头要从叶子节点开始，这样才能达到最优。因此使用后序遍历处理。
- 维护一个变量用来存储当前已安装摄像头的数量。
- 然后按照递归函数三部曲来处理：
  - 返回值应该是节点的三种状态。
  - 终止条件是碰到空节点。这时要确定这种状态的返回值：首先空节点不可能是有摄像头的状态；接着，为了让摄像头的数量最少，那我们就应该尽量让叶子节点的父节点安装摄像头，然后如果空节点是无覆盖的情况，那我们就要在它的父节点(叶子节点)上装摄像头了，这样叶子节点的的父节点就无法安装摄像头了。因此遇到空节点时，我们返回状态：2->已被覆盖。
  - 接着确定单层递归逻辑，根据当前节点左右子节点的状态进行判断：①.如果左右子节点都被覆盖了，那么当前节点是无覆盖状态，返回 0；②.如果左右子节点其中任何一个未被覆盖，那么当前节点就要装摄像头，已安装摄像头数量加一，结果返回1；③.如果左右子节点其中任何一个装了摄像头，那么当前节点应该是已被覆盖状态，返回2.

具体代码如下：

```java
int res = 0;
public int minCameraCover(TreeNode root) {
    if (minCame(root) == 0) {
        res++;
    }
    return res;
}

/**
 * 返回值
 * 0 -> 无覆盖
 * 1 -> 有摄像头
 * 2 -> 有覆盖
 * @param node
 * @return
 */
public int minCame(TreeNode node) {
    if (node == null) {
        // 空节点默认有覆盖，避免在叶子节点上放摄像头
        return 2;
    }
    int left = minCame(node.left);
    int right = minCame(node.right);

    if (left == 2 && right == 2) {
        // 左右子节点都被覆盖了的话，当前节点应该是无覆盖
        return 0;
    }
    if (left == 0 || right == 0) {
        // 如果左右子节点中有任何一个没有被覆盖，那当前节点就要加一个摄像头
        res++;
        return 1;
    }
    if (left == 1 || right == 1) {
        // 如果左右子节点其中任何一个有摄像头，那么当前节点就是被覆盖状态
        return 2;
    }
    // 注：上面三个if-else已经将所有情况的涵盖进来了，代码不会走到这里
    return -1;
}
```
