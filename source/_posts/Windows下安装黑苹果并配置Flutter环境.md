---
title: Windows下安装黑苹果并配置Flutter环境
tags: Flutter
categories: Flutter
abbrlink: 5007
date: 2022-07-13 10:36:57
---
 之前尝试过在 `VMWare` 上安装黑苹果来运行 `Flutter` 的 `IOS` 端，但是卡在了安装 `XCode` 这一步。这次 `Flutter` 端在接入 `IOS` 的 `Notification Service Extension` 时遇到很多问题，于是就想自己配置一个 `MacOs` 环境来协助他解决这个问题。下面是全部的安装过程。

<!--more-->

## 系统安装

之前安装的 `MacOS` 版本是 `11.6.6` 的，这次选择了 `10.15.5`，因为搜索出来的安装教程中大多使用的都是这个版本。

在 [Windows 安装 MacOS 10.15 虚拟机调试 Flutter iOS 应用](https://www.lcgod.com/articles/139) 这篇博客中有详细的安装步骤，包括各种需要的资源都有，我这里就不再赘述了。

### dmg镜像转cdr

在下载系统镜像时，下载的镜像后缀是 `dmg` 类型的，而 `vmware` 需要的镜像类型是 `cdr` 的，因此需要对下载下来的镜像进行处理。

找到了一篇文章：[windows系统下，如何将dmg文件转化为cdr文件](https://blog.csdn.net/qq_45854074/article/details/111566055)。

选择 `Tools` 菜单，点击 `create disk image`

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664526553662a96c759b64f00735fd51cefeaa6d5b29.png)

选择转换后 `cdr` 文件存储位置，注意文件名要自己修改，后缀设置为 `cdr`

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664526564661c9ddd15eacd5f84991ab30593ebd7751.png)

等待转换完成即可

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664526571663b49a38bb9aee503cb825d2c789a64d59.png)

转换成功

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664526577666d8d6bef074b8a5a9fcf51544c0d41e71.png)

## 分辨率调整(优化系统卡顿)

在安装完 `VMWare Tools` 后，发现系统异常的卡顿，完全不能正常操作。于是尝试将 `VMWare Tools` 卸载，卡顿感大大降低，已经不影响正常使用了。但是 `VMWare Tools` 是必不可少的，所以这么做只能算拆东墙补西墙。

针对这个问题，我猜测是与我的电脑配置有关，我的电脑分辨率是 `2k` 的，查看安装了 `VMWare Tools` 后的 `MacOs`，发现分辨率也是 `2k`。但是 `MacOS` 的显存只有 `128M`，显然不足以带动这么高的分辨率。于是猜测，是否可以通过调整虚拟机的分辨率，来优化系统运行速度。

在虚拟机的设置中找到了这个配置，如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664242653944e8285b0a2d972b3c5b6d861476e196a2.png)

将其调整后，重新运行虚拟机，卡顿感大大减轻！

## 安装 `XCode`

正常的安装 `XCode` 是直接在 `AppStore` 中安装就可以了，但是由于安装的 `MacOs` 版本比较老，`AppStore` 中无法直接下载，会报下面的提示：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424266593951dbf4fefadb389fae12f07ea3c52fea.png)

因此只能通过手动下载安装包的方式来安装，前往 [XCode 下载地址](https://xcodereleases.com/)，找支持当前系统版本的 `XCode`，我的 `MacOS` 版本是 `10.15.5`，下载的 `XCode` 版本是 `12.1` （***注：如果之后需要安装 `Flutter`，需要首先确定对应的 `Flutter` 版本支持的最低版本 `XCode`，我在这里就踩了个坑，开始选择的 `XCode` 版本是 `11.7`，之后安装的 `Flutter` 版本是 `2.8.1`，在执行 `flutter doctor` 时被提示 `XCode` 版本过低，最低支持 `12.0.1` 版本的，导致我又重新安装了一遍***）：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642426729391fc9edc32beb786d6065cf727f055f6a.png)

安装完毕之后打开 `XCode`，检查一下下面的配置是否配置，如果不配置的话，之后执行 `flutter doctor` 将找不到已安装的 `XCode`。

## `pod install` 卡住

是在执行红框中的命令时卡住的，原因是这个项目太大了

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664242683941a546431bca43dba0d3ef0de062aa2fab.png)

