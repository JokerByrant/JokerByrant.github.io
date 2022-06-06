---
title: JavaFX子表格默认展开
abbrlink: 688
date: 2022-05-27 13:37:48
tags: JavaFX
categories: 后端技术
---

之前实现过一个需求：{% post_link JavaFX渲染子表格 %}。当时采用的方法是 **点击某一行展开对应的子表格**，这种方法同一时间只能展开一个子表格。其实最终想要的效果是在表格渲染完毕后，所有的子表格全部默认展开。

<!--more-->

### 初步尝试

`JavaFx` 的中文资料比较少，查阅了 `StackoverFlow` 相关问题，仍未找到解决办法。只能自行实现，经过多番尝试，初步实现了这个效果，代码如下：

```java
tableView.getSelectionModel().setSelectionMode(SelectionMode.MULTIPLE);
tableView.setPrefHeight(750.0);
// 点击父表格某一行，展开子表格
tableView.setRowFactory(tv -> new TableRow<Map<String, Object>>() {
    Node detailsPane;

    // 绑定表格列点击事件，点击之后显示子表格
    {
        ObservableList<Node> children = this.getChildren();
        TableRow<Map<String, Object>> that = this;
        this.selectedProperty().addListener(new ChangeListener<Boolean>() {
            @Override
            public void changed(ObservableValue<? extends Boolean> obs, Boolean wasSelected, Boolean isNowSelected) {
                if (isNowSelected) {
                    if (detailsPane != null && children != null && !children.contains(detailsPane)) {
                        children.add(detailsPane);
                    }
                    // 触发一次之后移除该事件
                    that.selectedProperty().removeListener(this);
                }
            }
        });
    }

    @Override
    protected void updateItem(Map<String, Object> item, boolean empty) {
        super.updateItem(item, empty);
        if (!empty) {
            List<Map<String, Object>> subTableItems = childSensorMap.get(item.get("sensor_code").toString());
            if (CollectionUtils.isNotEmpty(subTableItems)) {
                detailsPane = constructSubTable(FXCollections.observableArrayList(subTableItems));
                // 手动触发表格列选中事件
                Platform.runLater(() -> {
                    tv.getSelectionModel().select(item);
                });
            }
        }
    }

    // 设置行的高度
    @Override
    protected double computePrefHeight(double width) {
        if (detailsPane != null) {
            // 有子表格的行的高度
            return super.computePrefHeight(width) + detailsPane.prefHeight(60);
        } else {
            // 没有子表格的行的高度
            return super.computePrefHeight(width);
        }
    }

    // 设置子表格的布局
    @Override
    protected void layoutChildren() {
        super.layoutChildren();
        if (isSelected() && detailsPane != null) {
            double width = getWidth();
            double paneHeight = detailsPane.prefHeight(width);
            detailsPane.resizeRelocate(0, getHeight() - paneHeight, width, paneHeight);
        }
    }
});
```

解释一下上面的代码：仍然采用了之前的点击事件触发子表格展开的方式，在其中重写了 `updateItem()` 方法，在这个方法中手动的触发点击事件，也就是 `tv.getSelectionModel().select(item);` 这段代码。另外要注意的是子表格的行高度计算问题，有子表格的行和没有子表格的行需要分别计算。

但是，测试发现这个实现仍然存在问题：**当数据较多时，表格数据不能在一页内展示完，这时滚动下拉框，会发现子表格渲染出现异常。** 如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1654493899384328e5ed135ee19d21a6171ba29c284ae.png)

对代码进行 `Debug` ，发现是 `updateItem()` 引起的：**每次在滚动下拉框时，都会触发这个方法，导致表格行重新渲染。**

