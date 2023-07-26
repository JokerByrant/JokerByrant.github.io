---
title: leetcode刷题记录 - 字符串
tags: leetcode
categories: 算法
abbrlink: 55708
date: 2023-07-20 11:51:58
---
对于字符串相关的题目，双指针解法出现的频率非常高。

<!--more-->

### 反转字符串II

相关题目：

*   541.反转字符串II

代码如下：

```java
public String reverseStr(String s, int k) {
    char[] chars = s.toCharArray();
    for (int i = 0; i < chars.length; i += 2*k) {
        int left = i, right = left + k - 1;
        if (chars.length - left < k) {
            right = chars.length - 1;
        }
        while (left < right) {
            char temp = chars[left];
            chars[left] = chars[right];
            chars[right] = temp;
            left++;
            right--;
        }
    }
    return String.valueOf(chars);
}
```

### 替换空格

相关题目：

*   剑指Offer05.替换空格

第一种解法：暴力解法。

```java
public String replaceSpace(String s) {
    StringBuilder stringBuilder = new StringBuilder();
    for (int i = 0; i < s.length(); i++) {
        if (s.charAt(i) == ' ') {
            stringBuilder.append("%20");
        } else {
            stringBuilder.append(s.charAt(i));
        }
    }
    return stringBuilder.toString();
}
```

在 `Java` 中，`StringBuilder` 的 `apend`  方法中有对底层数组进行扩容的处理，如果发现添加字符后数组长度不够了，就会进行数组扩容的处理：创建一个新长度的数组，将原数组的元素复制过去。

```java
public AbstractStringBuilder append(String str) {
    if (str == null)
        return appendNull();
    int len = str.length();
    ensureCapacityInternal(count + len);
    str.getChars(0, len, value, count);
    count += len;
    return this;
}

private void ensureCapacityInternal(int minimumCapacity) {
    // overflow-conscious code
    if (minimumCapacity - value.length > 0) {
        value = Arrays.copyOf(value,
                newCapacity(minimumCapacity));
    }
}
```

如果字符长度比较长，使用上面的处理就会经历多次数组扩容。因此就有了第二种解法：**数组填充法**。**先预先给数组进行扩容**，然后再将原数组的元素 **从后向前** 填充到扩容的新数组中。填充时使用双指针法进行填充，左指针指向原数组的尾端，右指针指向新数组的尾端。代码如下:

```java
public String replaceSpace(String s) {
    // 寻找空格的数量
    int spaceCount = 0;
    for (int i = 0; i < s.length(); i++) {
        if (s.charAt(i) == ' ') {
            spaceCount++;
        }
    }
    // 创建一个新数组，大小为原字符串大小+空格数*2
    char[] chars = new char[s.length() + spaceCount * 2];
    int left = s.length() - 1, right = chars.length - 1;
    while (left >= 0) {
        if (s.charAt(left) == ' ') {
            chars[right] = '0';
            chars[--right] = '2';
            chars[--right] = '%';
        } else {
            chars[right] = s.charAt(left);
        }
        left--;
        right--;
    }
    return String.valueOf(chars);
}
```

### 反转字符串中的单词

相关题目：

*   151.反转字符串中的单词

暴力解法，直接使用 `Java` 中的 `split()` 函数：

```java
public String reverseWords(String s) {
    // 暴力解法
    StringBuilder stringBuilder = new StringBuilder();
    String[] strArr = s.split(" ");
    for (int i = strArr.length - 1; i >= 0; i--) {
        // 剔除多余的空格
        if (!strArr[i].equals("")) {
            // 每个字符中间用空格分割
            if (stringBuilder.length() > 0) {
                stringBuilder.append(" ");
            }
            stringBuilder.append(strArr[i]);
        }
    }
    return stringBuilder.toString();
}
```

直接用 `split()` 函数有些胜之不武，下面用双指针法进行处理，代码如下：

```java
public String reverseWords(String s) {
    // 双指针法
    StringBuilder stringBuilder = new StringBuilder();
    // 左指针遍历字符串，右指针用于记录可以输出的字符串的结束位置
    int left = s.length() - 1, right = s.length();
    while (left >= 0) {
        // 这里的循环是为了寻找可以输出的字符串
        // left指针遍历过程中，如果当前字符不为空格，下一个字符是空格，那么跳出循环
        while (left > 0 && (s.charAt(left) == ' ' || s.charAt(left - 1) != ' ')) {
            // 如果当前字符是空格，下一个字符不是空格，那么将右指针指向当前字符
            if (s.charAt(left) == ' ' && s.charAt(left - 1) != ' ') {
                right = left;
            }
            left--;
        }
        // 防止left==0对应的字符是是空格
        if (s.charAt(left) != ' ') {
            if (stringBuilder.length() > 0) {
                stringBuilder.append(' ');
            }
            // 进行字符分割
            stringBuilder.append(s, left, right);
        }
        // 指针左移
        left--;
    }
    return stringBuilder.toString();
}
```

