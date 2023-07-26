---
title: leetcode刷题记录 - 栈与队列
tags: leetcode
categories: 算法
abbrlink: 20598
date: 2023-07-25 11:53:02
---

*   栈 - `Stack`：`LIFO` - 后进先出
*   队列 - `Queue`：`FIFO` - 先进先出。

> 可以这么记忆，栈需要压栈和出栈，想到压栈就想到把一个物体压到底部，因此这个物体只能最后才出来，因此栈是 `FILO`；相对的，队列接是 `FIFO`。

<!--more-->

### 用栈实现队列

相关题目：

*   232.用栈实现队列

队列是 `FIFO`，栈是 `LIFO`，因此用栈来实现队列，需要定义两个栈，一个 `inStack`，一个 `outStack`。代码如下：

```java
class MyQueue {
  // 队列是FIFO，栈是LIFO，因此用栈来实现队列，需要定义两个栈，一个inStack，一个outStack
  // 当队列要出栈时，先将inStack中的元素出栈，出栈的元素入栈到outStack，再从outStack出栈。
  // 实际的情况可能比上面的要复杂
  Stack<Integer> in;
  Stack<Integer> out;

  public MyQueue() {
      in = new Stack<>();
      out = new Stack<>();
  }

  public void push(int x) {
      in.push(x);
  }

  public int pop() {
      // 如果outStack为空，需要先将inStack中所有数据先出栈，并入栈到outStack中
      if (out.empty()) {
          while (!in.empty()) {
              out.push(in.pop());
          }
      }
      // 之后再对outStack进行出栈操作
      return out.pop();
  }

  public int peek() {
      if (out.empty()) {
          while (!in.empty()) {
              out.push(in.pop());
          }
      }
      return out.peek();
  }

  public boolean empty() {
        return in.empty() && out.empty();
    }
}
```

### 用队列实现栈

相关题目：

*   225.用队列实现栈

题目中给的提示是使用两个队列来处理，队列是先进先出，使用两个队列处理时，如果按照上面#232题目的做法，把一个队列的数据导入到另一个队列中，新的数据顺序并没有发生变化，因此这题与#232的处理稍有不同。**只需要实现在入队时，将队列中除新入队元素外的其他元素按顺序出队，然后再入队的操作，就能保证队列的元素顺序是按照栈的方式存储的了。**

先看使用两个队列处理的方法，代码如下：

```java
class MyStack {
    Queue<Integer> queue1;
    // 辅助队列
    Queue<Integer> queue2;

    public MyStack() {
        queue1 = new LinkedList<>();
        queue2 = new LinkedList<>();
    }

    public void push(int x) {
        // 新元素放到辅助队列中
        // 再将原队列中的元素放进来
        // 这样就模拟了栈的后进先出的特点
        queue2.offer(x);
        while (!queue1.isEmpty()) {
            queue2.offer(queue1.poll());
        }
        Queue<Integer> tmpQueue = queue1;
        queue1 = queue2;
        queue2 = tmpQueue;
    }

    public int pop() {
        // 队列中元素的顺序符合栈的定义
        return queue1.poll();
    }

    public int top() {
        // 队列中元素的顺序符合栈的定义
        return queue1.peek();
    }

    public boolean empty() {
        return queue1.isEmpty();
    }
}
```

其实使用一个队列也可以实现，代码如下：

```java
class MyStack {
    // 使用一个队列来模拟栈
    Queue<Integer> queue;

    public MyStack() {
        queue = new LinkedList<>();
    }

    public void push(int x) {
        queue.offer(x);
        int index = queue.size();
        // 将除新元素外的其他元素进行如下操作：先出队列，再入队列。
        // 这样就能保证新元素是在队列首位了
        while (index-- > 1) {
            // 这里的操作不会影响新添加的元素
            queue.offer(queue.poll());
        }
    }

    public int pop() {
        // 队列中元素的顺序符合栈的定义
        return queue.poll();
    }

    public int top() {
        // 队列中元素的顺序符合栈的定义
        return queue.peek();
    }

    public boolean empty() {
        return queue.isEmpty();
    }
}
```

### 有效的括号