在 [Turning off updateItem rendering in TableCell once scrolled or data visited](https://bugs.openjdk.java.net/browse/JDK-8091122?page=com.atlassian.jira.plugin.system.issuetabpanels%3Acomment-tabpanel&showAll=true) 这篇讨论中，找到了一条评论：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16544939223851e5650a165bd8bcba04b2000c5ef1161.png)

> 据我所知，这些单元格在滚动 TableView 时会被重用，因此并非每个表格项都有自己的 TableCell，只有那些可见的才有。滚动时应调用 TableCell 上的 updateItem。

这就解释了上面的问题：`JavaFx` 单元格数据的重用机制，导致了子表格渲染异常！

### 进一步优化

首先尝试了废弃上面的 `updateItem()` 方法，将子表格的创建放在点击操作中进行，但是测试之后发现这样做存在一个问题：**只能渲染当前页的子表格，超出当前页的数据将无法渲染子表格**。代码如下：

```java
// 点击父表格某一行，展开子表格
tableView.setRowFactory(tv -> new TableRow<Map<String, Object>>() {
    Node detailsPane;

    {
        ObservableList<Node> children = this.getChildren();
        TableRow<Map<String, Object>> that = this;
        // 绑定表格列点击事件，点击之后显示子表格
        this.selectedProperty().addListener(new ChangeListener<Boolean>() {
            @Override
            public void changed(ObservableValue<? extends Boolean> obs, Boolean wasSelected, Boolean isNowSelected) {
                if (isNowSelected) {
                    if (detailsPane != null && children != null && !children.contains(detailsPane)) {
                        children.add(detailsPane);
                    }
                    // 触发一次之后移除该事件
                    that.selectedProperty().removeListener(this);
                }
            }
        });
        // 初始化子表格并触发点击事件，完成渲染
        Platform.runLater(() -> {
            if (getItem() != null) {
                List<Map<String, Object>> subTableItems = childSensorMap.get(getItem().get("sensor_code").toString());
                if (CollectionUtils.isNotEmpty(subTableItems)) {
                    detailsPane = constructSubTable(FXCollections.observableArrayList(subTableItems));
                    tv.getSelectionModel().select(getIndex());
                }
            }
        });
    }

    // 设置列的高度
    @Override
    protected double computePrefHeight(double width) {
        if (detailsPane != null) {
            // 有子表格的列的高度
            return super.computePrefHeight(width) + detailsPane.prefHeight(60);
        } else {
            // 没有子表格的列的高度
            return super.computePrefHeight(width);
        }
    }

    // 设置子表格的布局
    @Override
    protected void layoutChildren() {
        super.layoutChildren();
        if (isSelected() && detailsPane != null) {
            double width = getWidth();
            double paneHeight = detailsPane.prefHeight(width);
            detailsPane.resizeRelocate(0, getHeight() - paneHeight, width, paneHeight);
        }
    }
});
```

### 最终方案

第二种方法的问题没法解决，因此只能回退回第一版，在第一版的基础上继续改进，只需要解决表格行复用机制带来的问题即可。首先优化点击事件，优化点如下：

1. 每次滚动都会触发 `updateItem()`，在 `updateItem()` 方法中定义触发表格行点击事件的代码。这样每次滚动时，就会触发表格行点击事件。
2. 区分当前事件时用户点击的还是滚动触发的，只处理滚动触发的。
3. 维护一个全局变量Map，里面存放表格行和子表格的映射。为了避免子表格被复用，在每次点击事件触发时，从 `Map` 中寻找当前行对应的子表格。并判断已经渲染的子表格与寻找到的是否相等，如果相等，则无需再处理。如果不相等，则移除已渲染的子表格，并重新将 `Map` 中拿到的子表格渲染上去。

最终代码如下：

```java
// 缓存所有的子表格
private Map<String, Map<Integer, Node>> subTableMap;

// 点击父表格某一行，展开子表格
tableView.setRowFactory(tv -> new TableRow<Map<String, Object>>() {
    // 判断是否是用户触发的选择事件
    boolean isUserTrigger = true;

    {
        ObservableList<Node> children = this.getChildren();
        // 绑定表格列点击事件，点击之后显示子表格
        this.selectedProperty().addListener((obs, wasSelected, isNowSelected) -> {
            // 只处理选中的，不处理取消选中的；用户触发的选择不处理；只处理子表格不为空并且当前行数据也有子传感器的
            if (isNowSelected && !isUserTrigger) {
                Node detailPane = getCurrentSubTableMap().get(getIndex());
                Node node = children.get(children.size() - 1);
                boolean hasSubTable = false;
                if (node instanceof VBox) {
                    if (node != detailPane) {
                        // 若被选中行已渲染了子表格, 但是子表格是复用的, 则移除子表格
                        children.remove(children.size() - 1);
                    } else {
                        hasSubTable = true;
                    }
                }
                // 若被选中行尚未渲染子表格，但是该行拥有子表格，则渲染子表格
                if (!hasSubTable && detailPane != null) {
                    children.add(detailPane);
                }
                isUserTrigger = true;
            }
        });
    }

    @Override
    protected void updateItem(Map<String, Object> item, boolean empty) {
        super.updateItem(item, empty);
        if (!empty) {
            List<Map<String, Object>> subTableItems = childSensorMap.get(item.get("sensor_code").toString());
            if (CollectionUtils.isNotEmpty(subTableItems) && !getCurrentSubTableMap().containsKey(getIndex())) {
                getCurrentSubTableMap().put(getIndex(), constructSubTable(FXCollections.observableArrayList(subTableItems)));
            }
            // 手动触发表格列选中事件
            Platform.runLater(() -> {
                isUserTrigger = false;
                // 先取消表格选中状态，再重新触发一次选中
                tv.getSelectionModel().clearSelection(getIndex());
                tv.getSelectionModel().select(getIndex());
            });
        }
    }

    // 设置列的高度
    @Override
    protected double computePrefHeight(double width) {
        if (getCurrentSubTableMap().containsKey(getIndex())) {
            // 有子表格的列的高度
            return super.computePrefHeight(width) + getCurrentSubTableMap().get(getIndex()).prefHeight(60);
        } else {
            // 没有子表格的列的高度
            return super.computePrefHeight(width);
        }
    }

    // 设置子表格的布局
    @Override
    protected void layoutChildren() {
        super.layoutChildren();
        if (getCurrentSubTableMap().containsKey(getIndex())) {
            double width = getWidth();
            double paneHeight = getCurrentSubTableMap().get(getIndex()).prefHeight(width);
            getCurrentSubTableMap().get(getIndex()).resizeRelocate(0, getHeight() - paneHeight, width, paneHeight);
        }
    }
});

/**
 * 获取当前的子表格Map
 * @return
 */
private Map<Integer, Node> getCurrentSubTableMap() {
    return subTableMap.get(currentProductModel + 'A' + proModelStoveMap.get(currentProductModel).getId());
}
```

### 参考文档

[Turning off updateItem rendering in TableCell once scrolled or data visited](https://bugs.openjdk.java.net/browse/JDK-8091122?page=com.atlassian.jira.plugin.system.issuetabpanels%3Acomment-tabpanel&showAll=true)