上面还是使用了 `Java` 的内置函数 `subString()`，下面尝试一下完全不使用 `Java` 的内置函数进行处理：

```java
public String reverseWords(String s) {
    // 双指针法解法2，在原数组上进行操作
    // 思路如下：先去除字符上的空格，将整个字符翻转，将单个单词再翻转
    char[] chars = s.toCharArray();
    // 移除多余空格
    int slow = 0;
    for (int fast = 0; fast < chars.length; fast++) {
        if (chars[fast] != ' ') {
            // 用空格将每个单词分割
            if (slow > 0) {
                chars[slow++] = ' ';
            }
            // 将不是空格的字符移动到数组前部
            while (fast < chars.length && chars[fast] != ' '){
                chars[slow++] = chars[fast++];
            }
        }
    }
    // 新数组的长度是剔除了多余空格的长度
    char[] newChars = new char[slow];
    System.arraycopy(chars, 0, newChars, 0, slow);
    // 对整个字符串进行反转
    reverse(newChars, 0, newChars.length - 1);
    // 对每个单词进行反转
    int left = 0;
    for (int right = 0; right <= newChars.length; right++) {
        // 遍历到了字符串末尾，或者碰到空格，表示遇到了一个单词，则对其进行反转
        if (right == newChars.length || newChars[right] == ' ') {
            // 反转单词
            reverse(newChars, left, right - 1);
            // left指向下一个不为空格的字符
            left = right + 1;
        }
    }
    return new String(newChars);
}

public void reverse(char[] chars, int left, int right) {
    while (left < right) {
        // 使用移位运算符进行反转
        chars[left] ^= chars[right];
        chars[right] ^= chars[left];
        chars[left] ^= chars[right];
        left++;
        right--;
    }
}
```

### 左旋转字符串

相关题目：

*   剑指Offer58-II.左旋转字符串

直接用 `Java` 的内置函数 `subString` 完成暴力解法：

```java
public String reverseLeftWords(String s, int n) {
    // 暴力解法
    return s.substring(n) + s.substring(0, n);
}
```

尝试一下不用内置函数来解答，解题思路是 **先翻转局部，再翻转整体**，如下：

```java
public String reverseLeftWords(String s, int n) {
    // 不申请额外的空间，在原字符串上操作
    // 解题思路：先反转前n个字符，再翻转n到末尾的字符，之后将整个字符翻转
    char[] chars = s.toCharArray();
    // 翻转前N个字符
    reverse(chars, 0, n - 1);
    // 翻转N到末尾的字符
    reverse(chars, n, s.length() - 1);
    // 翻转整个字符串
    reverse(chars, 0, s.length() - 1);
    return new String(chars);
}

public void reverse(char[] chars, int left, int right) {
    while (left < right) {
        chars[left] ^= chars[right];
        chars[right] ^= chars[left];
        chars[left] ^= chars[right];
        left++;
        right--;
    }
}
```

### 找出字符串中第一个匹配项的下标

相关题目：

*   28.找出字符串中第一个匹配项的下标

先看下常规解法，一般称之为朴素解法：

```java
public int strStr(String haystack, String needle) {
    // 朴素解法
    // 思路：遍历原串中的每个字符，当前所在字符作为「发起点」，每次从原串的「发起点」和匹配串的「首位」开始尝试匹配
    // 如果匹配成功，返回原串的发起点。匹配失败，遍历到原串的下一个发起点继续匹配
    // 遍历原串时，需要保证剩余待遍历的字符长度大于等于待匹配字符串
    for (int i = 0; i <= haystack.length() - needle.length(); i++) {
        // 每次遍历，原串的发起点是当前字符，待匹配串发起点是第一个字符
        int a = i, b = 0;
        while (b < needle.length() && haystack.charAt(a) == needle.charAt(b)) {
            // 向后遍历原串和待匹配串，如果待匹配串遍历结束，或原串的字符与待匹配串不一致，跳出循环
            a++;
            b++;
        }
        // 匹配成功，返回远传的发起点
        if (b == needle.length()) {
            return i;
        }
    }
    return -1;
}
```

此题引出一个新算法：**KMP算法，这个算法的核心是PMT数组(部分匹配表)。**

KMP算法的核心思想是：**当出现字符串不匹配时，可以记录一部分之前已经匹配的文本内容，利用这些信息避免从头再去做匹配。**

而 **在一个串中查找是否出现过另一个串** 是KMP算法的看家本领，本题就是这类题目。

