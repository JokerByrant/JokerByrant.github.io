---
title: leetcode刷题记录 - 贪心算法(一)
tags:
  - leetcode
  - 贪心
categories: 算法
abbrlink: 56057
date: 2023-08-17 10:43:28
---
> 贪心的本质是选择每一阶段的局部最优，从而达到全局最优。

<!--more-->

在解 **贪心算法** 类的题目时，我们一般遵循下面的步骤就可以了：

1. 将问题分解为若干个子问题
2. 找出适合的贪心策略
3. 求解每一个子问题的最优解
4. 将局部最优解堆叠成全局最优解

## 分发饼干

相关题目：

- 455.分发饼干

有两个思路：

- 从小饼干小胃口开始遍历，找到能满足最小胃口的最小饼干，如果最小的饼干都不能满足最小的胃口，那么这个饼干可以舍弃了，所以我们的外层遍历是对饼干进行的。
- 从大饼干大胃口开始遍历，找到能满足最大饼干的最大胃口。如果最大的饼干都不能满足最大的胃口，那么这个胃口可以舍弃了，所以我们的外层遍历是对胃口进行的。

先看第一种，局部最优：**小饼干喂给胃口小的，充分利用饼干尺寸喂饱一个**，全局最优：**喂饱尽可能多的小孩**。代码如下，优先遍历饼干：

```java
public int findContentChildren(int[] g, int[] s) {
    // 优先考虑饼干，小饼干先喂饱小胃口
    Arrays.sort(g);
    Arrays.sort(s);
    int start = 0;
    int count = 0;
    for (int i = 0; i < s.length && start < g.length; i++) {
        if (s[i] >= g[start]) {
            start++;
            count++;
        }
    }
    return count;
}
```

再看第二种，局部最优：**大饼干喂给胃口大的，充分利用饼干尺寸喂饱一个**，全局最优：**喂饱尽可能多的小孩**。代码如下，优先遍历胃口：

```java
public int findContentChildren(int[] g, int[] s) {
    // 优先考虑胃口，先喂饱大胃口
    Arrays.sort(g);
    Arrays.sort(s);
    int start = s.length - 1;
    int count = 0;
    // 从最大的饼干和最大的胃口开始遍历
    for (int i = g.length - 1; i >= 0 && start >= 0; i--) {
        // 如果当前最大的饼干满足当前孩子的胃口，将这个饼干喂给他
        if (s[start] >= g[i]) {
            // 继续处理下一个饼干
            start--;
            // 结果+1
            count++;
        }
    }
    return count;
}
```

## 摆动序列

相关题目：

- 376.摆动序列

第一种思路，摆动序列的特点是元素在上下波动，相邻的2两个元素一个是波峰元素，一个是波谷元素。那么我们只要在原数组中找存在多少波峰波谷元素，就能知道这个最长摆动序列的长度了。代码如下：

```java
public int wiggleMaxLength(int[] nums) {
    // 从原数组中找到波峰波谷，然后统计数量即可
    int count = 1;
    int prevDiff = 0;
    for (int i = 1; i < nums.length; i++) {
        int curDiff = nums[i] - nums[i - 1];
        // 如果当前差值和上一个差值表现出摆动，那么说明找到了一个波峰/波谷
        if ((curDiff > 0 && prevDiff <= 0) || (curDiff < 0 && prevDiff >= 0)) {
            count++;
            // 这里只有在坡的走向发生变化时，才需要更新prevDiff，因为可能会出现平坡的情况
            prevDiff = curDiff;
        }
    }
    return count;
}
```

延伸一下，本题还可以使用 **动态规划** 来解，由于目前这里看的是 **回溯算法** 相关的题目，因此暂不对 **动态规划** 进行深入，直接看代码：

```java
public int wiggleMaxLength(int[] nums) {
    // 使用动态规划
    int[][] dp = new int[nums.length][2];
    // dp[i][0]代表第i个元素作为波峰的最长摆动序列长度
    // dp[i][1]代表第i个元素作为波谷的最长摆动序列长度
    dp[0][0] = dp[0][1] = 1;

    for (int i = 1; i < nums.length; i++) {
        dp[i][0] = dp[i][1] = 1;
        for (int j = 0; j < i; j++) {
            if (nums[j] > nums[i]) {
                // 第i处位置元素是波谷，那么它作为波谷的最长摆动序列长度就是它之前的元素作为波峰的最长摆动序列长度+1
                dp[i][1] = Math.max(dp[i][1], dp[j][0] + 1);
            }
            if (nums[j] < nums[i]) {
                // i是波峰，同理
                dp[i][0] = Math.max(dp[i][0], dp[j][1] + 1);
            }
        }
    }
    // 拿到其中最长的摆动序列即可
    return Math.max(dp[nums.length - 1][0], dp[nums.length - 1][1]);
}
```