可以通过下面的链接查看这个项目的大小：[链接](https://api.github.com/repos/CocoaPods/Specs)。这是github的api，打开之后显示一串json，是项目的相关信息，在里面找size，即是项目大小。换算下来是 `965.9M`，所以下载肯定是需要一定时间的。

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664242693941b30f47997ca875acacc99ac26edeecfb.png)

但是这么一直干等也不是办法，在 `Mac` 系统中可以通过 **活动监视器** 来查看当前的下载进程，如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642427009403453dd0941de1c898a687e5db72bf518.png)

`clone` 下来后安装步骤继续执行，之后报了一个错误，`MobileVlcKit` 依赖安装失败：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664242709941b2d4e5810c4489f51e1751f100663b76.png)

目前发现这个错误对项目的运行并没有影响，所以暂时没有处理。

## `Java` 环境配置

首先下载 `JDK`：[JDK8 - MacOS 下载地址](https://www.oracle.com/java/technologies/downloads/#java8-mac)

下载安装完毕后，需要配置 `Java` 环境，打开 

[Mac电脑Java环境安装](https://www.jianshu.com/p/1a7266619d36)

## `SVN` 安装

首先需要安装 `HomeBrew` 工具，`Homebrew` 是一款 `MacOS` 平台下的软件包管理工具，拥有安装、卸载、更新、查看、搜索等很多实用的功能。安装命令如下：

```sh
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

接着使用下面的命令安装 `SVN`

```sh
brew install subversion
```

之后可以安装一些 `SVN` 的客户端，由于我之后会使用 `Android Studio`，里面已经集成了 `SVN` 的一些基本功能，所以这里就不再安装第三方客户端了。

使用 `SVN` 将代码拉取下来：

```sh
svn checkout [仓库地址] 
```

## `Android Studio` 安装

官网下载：[地址](https://developer.android.com/studio)

安装成功后，打开 `Android Studio`。安装 `Flutter`、`Dart` 插件，如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664242717938568e77558f8eab50cd746103e39d4c27.png)

## `Android Studio` 上找不到真机设备

如下，将设备连接到电脑上时，`Android Studio` 中没有显示对应的设备

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424273593906817b35428c29f63d04ba9d4fa50e85.png)

在 `VMWare` 的虚拟机选项中可以找到设备的连接信息，如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664242749938e8320e41ed835754ae7a36a04c0093ab.png)

这个问题也与虚拟机设置有关，调整虚拟机设置中的 `USB` 选项即可，如下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664242758938515215cbe332290b1163871ecd661779.png)

之后重启虚拟机，连接设备，成功找到

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642427669405085e117a656dc994589b3faa96d3ecc.png)

## 扩展 `MacOS` 的磁盘空间

在 `Android Stuio` 中 `Build` 项目时，发现磁盘空间已经不够了，需要对磁盘空间进行拓展。

这篇博客中有完整的拓展磁盘空间的方法：[MacOS 10.15 VMware 虚拟机扩展磁盘](https://www.pcoic.com/tool/1372.html)。

## 使用 `XCode` 构建时报错找不到依赖

错误信息如下，报错的位置是 `GeneratedPluginRegistrant.m` 文件：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424277294260d011f4d32d934c50ed0391c4daf9ee.png)

在 [GeneratedPluginRegistrant.m Module not found.](https://github.com/flutter/flutter/issues/53573) 这篇讨论中有好多种解决办法，尝试了其中的几种，最终我的处理办法如下：

1. 首先将原先 `ios` 目录下 `pod` 生成的几个文件和文件夹全部移除，接着执行 `flutter clean` 命令
2. 然后执行 `flutter pub get`
3. 之后运行 `flutter build ios`，初次运行可能会报错，其中某些依赖找不到，这时需要修改 `Podfile` 文件，增加如下配置：[参考文章](https://www.jianshu.com/p/d90c9419a11c)
   ```xml
   source 'https://github.com/aliyun/aliyun-specs.git'
   source 'https://github.com/CocoaPods/Specs.git'
   ```
   
   然后还有可能报错 `curl: (60) SSL certificate problem: certificate has expired`，可以在命令行执行下面的命令：[参考文章](https://blog.csdn.net/weixin_43456810/article/details/125602223)
   ```sh
   echo insecure >> ~/.curlrc
   ```
4. 之后再运行 `flutter build ios` 就可以了(***可能需要等待一段时间***)

上面的第3步在与 `flutter` 端同事沟通后，得知他的解决办法是直接修改 `Podfile` 文件，他的 `Podfile` 文件内容如下：

```xml
# Uncomment this line to define a global platform for your project
# platform :ios, '9.0'

# CocoaPods analytics sends network stats synchronously affecting flutter build latency.
source 'https://github.com/aliyun/aliyun-specs.git'
source 'https://github.com/CocoaPods/Specs.git'

ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}

def flutter_root
  generated_xcode_build_settings_path = File.expand_path(File.join('..', 'Flutter', 'Generated.xcconfig'), __FILE__)
  unless File.exist?(generated_xcode_build_settings_path)
    raise "#{generated_xcode_build_settings_path} must exist. If you're running pod install manually, make sure flutter pub get is executed first"
  end

  File.foreach(generated_xcode_build_settings_path) do |line|
    matches = line.match(/FLUTTER_ROOT\=(.*)/)
    return matches[1].strip if matches
  end
  raise "FLUTTER_ROOT not found in #{generated_xcode_build_settings_path}. Try deleting Generated.xcconfig, then run flutter pub get"
end

require File.expand_path(File.join('packages', 'flutter_tools', 'bin', 'podhelper'), flutter_root)

flutter_ios_podfile_setup

target 'Runner' do
  use_frameworks!
  use_modular_headers!
  # pod 'AlipaySDK-iOS'
  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    target.build_configurations.each do |config|
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
        '$(inherited)',
        ## dart: PermissionGroup.calendar
        'PERMISSION_EVENTS=1',

        ## dart: PermissionGroup.reminders
        # 'PERMISSION_REMINDERS=1',

        ## dart: PermissionGroup.contacts
        'PERMISSION_CONTACTS=1',

        ## dart: PermissionGroup.camera
        'PERMISSION_CAMERA=1',

        ## dart: PermissionGroup.microphone
        'PERMISSION_MICROPHONE=1',

        ## dart: PermissionGroup.speech
        # 'PERMISSION_SPEECH_RECOGNIZER=1',

        ## dart: PermissionGroup.photos
        'PERMISSION_PHOTOS=1',

        # dart: [PermissionGroup.location, PermissionGroup.locationAlways, PermissionGroup.locationWhenInUse]
        'PERMISSION_LOCATION=1',

        ## dart: PermissionGroup.notification
        'PERMISSION_NOTIFICATIONS=1',

        ## dart: PermissionGroup.mediaLibrary
        'PERMISSION_MEDIA_LIBRARY=1',

        ## dart: PermissionGroup.sensors
        # 'PERMISSION_SENSORS=1',

        ## dart: PermissionGroup.bluetooth
        'PERMISSION_BLUETOOTH=1',

        ## dart: PermissionGroup.appTrackingTransparency
        # 'PERMISSION_APP_TRACKING_TRANSPARENCY=1',

        ## dart: PermissionGroup.criticalAlerts
        'PERMISSION_CRITICAL_ALERTS=1',
      ]
    end
  end
