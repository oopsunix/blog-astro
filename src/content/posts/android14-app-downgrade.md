---
title: Android 14 通过 adb 保留数据降级软件
date: 2024-10-30
summary: 在高版本安卓中实现保留数据降级软件版本。
lastMod: 2024-10-30T17:28:59.820Z
tags: [Android]
category: Android
---

# Android 14 通过 adb 保留数据降级软件

在高版本安卓中，通过`adb install -d -r file.apk` 似乎已经无法保留数据降级了，需要先保留数据卸载再重新安装旧版本安装包才能正常降级。

此方法理论上适用Android 14 ±任意几个版本

首先确保已经安装好[platform-tools](https://android-docs.cn/tools/releases/platform-tools)，将设备连接到电脑，打开一个cmd窗口：

1. 保留数据卸载原版本：

   ```shell
   adb shell cmd package uninstall -k com.tencent.mm
   ```

   _这里以微信_`com.tencent.mm`_为例，将其替换成你需要卸载的包名_

2. 重启设备 **==【重要】==**

   ```shell
   adb reboot
   ```

3. 重新安装旧版本安装包：

   ```shell
   adb install wechat.apk
   ```

   其中`wechat.apk`替换成需要安装的安装包路径