## 最大子数组和

相关题目：

- 53.最大子数组和

使用 **贪心算法** 处理，思路是：**如果前面的子数组的和是负数，那么无论接下来的数是正还是负，这个和一定会拉低总和，因此前面的和直接忽略即可，重新从下一个数开始计算总和。**

代码如下：

```java
public int maxSubArray(int[] nums) {
    // 解法1，使用贪心算法
    // 思路：如果前面的数组的和是负数，那么无论接下来的数是正还是负，这个和一定会拉低总和
    if (nums.length == 1) {
        return nums[0];
    }
    // 用来存储最大和
    int sum = Integer.MIN_VALUE;
    // 用来记录当前连续子数组的和
    int count = 0;
    for (int i = 0; i < nums.length; i++) {
        count += nums[i];
        sum = Math.max(sum, count);
        // 如果前面的子数组总和是负数，那么它一定会拉低下面的数的总和，所以将其重置为0
        if (count < 0) {
            count = 0;
        }
    }
    return sum;
}
```

> 这里以及之后的题目就着重看一下 **贪心算法** 的版本，**动态规划** 的版本在之后学习到 **动态规划** 后再去处理。

## 买卖股票的最佳时机ii

相关题目：

- 122.买卖股票的最佳时机ii

使用 **贪心算法**，思路：

- 前一天买入股票，第二天卖出，那利润就是第二天的价格减去前一天的价格；
- 第 `i` 天买入股票，第 `n` 天卖出，那么利润就是第 `i + 1` 天到第 `n` 天每天利润的和。
- 我们只要拿到每天的利润，然后找出那些利润为正的数据，将它们求和即可拿到最大利润。
- **局部最优：收集每天的正利润；全局最优：得到最大利润。**

代码如下：

```java
public int maxProfit(int[] prices) {
    // 贪心算法
    if (prices.length == 1) {
        return 0;
    }
    int result = 0;
    for (int i = 1; i < prices.length; i++) {
        // 当天价格 - 前一天价格 = 前一天买入当天卖出能获取的利润
        // 第x天买入，第y天卖出，那么利润就是第x+1天到第y天每天利润之和
        // 这里要计算最大利润，那么只需要求出利润为正的那些天即可
        result += Math.max(prices[i] - prices[i - 1], 0);
    }
    return result;
}
```

## K次取反后最大化的数组和

相关题目：

- 1005.K次取反后最大化的数组和

思路如下：

- 先将数组元素按照绝对值大小降序排序。
- 之后对排序后的数组进行遍历，将值为负的元素变为正数。
- 如果处理后 `k` 的值仍然大于 `0` 并且是单数，那么就将数组最后一个元素(绝对值最小的元素)取反。
- 之后求和即可。

代码如下：

```java
public int largestSumAfterKNegations(int[] nums, int k) {
    // 按照元素的绝对值大小降序排序
    nums = Arrays.stream(nums).boxed().sorted((o1, o2) -> Math.abs(o2) - Math.abs(o1)).mapToInt(Integer::intValue).toArray();
    int sum = 0;
    // 按照顺序(先处理较小的负数)，求所有负数的绝对值
    for (int i = 0; i < nums.length; i++) {
        if (k > 0 && nums[i] < 0) {
            nums[i] *= -1;
            k--;
        }
    }
    // 如果最后k是单数，则将最后一个元素(绝对值最小的数)的值取反
    if (k % 2 == 1) {
        nums[nums.length - 1] *= -1;
    }
    return Arrays.stream(nums).sum();
}
```

## 加油站

相关题目：

- 134.加油站

暴力解法：**依次尝试每个加油站作为起点**。此解法无法通过 `leetcode` 的测试，提交时会超时。

代码如下：