相关题目：

*   20.有效的括号

此题使用栈来解，关键点是要提前理清不符合条件的几种情况：

*   已经遍历完了字符串，但是栈不为空，说明有相应的左括号没有右括号来匹配，所以 `return false`
*   遍历字符串匹配的过程中，发现栈里没有要匹配的字符。所以 `return false`
*   遍历字符串匹配的过程中，栈已经为空了，没有匹配的字符了，说明右括号没有找到对应的左括号 `return false`

还有就是在匹配左括号的时候，右括号先入栈，就只需要比较当前元素和栈顶相不相等就可以了。对应的代码如下：

```java
public boolean isValid(String s) {
    // 符合条件的字符串长度一定是偶数
    if (s.length() % 2 != 0) {
        return false;
    }
    Stack<Character> stack = new Stack<>();
    for (Character ch : s.toCharArray()) {
        if (ch == '(') {
            stack.push(')');
        } else if (ch == '[') {
            stack.push(']');
        } else if (ch == '{') {
            stack.push('}');    
        } else if (stack.empty() || stack.peek() != ch) {
            // 栈为空或者栈顶元素不是目标字符，返回false
            return false;
        } else {
            stack.pop();
        }
    }
    // 最后，如果栈不为空，说明没有匹配的右括号
    return stack.empty();
}
```

### 删除字符串中的所有相邻重复项

相关题目：

*   1047.删除字符串中的所有相邻重复项

使用栈来解答，代码如下：

```java
public String removeDuplicates(String s) {
    Stack<Character> stack = new Stack<>();
    for (int i = s.length() - 1; i >= 0; i--) {
        if (!stack.empty() && stack.peek() == s.charAt(i)) {
            stack.pop();
        } else {
            stack.push(s.charAt(i));
        }
    }
    StringBuilder stringBuilder = new StringBuilder();
    while (!stack.empty()) {
        stringBuilder.append(stack.pop());
    }
    return stringBuilder.toString();
}
```

### 逆波兰表达式求值

相关题目：

*   150.逆波兰表达式求值

逆波兰表达式是一种后缀表达式，所谓后缀就是指算符写在后面：

*   平常使用的算式则是一种中缀表达式，如 ( 1 + 2 ) \* ( 3 + 4 ) 。
*   该算式的逆波兰表达式写法为 ( ( 1 2 + ) ( 3 4 + ) \* ) 。

同样是使用栈进行处理，遍历字符，如果是数字就放入栈中，如果是运算符，就将栈中的数字出栈并运算得出结果，再将结果放入栈中。最后字符遍历结束，栈中剩下的元素就是结果：

```java
public int evalRPN(String[] tokens) {
    Stack<Integer> stack = new Stack<>();
    int result = 0;
    for (String item : tokens) {
        // 对栈中元素进行运算，运算结果再放回栈中
        if (item.equals("+")) {
            stack.push(stack.pop() + stack.pop());
        } else if (item.equals("-")) {
            // 减法要注意元素顺序
            int tmp = stack.pop();
            stack.push(stack.pop() - tmp);
        } else if (item.equals("*")) {
            stack.push(stack.pop() * stack.pop());
        } else if (item.equals("/")) {
            // 除法需要注意元素顺序
            int tmp = stack.pop();
            stack.push(stack.pop() / tmp);
        } else {
            stack.push(Integer.parseInt(item));
        }
    }
    return stack.pop();
}
```

### 简化路径

相关题目：

*   71.简化路径

使用栈来处理，代码如下：

```java
public String simplifyPath(String path) {
    Stack<StringBuilder> stack = new Stack<>();
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < path.length(); i++) {
        char ch = path.charAt(i);
        if (ch != '/') {
            sb.append(ch);
        }
        // 碰到 "/" 或者到了字符串的末尾，检查当前路径
        if (sb.length() > 0 && (ch == '/' || i == path.length() - 1)) {
            if (sb.toString().equals("..")) {
                // 如果路径是".."，并且栈不为空，将上一个路径从栈中弹出
                if (!stack.empty()) {
                    stack.pop();
                }
            } else if (!sb.toString().equals(".")) {
                // 路径是正常的，入栈
                stack.push(sb);
            }
            sb = new StringBuilder();
        }
    }
    if (!stack.empty()) {
        sb = new StringBuilder();
        // 栈中的路径按照原顺序出栈顺序是反的，因此再用一个栈，纠正顺序
        Stack<StringBuilder> tmpStack = new Stack<>();
        while (!stack.empty()) {
            tmpStack.push(stack.pop());
        }
        while (!tmpStack.empty()) {
            sb.append("/").append(tmpStack.pop());
        }
        return sb.toString();
    } else {
        return "/";
    }
}
```

