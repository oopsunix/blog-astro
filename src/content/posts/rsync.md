---
title: 使用 Rsync 实现服务器之间的高效文件同步
date: 2025-09-07
summary: 使用 Rsync 实现服务器之间的高效文件同步
lastMod: 2025-09-07T07:29:49.820Z
tags: [Rsync, Linux]
category: Linux
---

## 使用 Rsync 实现服务器之间的高效文件同步

**Rsync**是一款功能强大且多功能的文件复制工具，可让您**同步本地和远程目录**。它可用于在两台计算机之间复制文件和目录，或使同一台计算机上的两个目录保持同步。

Rsync 非常高效，因为它只传输自上次同步以来已更改的文件部分。这使得它非常适合同步包含大量经常更改的文件的大型目录。

- 通过 SSH 同步目录，
- 在传输过程中压缩数据，
- 保留文件权限和时间戳，
- 删除目标目录中源目录中不存在的文件。

**Rsync 语法：**

```undefined
rsync [options] [source] [destination]
```

**Rsync常用选项**：

- `-a` (`--archive`)：存档模式；此选项可确保保留符号链接、权限、时间戳和其他重要信息。
- `-v` (`--verbose`)：增加详细程度。
- `-r` (`--recursive`)：递归同步目录。
- `--delete`：从目标中删除源中不存在的文件。如果您想要文件同步，则应该使用此选项。
- `-z` (`--compress`)：在传输过程中压缩数据。
- `-h` (`--人类可读`)：以人类可读的格式显示数字。
- `-P`：结合`--partial`（保留部分传输的文件）和`--progress`（显示传输过程中的进度）。

确保两个服务器上都安装了 rysnc，并且对源目录和目标目录都具有必要的权限。

```
rsync -avzhP remoteuser@remote_host:/var/www/production_site/ /home/myuser/site_backup/
```

**参考链接：**

- https://cn.linux-terminal.com/?p=4264
