---
title: leetcode刷题记录 - 数组篇
tags: leetcode
categories: 算法
abbrlink: 1435
date: 2023-07-13 11:49:57
---

最近在跟着 [代码随想录](https://www.programmercarl.com/) 刷 `leetcode` 上的算法题，刷了一段时间数组相关的题目，感觉这种按照某个知识点来刷题的方法效率比较高，但是隔段时间不刷过后又会将解题方法忘记，因此这里将解题的思路和方法记录一下。这是第一篇，数组篇。

<!--more-->

## 二分查找

时间复杂度：O(logn)

相关题目：

*   704.二分查找
*   35.搜索插入位置
*   34.在排序数组中查找元素的第一个和最后一个位置
*   69.x 的平方根
*   367.有效的完全平方数

解题思路：首先需要确定题目的条件是否满足二分查找，使用二分查找的前提是 **数组为有序数组，并且数组中无重复元素**，因为一旦有重复元素，使用二分查找法返回的元素下标可能不是唯一的。之后还有一个关键点是 **边界条件的确定**，有两种边界写法：**左闭右开、左闭右闭**，这两种写法都是可行的。

以 **\[704.二分查找]** 这题为例，分别列一下两种写法。

```java
// 二分法(左闭右闭 - [left, right])
public int search(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    // 当left==right，区间[left, right]依然有效，所以用 <=
    while (left <= right) {
        int middle = left + ((right - left) / 2);
        if (nums[middle] > target) {
            // target在左区间 [left, middle - 1]
            right = middle - 1;
        } else if (nums[middle] < target) {
            // target在右区间 [middle + 1, right]
            left = middle + 1;
        } else {
            return middle;
        }
    }
    return -1;
}

// 二分法(左闭右开 - [left, right)
public int search(int[] nums, int target) {
    int left = 0;
    // 右开区间，因此right所在索引不能被访问到
    int right = nums.length;
    // 当left==right，在区间[left, right)是无效空间，所以用 <
    while (left < right) {
        int middle = left + ((right - left) / 2);
        if (nums[middle] > target) {
            // target在左区间 [left, middle)
            right = middle;
        } else if (nums[middle] < target) {
            // target在右区间 [middle + 1, right)
            left = middle + 1;
        } else {
            return middle;
        }
    }
    return -1;
}
```

## 双指针法

时间复杂度：O(n)。

相关题目：

*   27.移除元素
*   26.删除排序数组中的重复项
*   283.移动零
*   844.比较含退格的字符串
*   977.有序数组的平方

双指针法（快慢指针法）： **通过一个快指针和慢指针在一个 `for` 循环下完成两个 `for` 循环的工作。**

*   快指针：寻找新数组的元素 ，新数组就是不含有目标元素的数组
*   慢指针：指向更新新数组下标的位置

以 **\[27.移除元素]** 为例，解法如下：

```java
// 快慢指针
public int removeElement(int[] nums, int val) {
    int slowIndex = 0;
    for (int fastIndex = 0; fastIndex < nums.length; fastIndex++) {
        if (nums[fastIndex] != val) {
            nums[slowIndex] = nums[fastIndex];
            slowIndex++;
        }
    }
    return slowIndex;
}

// 相向双指针
public int removeElement(int[] nums, int val) {
    // 相向双指针法(题目中描述，元素的顺序可以改变)
    int leftIndex = 0;
    int rightIndex = nums.length - 1;
    while (leftIndex <= rightIndex) {
        // 从左寻找等于目标值的数组索引
        while (leftIndex <= rightIndex && nums[leftIndex] != val) {
            leftIndex++;
        }
        // 从右寻找不等于目标值的数组索引
        while (leftIndex <= rightIndex && nums[rightIndex] == val) {
            rightIndex--;
        }
        // 将 [右边不等于目标值的元素] 移动到 [左边等于目标值的元素] 所在位置
        if (leftIndex < rightIndex) {
            nums[leftIndex] = nums[rightIndex];
            // 左边指针右移
            leftIndex++;
            // 右边指针左移
            rightIndex--;
        }
    }
    return leftIndex;
}
```

## 滑动窗口

时间复杂度：O(n)。

相关题目：

*   209.长度最小的子数组
*   904.水果成篮
*   76.最小覆盖子串

所谓滑动窗口，\*\*就是不断的调节子序列的起始位置和终止位置，从而得出我们要想的结果。\*\*确定一个滑动窗口需要两个指针，开始指针和结束指针，其中结束指针就是遍历数组的指针，而开始指针则决定了这个窗口内元素的构成，因此解题的关键在于 **确定开始指针如何移动**。

以 **\[209.长度最小的子数组]** 为例，解法如下：

```java
public int minSubArrayLen(int target, int[] nums) {
    // 滑动窗口
    int left = 0;
    int sum = 0;
    int result = Integer.MAX_VALUE;
    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];
        while (sum >= target) {
            // 取数组长度较小的那一个
            result = Math.min(result, right - left + 1);
            // 开始指针的移动时机
            // 缩小滑动窗口，左边界右移，右移后窗口的值重新计算
            sum -= nums[left++];
        }
    }
    return result == Integer.MAX_VALUE ? 0 : result;
}
```

再来看一下 **\[904.水果成篮]** 这题：

> 你正在探访一家农场，农场从左到右种植了一排果树。这些树用一个整数数组 fruits 表示，其中 fruits\[i] 是第 i 棵树上的水果 **种类** 。
>
> 你想要尽可能多地收集水果。然而，农场的主人设定了一些严格的规矩，你必须按照要求采摘水果：
>
> *   你只有 **两个** 篮子，并且每个篮子只能装 **单一类型** 的水果。每个篮子能够装的水果总量没有限制。
> *   你可以选择任意一棵树开始采摘，你必须从 **每棵** 树（包括开始采摘的树）上 **恰好摘一个水果** 。采摘的水果应当符合篮子中的水果类型。每采摘一次，你将会向右移动到下一棵树，并继续采摘。
> *   一旦你走到某棵树前，但水果不符合篮子的水果类型，那么就必须停止采摘。
>
> 给你一个整数数组 fruits ，返回你可以收集的水果的 **最大** 数目。
>
> **提示：**
>
> *   1 <= fruits.length <= 105
> *   0 <= fruits\[i] < fruits.length

分析一下题目中的元素，首先确定一下滑动窗口内的元素是 **两种不同种类的水果树**，这里需要一个变量来记录滑动窗口内的元素，那么滑动窗口内的元素该使用什么数据结构呢？之后窗口向右移动，我们需要保证窗口内只有两种水果树，如果出现了3种水果树，那么就需要 **从左向右依次遍历** 将水果树剔除，直至只包含两种水果树。因此，我们需要一个可以记录 **水果树种类和数量的数据结构**，第一个想到的是 `Map` 类型的结构，`key` 中存放水果树类型，`value` 中存放该种类型水果树的数量。代码如下：

```java
public int totalFruit(int[] fruits) {
    // 滑动窗口
    int left = 0;
    int result = 0;
    // 这里创建一个Map，key是水果种类(fruits数组的值)，value是对应种类出现的个数
    Map<Integer, Integer> map = new HashMap<>();
    // 再记录一下目前窗口内的水果种类数量
    int count = 0;
    for (int right = 0; right < fruits.length; right++) {
        int currentCount = map.getOrDefault(fruits[right], 0);
        map.put(fruits[right], ++currentCount);
        if (currentCount == 1) {
            count++;
        }
        // 保证窗口内只有两种水果
        while (count > 2) {
            // 滑动窗口左边界右移
            int leftCount = map.getOrDefault(fruits[left], 0);
            map.put(fruits[left], --leftCount);
            if (leftCount == 0) {
                map.remove(fruits[left]);
                count--;
            }
            left++;
        }
        result = Math.max(result, right - left + 1);
    }
    return result;
}
```

之后再看一下题目中的限定条件：`0 <= fruits[i] < fruits.length`，意思是 **果树的种类最多有 `fruits.length` 种**，因此可以进一步优化：\*\*将 `Map` 替换为数组，数组的索引是水果种类(fruits数组的值)，值是对应种类出现的个数。\*\*代码如下：

```java
public int totalFruit(int[] fruits) {
    // 滑动窗口
    int left = 0;
    int result = 0;
    // 题目中定义了条件：fruits数组中元素的大小不会超过fruits数组的长度
    // 这里创建一个数组，数组的索引是水果种类(fruits数组的值)，值是对应种类出现的个数
    int[] freq = new int[fruits.length];
    // 再记录一下目前窗口内的水果种类数量
    int count = 0;
    for (int right = 0; right < fruits.length; right++) {
        freq[fruits[right]]++;
        if (freq[fruits[right]] == 1) {
            count++;
        }
        // 保证窗口内只有两种水果
        while (count > 2) {
            // 滑动窗口左边界右移
            freq[fruits[left]]--;
            if (freq[fruits[left]] == 0) {
                count--;
            }
            left++;
        }
        result = Math.max(result, right - left + 1);
    }
    return result;
}
```

## 螺旋矩阵

相关题目：

*   59.螺旋矩阵II
*   54.螺旋矩阵

这题不涉及什么特殊的算法，主要考研模拟过程的能力，直接上代码：

```java
public int[][] generateMatrix(int n) {
    int[][] result = new int[n][n];
    int currentX = 0, currentY = 0;
    // 用来记录边切换的次数，正方形在缩小，这个次数用作对下标值的补偿
    int loop = 0;
    for (int count = 1; count <= n * n; count++) {
        result[currentX][currentY] = count;
        if (count == n * n) {
            break;
        }
        // 每次边发生切换时，loop+1
        if ((count + loop) % n == 0) {
            loop++;
        }
        while (true) {
            int x = currentX, y = currentY;
            switch ((count + loop) / n % 4) {
                // 左->右
                case 0: y++; break;
                // 上->下
                case 1: x++; break;
                // 右->左
                case 2: y--; break;
                // 下->上
                case 3: x--; break;
            }
            if (result[x][y] != 0) {
                // 如果下一组数据不为0，表示数据已经填充过了，则切换边。
                loop++;
            } else {
                // 如果下一组数据为0，则正常更新坐标
                currentX = x;
                currentY = y;
                break;
            }
        }
    }
    return result;
}
```