### 最小栈

相关题目：

*   155.最小栈

此题使用两个栈来解决，一个栈放正常的元素，另一个栈放前i个元素的最小值，注意在出栈操作时，要进行判空的处理。代码如下：

```java
class MinStack {
    Stack<Integer> stack;
    // 存放最小值的栈
    Stack<Integer> minStack;
    int min;

    public MinStack() {
        stack = new Stack<>();
        minStack = new Stack<>();
        min = Integer.MAX_VALUE;
    }

    public void push(int val) {
        min = Math.min(min, val);
        stack.push(val);
        minStack.push(min);
    }

    public void pop() {
        stack.pop();
        minStack.pop();
        if (minStack.empty()) {
            min = Integer.MAX_VALUE;
        } else {
            min = minStack.peek();
        }
    }

    public int top() {
        return stack.peek();
    }

    public int getMin() {
        return min;
    }
}
```

### 每日温度

相关题目：

*   739.每日温度

此题的要求是求下一个更大的数出现在几个数之后，要求的结果是数的位置(索引)的差值，并且需要当前的数与之后的数进行比较。暴力解法就是两层循环，但本题实际考察的是对栈的使用，我们在遍历数组时，将元素对应的索引放入栈中，栈中的数据含义是 **\[尚未确定下一个更大的数出现在几个数之后] 的第i个数**，之后对数组剩余的元素进行遍历时，将当前遍历的数与栈中下标对应的数进行比较，如果当前数大于栈中下标对应数，那么栈中对应下标就能拿到它要的结果，该下标就能从栈中出栈了。

代码如下：

```java
public int[] dailyTemperatures(int[] temperatures) {
    Stack<Integer> stack = new Stack<>();
    int len = temperatures.length;
    int[] result = new int[len];
    for (int i = 0; i < len; i++) {
        // 遍历栈中数据，找出前几天中比第i天温度低的，计算结果并将其出栈
        while (!stack.empty() && temperatures[stack.peek()] < temperatures[i]) {
            int preIndex = stack.pop();
            result[preIndex] = i - preIndex;
        }
        // 栈中存放的是 [尚未确定下一个更高温度出现在几天后] 的第i天
        stack.push(i);
    }
    return result;
}
```

### 下一个更大元素II

相关题目：

*   503.下一个更大元素II

此题与上一题 **\[739.每日温度]** 类似，区别是这题需要进行两次循环，代码如下：

```java
public int[] nextGreaterElements(int[] nums) {
    Stack<Integer> stack = new Stack<>();
    int i = 0, len = nums.length;
    int[] result = new int[len];
    boolean isFirstCycle = true;
    while (true) {
        while (!stack.empty() && nums[stack.peek()] < nums[i]) {
            int preIndex = stack.pop();
            result[preIndex] = nums[i];
        }
        if (isFirstCycle) {
            // 元素只有第一次循环时需要入栈
            stack.push(i);
        } else {
            // 第二次循环时，如果栈为空，直接跳出循环
            if (stack.empty() || stack.peek() == i) {
                break;
            }
        }
        i++;
        // 进入第二次循环
        if (i == len) {
            isFirstCycle = false;
            i = 0;
        }
    }
    // 剩余数据结果置为-1
    while (!stack.empty()) {
        result[stack.pop()] = -1;
    }
    return result;
}
```

对代码进行优化：