```java
public int canCompleteCircuit(int[] gas, int[] cost) {
    // 暴力解法，依次尝试每个索引作为起点
    for (int i = 0; i < gas.length; i++) {
        int gasLeft = gas[i] - cost[i];
        // 以i为起点，环一圈
        int index = (i + 1) % gas.length;
        while (gasLeft > 0 && index != i) {
            gasLeft += gas[index] - cost[index];
            index = (index + 1) % gas.length;
        }
        // 如果环完一圈，油还有剩余，那么表示有解，返回索引
        if (gasLeft >= 0 && index == i) {
            return i;
        }
    }
    return -1;
}
```

使用 **贪心算法** 处理，思路：

- 从第一个加油站开始遍历，计算走完每个加油站后的剩余油量，如果在第 `i` 个加油站剩余油量小于 `0` 了，那么说明前 `i` 个加油站无法作为起点。
- 那么只能从第 `i + 1` 个加油站开始继续寻找，如果最后所有加油站都遍历完后，剩余油量小于 `0`，那么说明肯定无法走完一圈。

代码如下：

```java
public int canCompleteCircuit(int[] gas, int[] cost) {
    // 贪心算法
    int curSum = 0;
    int totalSum = 0;
    int start = 0;
    for (int i = 0; i < gas.length; i++) {
        curSum += gas[i] - cost[i];
        totalSum += gas[i] - cost[i];
        // 如果当前累加的剩余油量小于0，说明如果从第i个加油站之前开始出发，那碰到第i个加油站时一定会出现油量不足的情况
        // 将起点重置为第i+1个加油站，然后进行判断后续加油站是否满足条件
        if (curSum < 0) {
            start = i + 1;
            curSum = 0;
        }
    }
    // 如果走完所有加油站，剩余油量小于0，说明肯定无法走完一圈
    if (totalSum < 0) {
        return -1;
    }
    return start;
}
```

## 柠檬水找零

相关题目：

- 860.柠檬水找零

思路如下：

- 第一个客户如果付的不是5元面额的，那么肯定不满足。
- 找零有3种情况：客户付的10元，可以找零一张5元；客户付的20元，可以找零一张10元和一张5元，或者找零三张5元。**因此我们维护两个变量来记录当前剩余的5元和10元数量即可。**

代码如下：

```java
public boolean lemonadeChange(int[] bills) {
    if (bills[0] != 5) {
        return false;
    }
    int left_5 = 0;
    int left_10 = 0;
    for (int i = 0; i < bills.length; i++) {
        if (bills[i] == 5) {
            left_5++;
        }
        if (bills[i] == 10) {
            // 找零一张5元
            left_5--;
            left_10++;
        }
        if (bills[i] == 20) {
            if (left_10 > 0) {
                // 找零一张10元和一张5元
                left_10--;
                left_5--;
            } else {
                // 找零三张5元
                left_5 -= 3;
            }
        }
        // 最后统一判断，如果5元和10元面额小于0，那么表示无法正确找零
        if (left_5 < 0 || left_10 < 0) {
            return false;
        }
    }
    return true;
}
```

## 单调递增的数字

相关题目：

- 738.单调递增的数字

思路：

- 先要将数字中各个位数的数分隔出来。
- 然后遍历分隔后的数组，如果位数较大的数 `i` 比位数较小的数 `j` 要大，那么 `i` 减一，`j` 置为 `9`。这里如果触发需要将位数较小的数置为 `9` 的操作，那么所有比 `i` 位数小的数都要被置为 `9`，因此我们可以先记录一下 `i` 的位置，后面统一将小于 `i` 位数的数置为 `9`。

代码如下：

```java
public int monotoneIncreasingDigits(int n) {
    // 将原数字的每一位都提出来，个位放最前面
    List<Integer> list = new ArrayList<>();
    while (n > 0) {
        list.add(n % 10);
        n = n / 10;
    }
    int start = 0;
    for (int i = 1; i < list.size(); i++) {
        if (list.get(i) > list.get(i - 1) ) {
            // 位数较大的数比位数较小的数还要大，那么位数较大的数减一
            list.set(i, list.get(i) - 1);
            // 剩下位数较小的数后面都置为9，这里记录一下开始记录的位置
            // 注意，这里不能直接将i-1置为9，因为可能i-2和i-3也需要被置为9，因此这里先记录，后面再处理
            start = i;
        }
    }
    // 位数较小的数都置为9
    for (int i = 0; i < start; i++) {
        list.set(i, 9);
    }
    // 计算结果
    int result = 0;
    int flag = 1;
    for (int i = 0; i < list.size(); i++) {
       result += list.get(i) * flag;
       flag *= 10;
    }
    return result;
}
```
