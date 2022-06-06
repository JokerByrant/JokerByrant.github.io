---
title: JavaFX使用MapValueFactory渲染表格数据时的数据刷新问题
tags: JavaFX
categories: 后端技术
abbrlink: 49181
date: 2022-04-15 13:32:45
---

最近在做一个桌面端的项目，使用的技术栈是 `JavaFX`。刚开始开发的很顺，因为都是一些简单的表单和数据渲染。现在在渲染表格这一块儿卡住了，主要问题是表格数据的绑定和刷新问题，下面是解决的过程。

<!--more-->

### 问题描述

在 `JavaFx` 中对表格数据的渲染一般是使用 `PropertyValueFactory` 进行处理，比如下面的案例：

```java
import javafx.application.Application;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.scene.Group;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.VBox;
import javafx.scene.text.Font;
import javafx.stage.Stage;

public class TreeTableView extends Application {
    private TableView<Person> table = new TableView<Person>();

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage stage) {
        Scene scene = new Scene(new Group());
        stage.setTitle("Table View Sample");
        stage.setWidth(450);
        stage.setHeight(500);

        final Label label = new Label("Address Book");
        label.setFont(new Font("Arial", 20));

        constructTable();
        final VBox vbox = new VBox();
        vbox.setSpacing(5);
        vbox.setPadding(new Insets(10, 0, 0, 10));
        vbox.getChildren().addAll(label, table);

        ((Group) scene.getRoot()).getChildren().addAll(vbox);

        stage.setScene(scene);
        stage.show();
    }

    private void constructTable() {
        TableColumn<Person, String> firstNameCol = new TableColumn<Person, String>("First Name");
        firstNameCol.setMinWidth(100);
        firstNameCol.setCellValueFactory(new PropertyValueFactory<Person, String>("firstName"));

        TableColumn<Person, String> lastNameCol = new TableColumn<Person, String>("Last Name");
        lastNameCol.setMinWidth(100);
        lastNameCol.setCellValueFactory(new PropertyValueFactory<Person, String>("lastName"));

        TableColumn<Person, String> emailCol = new TableColumn<Person, String>("Email");
        emailCol.setMinWidth(200);
        emailCol.setCellValueFactory(new PropertyValueFactory<Person, String>("email"));

        table.setItems(getData());
        table.getColumns().addAll(firstNameCol, lastNameCol, emailCol);
    }

    private ObservableList<Person> getData() {
        return FXCollections.observableArrayList(new Person("Jacob", "Smith", "jacob.smith@example.com","Jacob Street","NY"),
                new Person("Isabella", "Johnson", "isabella.johnson@example.com","Isabella Street","DL"),
                new Person("Ethan", "Williams", "ethan.williams@example.com","Ethan Street"," ML"),
                new Person("Emma", "Jones", "emma.jones@example.com","Emma Street","EL"),
                new Person("Michael", "Brown", "michael.brown@example.com","Michael Street","ML"));
    }

    public static class Person {
        private final SimpleStringProperty firstName;
        private final SimpleStringProperty lastName;
        private final SimpleStringProperty email;

        Person(String fName, String lName, String email,String streetS, String cityS) {
            this.firstName = new SimpleStringProperty(fName);
            this.lastName = new SimpleStringProperty(lName);
            this.email = new SimpleStringProperty(email);
        }

        public String getFirstName() {
            return firstName.get();
        }

        public void setFirstName(String fName) {
            firstName.set(fName);
        }

        public String getLastName() {
            return lastName.get();
        }

        public void setLastName(String fName) {
            lastName.set(fName);
        }

        public String getEmail() {
            return email.get();
        }

        public void setEmail(String fName) {
            email.set(fName);
        }
    }
}
```

`PropertyValueFactory` 配合定义好的实体组成表格的数据，这是最常用的方式。注意上面给出的案例中 `Person` 实体的参数使用 `xxxProperty` 进行定义，这样定义的好处是：**当表格绑定的 `items` 数据发生变化时，表格数据会自动更新，无需手动执行刷新操作。**

但是会有一些特殊的场景，比如给定的数据是一个 `Map` 类型的，这时就要使用 `MapValueFactory` 来定义表格的数据类型，如下：

