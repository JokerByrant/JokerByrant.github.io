---
title: leetcode刷题记录 - 哈希表
tags: leetcode
categories: 算法
abbrlink: 8582
date: 2023-07-18 11:51:34
---

> 当我们需要 **查询一个元素是否出现过，或者一个元素是否在集合里的时候**，就要第一时间想到 **哈希法**。
>
> 哈希法是牺牲了空间换取了时间。

<!--more-->

### 有效的字母异位词

相关题目：

*   242.有效的字母异位词
*   383.赎金信
*   49.字母异位词分组
*   438.找到字符串中所有字母异位词

如果题目中给出了限定条件，哈希表的大小在有限的范围内，那么就可以考虑使用数组来处理，因为 **数组就是简单的哈希表，但是数组的大小可不是无限开辟的**。并且相比 `Map` 而言，\*\*使用数组消耗的空间相对要小一些，因为 `Map` 要维护红黑树或者哈希表，而且还要做哈希函数，是费时的！\*\*数据量大的话就能体现出来差别了。

比如上面提到的几题，题目中都给出了限定条件：**仅包含小写字母**。这就意味着哈希表的长度最大为26，因此可以考虑使用数组处理。

**\[242.有效的字母异位词]** ，代码如下：

```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) {
        return false;
    }
    // 数组就是简单的哈希表，只不过数组的大小是固定的。又因为题中表示s和t仅包含小写字母，所以限定数组长度为26即可
    int[] record = new int[26];
    for (int i = 0; i < s.length(); i++) {
        // 求出字符的相对值作为索引
        int index = s.charAt(i) - 'a';
        // 出现次数加一
        record[index]++;
    }
    for (int i = 0; i < t.length(); i++) {
        int index = t.charAt(i) - 'a';
        record[index]--;
    }
    for (int i : record) {
        if (i != 0) {
            return false;
        }
    }
    return true;
}
```

**\[383.赎金信]** 代码如下：

```java
public boolean canConstruct(String ransomNote, String magazine) {
    if (magazine.length() < ransomNote.length()) {
        return false;
    }
    // 先记录目标字符串中字符出现次数
    int[] record = new int[26];
    for (int i = 0; i < ransomNote.length(); i++) {
        int index = ransomNote.charAt(i) - 'a';
        record[index]++;
    }
    for (int i = 0; i < magazine.length(); i++) {
        int index = magazine.charAt(i) - 'a';
        record[index]--;
    }
    for (int i : record) {
        if (i > 0) {
            return false;
        }
    }
    return true;
}
```

**\[49.字母异位词分组]**，先按照常规的思路来解题：\*\*对每个字符串进行比较，比较它们的字符穿线个数是否相等；引入一个布尔类型的数组，用来记录已经输出的字符串，防止重复遍历。\*\*代码如下：

```java
public List<List<String>> groupAnagrams(String[] strs) {
    // 时间复杂度：O(N^2 * K)
    List<List<String>> result = new ArrayList<>();
    boolean[] used = new boolean[strs.length];
    for (int index = 0; index < strs.length; index++) {
        // 已经遍历过的字符串直接跳过
        if (!used[index]) {
            List<String> tmpList = new ArrayList<>();
            tmpList.add(strs[index]);
            // 遍历后续的字符
            for (int j = index + 1; j < strs.length; j++) {
                if (!used[j] && isSame(strs[index], strs[j])) {
                    used[j] = true;
                    tmpList.add(strs[j]);
                }
            }
            result.add(tmpList);
        }
    }
    return result;
}

public boolean isSame(String str1, String str2) {
    if (str1.length() != str2.length()) {
        return false;
    }
    int[] cnt = new int[26];
    for (int i = 0; i < str1.length(); i++) {
        cnt[str1.charAt(i) - 'a']++;
    }
    for (int i = 0; i < str2.length(); i++) {
        if (--cnt[str2.charAt(i) - 'a'] < 0) {
            return false;
        }
    }
    return true;
}
```

上面一种解法，优化了很多次才通过 `leetcode` 的提交，虽然使用了布尔类型数组来防止重复遍历，但是极端情况下还是会出现字符重复遍历的情况，比如所有字符串自成一类时，时间复杂度就是 O(n^2 \* k)。因此这里使用另一种解法，对字符进行排序，然后哈希表的键存放排序后的字符串，代码如下：

```java
public List<List<String>> groupAnagrams(String[] strs) {
    // 时间复杂度：O(n * klogk)
    Map<String, List<String>> map = new HashMap<>();
    for (int i = 0; i < strs.length; i++) {
        char[] chars = strs[i].toCharArray();
        // 对字符进行排序
        Arrays.sort(chars);
        String str = String.valueOf(chars);
        // key中存放排序后的字符串
        List<String> tmpList = map.getOrDefault(str, new ArrayList<>());
        tmpList.add(strs[i]);
        map.put(str, tmpList);
    }
    return new ArrayList<>(map.values());
}
```