end
```

修改 `Podfile` 后执行 `flutter build ios` ，发现还有报错：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166424278894110339103a71153f3551574e8f5ad1ca2.png)

这里搜遍了各种博客都没找到解决办法，与 `App` 端同事的配置进行了对比也没有差异。执行了清除本地依赖然后重新拉取的操作也无济于事，目前只能猜测是我的 `XCode` 版本比较低：`12.1`。最后无奈之下只能将这两处报错的代码注释掉，项目才运行起来。

## 构建App时报错

报错信息如下

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16645265866647f322b8c9f3389bbe327fce8904d66a6.png)

`App` 端同事提示可以直接在 `XCode` `Run` 也可以，尝试了一下，`Build Successed`，但是在安装时出现了下面的提示：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166452659766391ef4b6e3f3f1c6bdc2d24b6c829c297.png)

在 `Google` 上搜索了一下，发现可能是 `XCode` 版本过低导致的，我的设备是 `Apple 11`，对应的系统是 `IOS 15.4`，`XCode` 版本只有 `12.1`，在 `StackOverflow` 上有人给了一个 `XCode` 和 `IOS` 版本的对应关系表：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16645266026637c6c9b73715a4f9779c26d6b0fe62ac4.png)

这个问题目前只能通过升级 `XCode` 来解决，但是当前版本的系统不支持更高版本的 `XCode` 了，因此目前这个问题没法解决。真机调试也就没法继续了，目前只能将 `App` 运行在虚拟机上进行测试，之后尝试一下安装更高版本的 `MacOs`。

## 解决构建时的报错(2022-10-12)

无意间发现了一篇文章：[Could not locate device support files](https://ighibli.github.io/2017/03/28/Could-not-locate-device-support-files/)，可以解决 `Xcode` 版本过低但 `IOS` 版本过高，导致不能进行真机调试的问题。

这个处理办法是添加一个适配指定 `IOS` 版本的包到 `XCode` 安装目录，之后就可以进行真机调试了。先从 [适配包下载地址](https://github.com/iGhibli/iOS-DeviceSupport) 下载指定版本的包，比如我的 `IOS` 设备版本是 `15.5`，就下载 `15.5` 版本的包，然后按照 [Could not locate device support files](https://ighibli.github.io/2017/03/28/Could-not-locate-device-support-files/) 这个里面的教程，将下载下来的包放入 `XCode` 的指定目录下：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1665560479120483ad2a020c895e8cc07b90c95bf0bec.png)

之后重启 `XCode`，重新构建项目，报了下面的错误，与之前不一样：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1665560490114e5b814266c75f1cb92572f75c9cb8a0e.png)

按照 [iPhone not connected. Xcode will continue when iPhone is connected](https://stackoverflow.com/questions/46014400/iphone-not-connected-xcode-will-continue-when-iphone-is-connected) 给的解决办法处理一下即可：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/166556050111402fd85d6d8d052cd72e82d2727a12e91.png)

解决之后进入 `Xcode` 的 `window -> Devices and Simulators` 菜单，应该没有报错信息：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16655605111169e75f55e8b2bc4efb6b73c259951369c.png)

之后重新构建，成功触发了安装进程，但是又报了错误：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1665560520117c6a41ff8db9a6c3a9c8f8f6652693d88.png)

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16655605251177a4c02d362fee07a07b8f5f2c6952c8a.png)

在 [The code signature version is no longer supported](https://stackoverflow.com/questions/68467306/the-code-signature-version-is-no-longer-supported) 找到了解决办法：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16655605331156c6d54dacc796107b4dd3af000e6b800.png)

在 `XCode` 中添加如下配置即可：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1665560557119b2506559406fc6fc8b8cef6ad572940d.png)

之后重新进行构建，可以在下面的 `Tag` 中查看构建进程

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1665560564114cd4e888b0315b13f09d772ad5fa64cf2.png)

等待一段时间后，安装成功！

### 通过 `Flutter` 安装 `release` 版

上面通过 `Xcode` 安装的 `App` 必须插上数据线才能运行，数据线一旦断开 `App` 将无法运行。解决办法就是通过 `Flutter` 安装 `release` 版。

> 注：虽然安装的是 `release` 版，但对应的 `Api` 服务地址还是线下的，如果使用线上的 `Api` 地址，推送将无法送达。

直接在 `Android Studio` 的 `terminal` 中执行命令：`flutter run --release`。之前运行这个命令时是会报错的，无法安装成功。

等待一段时间后，安装成功！

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1665560576115af344bdda68f040dec6525b9da03daf5.png)