```java
public int[] nextGreaterElements(int[] nums) {
    Stack<Integer> stack = new Stack<>();
    int len = nums.length;
    int[] result = new int[len];
    Arrays.fill(result, -1);
    for (int i = 0; i < len * 2; i++) {
        int index = i % len;
        while (!stack.empty() && nums[stack.peek()] < nums[index]) {
            int preIndex = stack.pop();
            result[preIndex] = nums[index];
        }
        if (i < len) {
            stack.push(index);
        } else if (stack.empty()) {
            break;
        }
    }
    return result;
}
```

### 滑动窗口最大值

相关题目：

*   239.滑动窗口最大值

此题需要我们构建一个单调队列，单调队列在不同的场景下有不同的实现，其核心是对出队 `poll()` 和入队 `add()` 两个方法进行处理，按照实际需求进行实现。

本题中单调队列的特点是：**队列中元素递减，如果队列中的元素小于即将入队的元素，那将队列中这些元素移出队列，再将新元素入队。** `poll()` 和 `add` 操作保持如下规则：

*   `poll(value)`：如果窗口移除的元素 `value` 等于单调队列的出口元素，那么队列弹出元素，否则不用任何操作。
*   `add(value)`：，如果队列中的元素小于即将入队的元素，那将队列中这些元素移出队列，再将新元素入队。

如果要找当前窗口下的最大元素，那么直接去找队列中的首位元素即可。对应的代码如下：

```java
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums.length == 1) {
            return nums;
        }
        // 先初始化单调队列，滑动窗口初始位置是 [0, k-1]
        MyQueue myQueue = new MyQueue();
        for (int i = 0; i < k; i++) {
            myQueue.add(nums[i]);
        }
        int[] result = new int[nums.length - k + 1];
        int index = 0;
        // 初始位置窗口的最大值
        result[index++] = myQueue.peek();
        // 窗口向右滑动
        for (int i = k; i < nums.length; i++) {
            // 窗口首位元素从队列移除
            myQueue.poll(nums[i - k]);
            // 窗口末尾元素加入到队列中
            myQueue.add(nums[i]);
            // 获取当前位置窗口的最大值
            result[index++] = myQueue.peek();
        }
        return result;
    }
}
// 自定义单调队列(递减)
class MyQueue {
    Deque<Integer> deque;

    public MyQueue() {
        deque = new LinkedList<>();
    }

    void poll(int value) {
        // 移除队列首位元素
        if (!deque.isEmpty() && value == deque.peek()) {
            deque.poll();
        }
    }

    void add(int value) {
        // 单调队列的关键，维护 [有可能会成为最大值] 的元素
        // 随着滑动窗口的移动，如果新元素大于已经旧元素，那么新元素就是 [有可能会成为最大值] 的元素
        // 将小于新元素的旧元素全部移出队列
        while (!deque.isEmpty() && value > deque.getLast()) {
            deque.removeLast();
        }
        // 然后新元素入队
        deque.addLast(value);
    }

    int peek() {
        // 在队列首位的就是当前窗口的最大元素
        return deque.peek();
    }
}
```

### 前K个高频元素

相关题目：

*   347.前K个高频元素

此题的思路是，先对数组元素出现的频率进行统计，然后对统计结果进行排序，最后返回排序后的前k个数据即可。

首先是第一种解法，统计使用哈希表，排序使用数组快速排序，代码如下：