**\[438.找到字符串中所有字符异位词]**，这道题可以使用滑动窗口来解答，需要保证 **窗口内的字符串是目标字符串的异位词**，代码如下：

```java
public List<Integer> findAnagrams(String s, String p) {
    List<Integer> result = new ArrayList<>();
    int right = p.length();
    for (int left = 0; left <= s.length() - p.length(); left++) {
        if (isEquals(s.substring(left, right), p)) {
            result.add(left);
        }
        right++;
    }
    return result;
}

public boolean isEquals(String input, String target) {
    int[] record = new int[26];
    for (int i = 0; i < input.length(); i++) {
        record[input.charAt(i) - 'a']++;
    }
    for (int i = 0; i < target.length(); i++) {
        if (--record[target.charAt(i) - 'a'] < 0) {
            return false;
        }
    }
    return true;
}
```

上面的解法每次移动窗口，都要对窗口内的所有字符重新进行统计，但实际上每次移动窗口只有窗口最左边和最右边的两个字符发生了变化，因此可以进行如下优化。提前统计子串中的字符，每次移动窗口，只针对变化的字符进行对窗口内的字符进行调整，代码如下：

```java
public List<Integer> findAnagrams(String s, String p) {
    List<Integer> result = new ArrayList<>();
    int[] c1 = new int[26], c2 = new int[26];
    for (int i = 0; i < p.length(); i++) {
        c2[p.charAt(i) - 'a']++;
    }
    for (int l = 0, r = 0; r < s.length(); r++) {
        c1[s.charAt(r) - 'a']++;
        // 移动窗口
        if (r - l + 1 > p.length()) {
            c1[s.charAt(l++) - 'a']--;
        }
        if (isEquals(c1, c2)) {
            result.add(l);
        }
    }
    return result;
}

public boolean isEquals(int[] c1, int[] c2) {
    for (int i = 0; i < 26; i++) {
        if (c1[i] != c2[i]) {
            return false;
        }
    }
    return true;
}
```

### 两个数组的交集

相关题目：

*   349.两个数组的交集
*   350.两个数组的交集II

如果题目中没有给出了限定条件，哈希表的大小无法确定或者比较大，并且如果哈希值比较少、特别分散、跨度非常大，使用数组就造成空间的极大浪费，此时就要考虑使用 `Set` 来处理了。在 `Java` 中，几个常用的 `Set` 的底层都是 `Map` 实现的，如下：

```java
public TreeSet() {
    this(new TreeMap<E,Object>());
}

public HashSet() {
    map = new HashMap<>();
}
```

**\[349.两个数组的交集]**，代码如下：

```java
public int[] intersection(int[] nums1, int[] nums2) {
    Set<Integer> set = new HashSet<>();
    Set<Integer> result = new HashSet<>();
    for (int num : nums1) {
        set.add(num);
    }
    for (int num : nums2) {
        if (set.contains(num)) {
            result.add(num);
        }
    }
    return result.stream().mapToInt(x -> x).toArray();
}
```

**\[350.两个数组的交集II]**，代码如下：

```java
public int[] intersect(int[] nums1, int[] nums2) {
    List<Integer> result = new ArrayList<>();
    Map<Integer, Integer> map = new HashMap<>();
    // 统计nums1中元素出现次数
    for (int num : nums1) {
        map.put(num, map.getOrDefault(num, 0) + 1);
    }
    // 统计nums2中元素出现次数
    for (int num : nums2) {
        Integer value = map.getOrDefault(num, 0);
        if (value != 0) {
            map.put(num, value - 1);
            result.add(num);
        }
    }
    return result.stream().mapToInt(x -> x).toArray();
}
```

### 快乐数

相关题目：

*   202.快乐数

直接看代码，解题的关键都在注释中：

```java
public boolean isHappy(int n) {
    // 此题的关键在于，理解题意，题中标注 "无限循环"，也就是说求和过程中sum会重复出现
    // 为什么一定会重复出现呢，题中给了限定条件 [1 <= n <= 2^31 - 1]，这个值是 `2147483647`
    // 最大值是10位，我们多取一位：99999999999的下一位数是 9*9*11=891
    // 也就是说，sum的值是在有限的范围内循环，因此肯定会发生重复的情况
    // 那么只要记录一下求和的结果，然后如果发现结果重复了，就不满足条件
    Set<Integer> record = new HashSet<>();
    while (n != 1 && !record.contains(n)) {
        record.add(n);
        n = getNextNum(n);
    }
    return n == 1;
}

public int getNextNum(int n) {
    int res = 0;
    while (n > 0) {
        int temp = n % 10;
        res += temp * temp;
        n = n / 10;
    }
    return res;
}
```

### 两数之和

相关题目：

*   1.两数之和

