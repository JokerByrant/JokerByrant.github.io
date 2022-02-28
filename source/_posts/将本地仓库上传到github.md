---
title: 将本地仓库上传到github
tags: git
categories: 后端技术
abbrlink: 12637
date: 2022-01-25 23:39:15
---

之前有记录过这个操作，但是时间一长久忘记了相关步骤，这里再重新记录一下。

<!--more-->

### 操作步骤

```xml
# 初始化git仓库
git init
# 将文件标记并提交 
git add .
git commit -m 'xxx'
# 绑定github仓库
git remote add origin 仓库地址
# 推送到指定分支
git push -u origin main
```

### 将master分支合并到main

`Github` 中目前默认的分支是 `main`，在进行最后一步推送操作时，可能会遵循以前的习惯，将分支写成 `master`。之后如果需要切换分支到 `main` 的话，可以按如下步骤进行：

```xml
# 切换分支
git switch main
# 拉取master分支，这一步操作可能会导致部分代码冲突
git pull origin master --allow-unrelated-histories
# 将master分支合并到main分支
git merge --no-ff master
# --no-ff会在merge时生成一个新的commit，因此需要重新提交本地文件
git commit -m '合并master'
# 将提交推送到main分支
git push
# 删除远程master分支
git push -d origin master
```

上面命令中几个注意事项：

1. `--allow-unrelated-histories` 该命令是为了解决错误 `fatal: refusing to merge unrelated histories`，这个错误是在执行 `merge` 操作时产生的，原因是两个分支没有关联，这个命令的作用就是合并两个不相关分支的历史。
2. `--no-ff` 该命令是在 `merge` 操作时使用到的，主要作用是在 `marge` 时生成一个新的 `commit`。具体用法见：[分支管理策略](https://www.liaoxuefeng.com/wiki/896043488029600/900005860592480)
3.  在执行完 `git pull origin master --allow-unrelated-histories` 后，可能会有一些代码冲突，需要解决完冲突再进行下一步操作。