```java
public int[] topKFrequent(int[] nums, int k) {
    // 先统计每个元素出现的频率(哈希表)
    // 再对统计结果排序(数组快速排序)
    // 返回排序后前k个数据
    Map<Integer, Integer> map = new HashMap<>();
    for (int num : nums) {
        map.put(num, map.getOrDefault(num, 0) + 1);
    }
    int[] keyArr = new int[map.size()];
    int[] valueArr = new int[map.size()];
    int index = 0;
    for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
        keyArr[index] = entry.getKey();
        valueArr[index] = entry.getValue();
        index++;
    }
    // 快速排序
    quickSort(keyArr, valueArr, 0, valueArr.length - 1);
    return Arrays.copyOf(keyArr, k);
}

//时间复杂度O(n*logn)，空间复杂度O(n*logn)
public static void quickSort(int[] keyArr, int[] valueArr, int startIndex, int endIndex) {
    if (startIndex < endIndex) {
        //找出基准
        int partition = partition(keyArr, valueArr, startIndex, endIndex);
        //分成两边递归进行
        quickSort(keyArr, valueArr, startIndex, partition - 1);
        quickSort(keyArr, valueArr, partition + 1, endIndex);
    }
}

//找基准
private static int partition(int[] keyArr, int[] valueArr, int startIndex, int endIndex) {
    int pivot = valueArr[startIndex];
    int left = startIndex;
    int right = endIndex;
    while (left != right) {
        while (left < right && valueArr[right] <= pivot) {
            right--;
        }
        while (left < right && valueArr[left] > pivot) {
            left++;
        }
        //找到left比基准大，right比基准小，进行交换
        if (left < right) {
            swap(keyArr, valueArr, left, right);
        }
    }
    //第一轮完成，让left和right重合的位置和基准交换，返回基准的位置
    swap(keyArr, valueArr, startIndex, left);
    return left;
}

//两数交换
public static void swap(int[] keyArr, int[] valueArr, int i, int j) {
    int temp = keyArr[i];
    keyArr[i] = keyArr[j];
    keyArr[j] = temp;

    temp = valueArr[i];
    valueArr[i] = valueArr[j];
    valueArr[j] = temp;
}
```

第二种解法，更改一下排序的方式，使用队列对统计结果进行排序，使用的数据结构是优先队列，代码如下：

```java
public int[] topKFrequent(int[] nums, int k) {
    // 先统计每个元素出现的频率(哈希表)
    // 再对统计结果排序(数组快速排序)
    // 返回排序后前k个数据
    Map<Integer, Integer> map = new HashMap<>();
    for (int num : nums) {
        map.put(num, map.getOrDefault(num, 0) + 1);
    }
    // 使用优先队列暂存上面的统计结果，优先队列中的元素是数组，第一个元素是nums的元素，第二个元素是出现的频率
    // 对统计结果进行排序，将出现频率按从大到小进行排序
    PriorityQueue<int[]> queue = new PriorityQueue<>((pair1, pair2) -> pair2[1] - pair1[1]);
    for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
        // 大顶堆 - 优先队列中的元素按照从大到小排列，需要对所有元素进行排序
        queue.add(new int[]{entry.getKey(), entry.getValue()});
    }
    int[] result = new int[k];
    for (int i = 0; i < k; i++) {
        // 从优先队列的头部弹出k个元素
        result[i] = queue.poll()[0];
    }
    return result;
}
```

使用优先队列还有一种处理，上面优先队列是按照从大到小对元素进行排列，还可以按照从小到大堆元素进行排列，解法略有不同，代码如下：

```java
public int[] topKFrequent(int[] nums, int k) {
    // 先统计每个元素出现的频率(哈希表)
    // 再对统计结果排序(数组快速排序)
    // 返回排序后前k个数据
    Map<Integer, Integer> map = new HashMap<>();
    for (int num : nums) {
        map.put(num, map.getOrDefault(num, 0) + 1);
    }
    // 使用优先队列暂存上面的统计结果，优先队列中的元素是数组，第一个元素是nums的元素，第二个元素是出现的频率
    // 对统计结果进行排序，将出现频率按从小到大进行排序
    PriorityQueue<int[]> queue = new PriorityQueue<>((pair1, pair2) -> pair1[1] - pair2[1]);
    for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
        // 小顶堆 - 优先队列中的元素按照从小到大排列，只需要维持前k个元素有序就行了
        if (queue.size() < k) {
            queue.add(new int[]{entry.getKey(), entry.getValue()});
        } else {
            if (entry.getValue() > queue.peek()[1]) {
                // 如果当前元素出现次数大于小顶堆的根结点(这k个元素中出现次数最少的那个)
                // 弹出队头(小顶堆的根结点),即把堆里出现次数最少的那个删除,留下的就是出现次数多的了
                queue.poll();
                queue.add(new int[]{entry.getKey(),entry.getValue()});
            }
        }
    }
    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) {
        // 从优先队列的头部弹出k个元素
        result[i] = queue.poll()[0];
    }
    return result;
}
```