```java
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import javafx.application.Application;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.scene.Group;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.MapValueFactory;
import javafx.scene.layout.VBox;
import javafx.scene.text.Font;
import javafx.stage.Stage;

import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class TreeTableView extends Application {
    private TableView<Map<String, Object>> table = new TableView<>();

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage stage) {
        Scene scene = new Scene(new Group());
        stage.setTitle("Table View Sample");
        stage.setWidth(450);
        stage.setHeight(500);

        final Label label = new Label("Address Book");
        label.setFont(new Font("Arial", 20));

        constructTable();
        final VBox vbox = new VBox();
        vbox.setSpacing(5);
        vbox.setPadding(new Insets(10, 0, 0, 10));
        vbox.getChildren().addAll(label, table);

        ((Group) scene.getRoot()).getChildren().addAll(vbox);

        stage.setScene(scene);
        stage.show();
    }

    private void constructTable() {
        TableColumn<Map<String, Object>, String> firstNameCol = new TableColumn<Map<String, Object>, String>("First Name");
        firstNameCol.setMinWidth(100);
        firstNameCol.setCellValueFactory(new MapValueFactory("firstName"));

        TableColumn<Map<String, Object>, String> lastNameCol = new TableColumn<Map<String, Object>, String>("Last Name");
        lastNameCol.setMinWidth(100);
        lastNameCol.setCellValueFactory(new MapValueFactory("lastName"));

        TableColumn<Map<String, Object>, String> emailCol = new TableColumn<Map<String, Object>, String>("Email");
        emailCol.setMinWidth(200);
        emailCol.setCellValueFactory(new MapValueFactory("email"));

        table.setItems(getData());
        table.getColumns().addAll(firstNameCol, lastNameCol, emailCol);
    }

    private ObservableList<Map<String, Object>> getData() {
        List<Person> list = new LinkedList<>(Arrays.asList(new Person("Jacob", "Smith", "jacob.smith@example.com","Jacob Street","NY"),
                new Person("Isabella", "Johnson", "isabella.johnson@example.com","Isabella Street","DL"),
                new Person("Ethan", "Williams", "ethan.williams@example.com","Ethan Street"," ML"),
                new Person("Emma", "Jones", "emma.jones@example.com","Emma Street","EL"),
                new Person("Michael", "Brown", "michael.brown@example.com","Michael Street","ML")));
        ObservableList<Map<String, Object>> observableList = FXCollections.observableArrayList();
        for (Person person : list) {
            observableList.add(JSONObject.parseObject(JSON.toJSONString(person)));
        }
        return observableList;
    }

    public static class Person {
        private final SimpleStringProperty firstName;
        private final SimpleStringProperty lastName;
        private final SimpleStringProperty email;

        Person(String fName, String lName, String email,String streetS, String cityS) {
            this.firstName = new SimpleStringProperty(fName);
            this.lastName = new SimpleStringProperty(lName);
            this.email = new SimpleStringProperty(email);
        }

        public String getFirstName() {
            return firstName.get();
        }

        public void setFirstName(String fName) {
            firstName.set(fName);
        }

        public String getLastName() {
            return lastName.get();
        }

        public void setLastName(String fName) {
            lastName.set(fName);
        }

        public String getEmail() {
            return email.get();
        }

        public void setEmail(String fName) {
            email.set(fName);
        }
    }
}
```

这样定义之后出现了一个问题：**如何实现数据变更时刷新表格？**

网上给出的案例，大多都是关于 `PropertyValueFactory` 的。关于 `MapValueFactory` 实现监听数据变化的方法也找到一个：[使用HashMap填充TableView，该列表将在HashMap更改时更新](https://mlog.club/article/2669254)。但这个案例与我的需求还是不同，它的表格 `items` 绑定的数据类型是 `Map`，我的表格 `items` 绑定的是 `List<Map>`，因此这种方案仍然不能解决这个痛点。

当然还有一种方案也可以实现表格数据刷新的功能：**通过 `tableView.refresh()` 来刷新表格。**我也尝试了这种方案，但是由于项目的表格样式进行了自定义处理，这样刷新后表格会出现样式问题，如下：**被选中的列在 `refresh` 后数据会消失**

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1654493682388dc9ffd7fe3512cd6fee1c3493864aee1.png)

分析了原因，发现是因为表格 `refresh` 后 `hover` 样式导致的。因此只能另想办法，经过多次尝试，找到了解决办法。

### 解决方案

在进行 `tableView.setItems()` 时，对绑定的 `List<Map>` 数据进行一次额外的处理：**`map` 的 `value` 调整为 `xxxProperty` 类型**，如下：

```java
/**
 * 更新实时数据
 * 注：表格数据绑定的数据类型为 xxxProperty，这样当数据发生变化，TableView能监听到，就不用再手动refresh了
 * @param map 实时数据对应的数据
 * @param key 要更新的列名
 * @param newValue 要更新的值
 */
private void updateMapValue(Map<String, Object> map, String key, Object newValue) {
    Object value = map.get(key);
    StringProperty property = (value == null) ? new SimpleStringProperty() : (StringProperty) value;
    property.setValue(newValue.toString());
    map.put(key, property);
}
```

在对 `map` 数据进行上面的处理后，再将其绑定到表格的 `items` 中，这样当数据更新后，表格的数据也能实时刷新。

### 参考文档

[JavaFx TableView 实时的根据行对象数据变化刷新](https://blog.csdn.net/u010061897/article/details/68478254)

[使用HashMap填充TableView，该列表将在HashMap更改时更新](https://mlog.club/article/2669254)