关于这个算法的概念可以看下这篇文章，讲的比较清晰：[如何更好地理解和掌握 KMP 算法?](https://www.zhihu.com/question/21923021/answer/281346746)

下面说说我的理解：

*   在原KMP算法的定义中，有一个PMT部分匹配表，它的定义是：**下标i之前(包括i)的字符串中，\[前缀集合] 和 \[后缀集合] 的交集中最长元素的长度**
*   假设现在有一个主字符Main，和一个待匹配字符Slave，遍历主字符的指针是i，遍历待匹配字符的指针是j。我们先为待匹配字符创建PMT数组，如果在进行字符匹配时，在主字符的第i位、PMT表的第j位发生了失配，那么就去找第j-1位对应的值PMT\[j - 1]，这个值记为flag：**主字符串中从第i - flag到第i-1位的子字符串，一定与待匹配字符串的第0位到第flag位的子字符串相同。**
*   在对PMT数组进行实际应用时，会对它做一个变式：上面在第j位失配，我们需要找第PMT\[j-1]处的值，为了方便，这里直接将PMT数组向后偏移一位，记为next数组。next\[0]定义为-1只是为了编程方便，这样之后如果在第j位失配，直接找第next\[j]位的值即可算出指针需要前移多少位.

下面看一下这题的解法，首先是解法1，对PMT数组实行向右偏移一位的操作：

```java
public int strStr(String haystack, String needle) {
    // 解法1：next数组向右偏移一位
    // 获取needle的next数组
    int[] next = getKMPNext(needle);
    int j = -1;
    for (int i = 0; i < haystack.length(); i++) {
        // next[0]被定义为了-1，因此这里遍历needle的指针也从-1开始。
        // 如果字符不匹配，根据next表对j进行回退
        while (j >= 0 && haystack.charAt(i) != needle.charAt(j + 1)) {
            j = next[j];
        }
        // 如果字符匹配，那么j指针右移
        if (haystack.charAt(i) == needle.charAt(j + 1)) {
            j++;
        }
        // j指针指向了待匹配字符串的末尾，说明匹配成功
        if (j == needle.length() - 1) {
            return (i - needle.length() + 1);
        }
    }
    return -1;
}

public int[] getKMPNext(String needle) {
    int[] next = new int[needle.length()];
    int j = -1;
    next[0] = j;
    for (int i = 1; i < next.length; i++) {
        // 前后缀不相同了
        while (j >= 0 && needle.charAt(i) != needle.charAt(j + 1)) {
            // 向前回退
            j = next[j];
        }
        // 前后缀相同
        if (needle.charAt(i) == needle.charAt(j + 1)) {
            j++;
        }
        // 得到字符串第0到第i-1位的 [前缀集合] 和 [后缀集合] 的交集中最长元素的长度为j
        next[i] = j;
    }
    return next;
}
```

接着是解法2，对PMT数组保持原样：

```java
 public int strStr(String haystack, String needle) {
    // 解法1：PMT数组保持原样
    // 获取needle的next数组
    int[] next = getKMPNext(needle);
    int j = 0;
    for (int i = 0; i < haystack.length(); i++) {
        // 如果字符不匹配，根据next表对j进行回退
        while (j > 0 && haystack.charAt(i) != needle.charAt(j)) {
            j = next[j - 1];
        }
        // 如果字符匹配，那么j指针右移
        if (haystack.charAt(i) == needle.charAt(j)) {
            j++;
        }
        // j指针指向了待匹配字符串的末尾，说明匹配成功
        if (j == needle.length()) {
            return (i - needle.length() + 1);
        }
    }
    return -1;
}

public int[] getKMPNext(String needle) {
    int[] next = new int[needle.length()];
    int j = 0;
    next[0] = j;
    for (int i = 1; i < next.length; i++) {
        // 前后缀不相同了
        while (j > 0 && needle.charAt(i) != needle.charAt(j)) {
            // 向前回退
            j = next[j - 1];
        }
        // 前后缀相同
        if (needle.charAt(i) == needle.charAt(j)) {
            j++;
        }
        // 得到字符串第0到第i-1位的 [前缀集合] 和 [后缀集合] 的交集中最长元素的长度为j
        next[i] = j;
    }
    return next;
}
```

### 最长快乐前缀

相关题目：

*   1392.最长快乐前缀

> 「快乐前缀」 是在原字符串中既是 非空 前缀也是后缀（不包括原字符串自身）的字符串。

看下 `KMP` 算法中 `PMT` 表的定义：**下标i之前(包括i)的字符串中，\[前缀集合] 和 \[后缀集合] 的交集中最长元素的长度**。再看看上面对快乐前缀的定义，要求的是最长的快乐前缀，那么就是说求的是 `PMT` 表中最后一个元素的值。代码如下：

```java
 public String longestPrefix(String s) {
    // 思路：要求的是最长相同 [前缀] 和 [后缀]，这正是KMP算法做的事情
    // KMP的PMT表中元素的定时，下标i之前(包括i)的字符串中，[前缀集合] 和 [后缀集合] 的交集中最长元素的长度
    int[] next = getNextArr(s);
    // 最后一个元素在 PMT表中的值就是当前字符串 [前缀集合] 和 [后缀集合] 的交集中最长元素的长度
    int maxLength = next[next.length - 1];
    if (maxLength > 0) {
        return s.substring(0, maxLength);
    }
    return "";
}

public int[] getNextArr(String s) {
    int j = 0;
    int[] next = new int[s.length()];
    for (int i = 1; i < s.length(); i++) {
        while (j > 0 && s.charAt(i) != s.charAt(j)) {
            j = next[j - 1];
        }
        if (s.charAt(i) == s.charAt(j)) {
            j++;
        }
        next[i] = j;
    }
    return next;
}
```

### 重复的子字符串

相关题目：

*   459.重复的子字符串

解法1：使用 **KMP算法**。

思路：如果s满足条件，那么s+s也满足条件，将s+s的首尾字符去除，如果其中能找到一个s，说明匹配。这个进行的就是 **在一个串中查找是否出现过另一个串** 的操作，因此可以使用 `KMP` 算法处理，代码如下：

```java
public boolean repeatedSubstringPattern(String s) {
    // 使用KMP算法
    // 思路：如果s满足条件，那么s+s也满足条件，将s+s的首尾字符去除，如果其中能找到一个s，说明匹配
    int[] next = getNextArr(s);
    int j = 0;
    // 构建一个新的字符串：s+s
    String newStr = s + s;
    // 遍历新字符串，跳过首位和末位
    for (int i = 1; i < newStr.length() - 1; i++) {
        while (j > 0 && newStr.charAt(i) != s.charAt(j)) {
            j = next[j - 1];
        }
        if (newStr.charAt(i) == s.charAt(j)) {
            j++;
        }
        if (j == s.length()) {
            return true;
        }
    }
    return false;
}

public int[] getNextArr(String s) {
    int[] next = new int[s.length()];
    int j = 0;
    next[0] = j;
    for (int i = 1; i < next.length; i++) {
        while (j > 0 && s.charAt(i) != s.charAt(j)) {
            j = next[j - 1];
        }
        if (s.charAt(i) == s.charAt(j)) {
            j++;
        }
        next[i] = j;
    }
    return next;
}
```

### 字符串轮转

相关题目：

*   面试题01.09 字符串轮转

此题与上面一道 \[459.重复的子字符串] 相似，解题思路是：**如果s2是由s1旋转而成，那么s2+s2中肯定包含s1**。因此也可以用 `KMP` 算法处理：

```java
public boolean isFlipedString(String s1, String s2) {
    // KMP算法，如果s2是由s1旋转而成，那么s2+s2中肯定包含s1
    // 这就与第459题一样了
    if (s1.length() != s2.length()) {
        return false;
    }
    if (s1.equals("")) {
        return true;
    }
    int[] next = getNext(s1);
    String oStr = s2 + s2;
    int j = 0;
    for (int i = 0; i < oStr.length(); i++) {
        while (j > 0 && oStr.charAt(i) != s1.charAt(j)) {
            j = next[j - 1];
        }
        if (oStr.charAt(i) == s1.charAt(j)) {
            j++;
        }
        if (j == s1.length()) {
            return true;
        }
    }
    return false;
}

public int[] getNext(String s) {
    int j = 0;
    int[] next = new int[s.length()];
    for (int i = 1; i < s.length(); i++) {
        while (j > 0 && s.charAt(i) != s.charAt(j)) {
            j = next[j - 1];
        }
        if (s.charAt(i) == s.charAt(j)) {
            j++;
        }
        next[i] = j;
    }
    return next;
}
```

当然没必要整那么复杂，简单一点的解法：

```java
public boolean isFlipedString(String s1, String s2) {
    // 暴力解法，如果s2是由s1旋转而成，那么s2+s2中肯定包含s1
    if (s1.length() != s2.length()) {
        return false;
    }
    if ((s2 + s2).contains(s1)) {
        return true;
    }
    return false;
}
```

### 总结

关于字符串相关的题目，有以下几个关键点：

*   如果题目中出现 **旋转**、**匹配子字符串返回下标**、一个**字符串是否可以由另一个字符串构成** 的描述，都可以思考它是否满足或者是否可以将其转换为 **在一个串中查找是否出现过另一个串** 的处理，如果满足或者转换后满足，那么就可以用 `KMP` 算法来解答。
*   双指针法在数组，链表和字符串中很常用。很多数组填充类的问题，都可以先预先给数组扩容带填充后的大小，然后在从后向前进行操作。
*   字符串翻转系列的题目，可以考虑对字符串实行 **整体 + 部分** 翻转的操作。