因为要找元素的下标，因此利用哈希表，`key` 中放数组中的元素，`value` 放元素对应的下标，代码如下：

```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int temp = target - nums[i];
        Integer index = map.get(temp);
        if (index != null) {
            return new int[]{index, i};
        } else {
            map.put(nums[i], i);
        }
    }
    return new int[2];
}
```

还可以对循环进一步优化，使用双指针遍历数组元素，代码如下：

```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    int left = 0;
    int right = nums.length - 1;
    while (left <= right) {
        int ln = nums[left];
        int rn = nums[right];
        int ln1 = target - ln;
        int rn1 = target - rn;
        if (map.containsKey(ln1)) {
            return new int[]{left, map.get(ln1)};
        } else {
            map.put(ln, left++);
        }
        if (map.containsKey(rn1)) {
            return new int[]{right, map.get(rn1)};
        } else {
            map.put(rn, right--);
        }
    }
    return new int[0];
}
```

### 四数相加II

相关题目：

*   454.四数相加II

在确定了要使用哈希表解题时，首先要确定的哈希表中放的是什么，以及哈希表的 `key` 和 `value` 存放的是什么。本题中，存在4个数组，4个数组中元素之和，第一时间想到的就是4个循环进行嵌套，但这样时间复杂度就是 O(n^4)，因此需要优化。可以将这四个数组两两分组，第一组中的元素之和以及和出现的次数存放到哈希表中，另一组之和与哈希表中的数据进行比对，这样时间复杂度就降到了 O(n^2)，代码如下：

```java
public int fourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4) {
    int result = 0;
    // key中放nums1和nums2数组中各个元素的和，value中放它们和出现的次数
    Map<Integer, Integer> map = new HashMap<>();
    for (int num1 : nums1) {
        for (int num2 : nums2) {
            map.put(num1 + num2, map.getOrDefault(num1 + num2, 0) + 1);
        }
    }
    for (int num3 : nums3) {
        for (int num4 : nums4) {
            // 找nums3和nums4中元素和等于nums1和nums2元素和负数的值
            result += map.getOrDefault(-(num3 + num4), 0);
        }
    }
    return result;
}
```

### 三数之和

相关题目：

*   15.三数之和

此题的关键在于对结果的去重，使用哈希法处理去重比较难理解且困难，而且容易超时此题更适合的解法是使用 **排序 + 双指针**，解法如下：

```java
public List<List<Integer>> threeSum(int[] nums) {
    List<List<Integer>> list = new ArrayList<>();
    Arrays.sort(nums);
    for (int i = 0; i < nums.length; i++) {
        // 数组已经排过序了，如果遍历到元素大于0，后面3个数之和肯定大于0
        if (nums[i] > 0) {
            break;
        }
        // 剔除重复元素
        if (i > 0 && nums[i] == nums[i - 1]) {
            continue;
        }
        // 双指针进行遍历
        int left = i + 1, right = nums.length - 1;
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            // 三数之和大于0，说明需要更小的数，那么将右指针左移
            if (sum > 0) {
                right--;
            } else if (sum < 0) {
                // 三数之和小于0，说明需要更大的数，将左指针右移
                left++;
            } else {
                // 三数之和等于0，满足条件
                list.add(Arrays.asList(nums[i], nums[left], nums[right]));
                // 剔除左指针遍历时遇到的重复元素
                while (left < right && nums[left] == nums[left + 1]) {
                    left++;
                }
                // 剔除右指针遍历时遇到的重复元素
                while (left < right && nums[right] == nums[right - 1]) {
                    right--;
                }
                // 移动左右指针
                left++;
                right--;
            }
        }
    }
    return list;
}
```

### 四数之和

相关题目：

*   18.四数之和

此题的解法与三数之和相似，直接在三数之和的基础上增加一层遍历即可，代码如下：

```java
public List<List<Integer>> fourSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);
    // 在三数之和的基础上增加一层遍历，记得加上对判重的处理
    for (int i = 0; i < nums.length; i++) {
        // 如果后面的数全是正数，并且当前数已经大于目标数了，那么后面所有的数都不符合条件
        if (nums[i] > 0 && nums[i] > target) {
            break;
        }
        if (i > 0 && nums[i] == nums[i - 1]) {
            continue;
        }
        for (int j = i + 1; j < nums.length; j++) {
            if (j > i + 1 && nums[j] == nums[j - 1]) {
                continue;
            }
            int left = j + 1, right = nums.length - 1;
            while (left < right) {
                int sum = nums[i] + nums[j] + nums[left] + nums[right];
                if (sum > target) {
                    right--;
                } else if (sum < target) {
                    left++;
                } else {
                    result.add(Arrays.asList(nums[i], nums[j], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) {
                        left++;
                    }
                    while (left < right && nums[right] == nums[right - 1]) {
                        right--;
                    }
                    left++;
                    right--;
                }
            }
        }
    }
    return result;
}
```

