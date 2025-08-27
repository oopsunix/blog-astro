---
title: Windows 配置多版本JDK
date: 2024-06-14
summary: Windows下安装配置多版本JDK，并实现版本快捷切换。
tags: [JDK, Windows]
category: Windows
---

## 配置环境变量

在系统变量中

- 新建 `JAVA_HOME` 环境变量值：`%JAVA_HOME8%` 或 `%JAVA_HOME11%`

- 新建 `JAVA_HOME8` 和 `JAVA_HOME11` 值：分别指向 jdk8 和 jdk11 的安装目录

- 在 PATH 中新增值：`%JAVA_HOME%\bin` 和 `%JAVA_HOME%\jre`

下面这两项需要下移到 `%JAVA_HOME%\bin` 和 `%JAVA_HOME%\jre\bin` 的后面，防止变量覆盖导致版本切换不成功。

```
C:\Program Files\CommonFiles\Oracle\Java\javapath
C:\Program Files (x86)\Common Files\Oracle\Java\javapath
```

这样切换版本时只需修改JAVA_HOME的值

## 创建 powershell 别名实现快捷切换

### 设置临时别名

1. 创建 java8 和 java11 的别名

```powershell
New-Alias -Name java11 -Value "D:\SDE\Java\jdk-11.0.21\bin\java.exe"
New-Alias -Name java8 -Value "D:\SDE\Java\jdk1.8.0_211\bin\java.exe"
```

2. 使用别名

```powershell
PS C:\> java11 -version
java version "11.0.21" 2023-10-17 LTS
Java(TM) SE Runtime Environment 18.9 (build 11.0.21+9-LTS-193)
Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.21+9-LTS-193, mixed mode)

PS C:\> java8 -version
java version "1.8.0_211"
Java(TM) SE Runtime Environment (build 1.8.0_211-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.211-b12, mixed mode)
```

这样创建的别名仅保存在当前会话中。若要实现打开PowerShell就存在别名，需要将别名添加到 PowerShell 配置文件。

### 设置永久别名

在 Powershell 中，有一个变量 Profile 定义了Powershell启动时默认加载的配置文件

1. 查看 Powershell 启动时默认加载的配置文件

```powershell
Get-Variable Profile
```

2. 虽然有这个变量，但是不代表这个文件真的存在，进一步查看这个文件是否存在

```powershell
Test-Path $profile
```

3. 上面返回的 False 代表这个路径不存在（一般该文件在没有单独创建之前都是不存在的），现在创建该配置文件

```powershell
New-Item -Type file -Force $profile
```

4. 创建完成后可以再次运行`Test-Path $profile`命令进行测试

5. 添加别名到$Profile 中，可以使用文本编辑器进行编辑添加，这里使用命令行进行添加操作，执行命令：

```powershell
Add-Content $Profile 'Set-Alias -Name java11 -Vaule "D:\SDE\Java\jdk-11.0.21\bin\java.exe"'

Add-Content $Profile 'Set-Alias -Name java11 -Vaule "D:\SDE\Java\jdk1.8.0_211\bin\java.exe"'
```

6. 最后查看命令是否添加成功，执行命令：

```powershell
Get-Content $profile
```

![](https://img.akams.cn/image-20231215152848830.png)

## 创建 cmd 别名实现快捷切换

1. 新建bat文件

在某个目录下（建议在用户根目录）新建文件alias.bat , 输入自己需要的常用命令的别名。

以我目前使用的alias.bat为例：

```
@echo off
doskey java8=D:\SDE\Java\jdk1.8.0_211\bin\java.exe $*
doskey java11=D:\SDE\Java\jdk-11.0.21\bin\java.exe $*
doskey java17=D:\SDE\Java\jdk-17.0.11\bin\java.exe $*
doskey java21=D:\SDE\Java\jdk-21.0.3\bin\java.exe $*
doskey ls=dir /b $*
doskey ll=dir /ONE $*
doskey pwd=cd
doskey mkdir=md $*
doskey lt=dir /OD $*
doskey history=doskey  /history
doskey alias=doskey /macros
echo 别名完成载入，键入alias查看
```

2. 修改注册表，使cmd启动时自动执行该bat文件

`win+r`，键入`regedit`，进入地址：`计算机\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Command Processor`，右键新建`字符串值`，命名为`AutoRun`，值为.bat文件绝对路径，例如：`C:\alias.bat`
