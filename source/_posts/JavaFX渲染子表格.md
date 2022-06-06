---
title: JavaFX渲染子表格
abbrlink: 7489
date: 2022-04-18 13:35:43
tags: JavaFX
categories: 后端技术
---

之前有讲过，最近在开发一个以 `JavaFX` 为技术栈的桌面端项目。之前解决了表格数据刷新的问题：{% post_link JavaFX使用MapValueFactory渲染表格数据时的数据刷新问题 %}。最近又碰到一个问题：需要为指定的行加载子表格。
 
<!--more-->

在 `StackOverFlow` 上找到了一个 `Demo`： [JavaFX SubTable Demo](https://gist.github.com/sh9va/c81b9de44811cc860951701124941c1e)。渲染效果如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1654493791386165cc4985b9ec0e4fdf480b360085bb9.png)

直接将代码拷贝到现有项目中，关键代码如下：

```java
// 点击父表格某一行，展开子表格
tableView.setRowFactory(tv -> new TableRow<Map<String, Object>>() {
    Node detailsPane;
    {
        this.selectedProperty().addListener((obs, wasSelected, isNowSelected) -> {
            // 由于当前页面存在轮询任务，因此这里需要筛选一下，只处理主线程
            if ("JavaFX Application Thread".equals(Thread.currentThread().getName())) {
                if (isNowSelected) {
                    Map<String, Object> selectedItem = tv.getSelectionModel().getSelectedItem();
                    List<Map<String, Object>> subTableItems = childSensorMap.get(selectedItem.get("sensor_code").toString());
                    if (CollectionUtils.isNotEmpty(subTableItems)) {
                        detailsPane = constructSubTable(FXCollections.observableArrayList(subTableItems));
                        this.getChildren().add(detailsPane);
                    }
                } else {
                    if (detailsPane != null) {
                        this.getChildren().remove(detailsPane);
                        detailsPane = null;
                    }
                }
            }
            // this.requestLayout();
        });
    }
    @Override
    protected double computePrefHeight(double width) {
        if (isSelected() && detailsPane != null) {
            return super.computePrefHeight(width) + detailsPane.prefHeight(60);
        } else {
            return super.computePrefHeight(width);
        }
    }

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

`Web` 端实现的子表格是有首行缩进效果，这里也遵循原样式，子表格的样式代码如下:

```java
subTable.getColumns().addAll(list);
subTable.setItems(items);
// 设置子表格高度
subTable.setPrefHeight(60 + (items.size() * 47));
// 设置左侧缩进
subTable.setPadding(new Insets(0, 0, 0, 50));
subTable.setStyle("-fx-border-color: #42bff4;");
```

最终实现效果如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16544937743846619dc0f6265bf4817450813738113b1.png)

### 参考文档

[Javafx Tables inside row table](https://stackoverflow.com/questions/47995936/javafx-tables-inside-row-table)

[JavaFX SubTable Demo](https://gist.github.com/sh9va/c81b9de44811cc860951701124941c1e)
