---
title: 不下载zip文件获取文件列表
date: 2024-08-20
summary: 一个小Tip，可以在用来下载大文件zip压缩包之前，先知晓压缩包中的文件列表。
lastMod: 2024-08-20T17:29:49.820Z
tags: [Zip, Tip]
category: Tip
---

一个小Tip，可以在用来下载大文件zip压缩包之前，先知晓压缩包中的文件列表

> zip文件的目录信息存储在文件的尾部，因此我们只需要下载最后面一点点内容就能看到里面都有些什么文件。

## 以vscode为例

1. 先用cURL请求查看一下响应头

```bash
curl -I https://vscode.download.prss.microsoft.com/dbazure/download/stable/fee1edb8d6d72a0ddff41e5f71a671c23ed924b9/VSCode-win32-x64-1.92.2.zip
```

```bash
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 139516845
Cache-Control: public, max-age=86400
Content-Disposition: attachment; filename=VSCode-win32-x64-1.92.2.zip; filename*=UTF-8''VSCode-win32-x64-1.92.2.zip
Content-Type: application/octet-stream
Etag: "0x384303F8B4C49AFF47F905A745E5A4A7358E23744DCDE3FD92F66EA3C92B3687"
Last-Modified: Wed, 14 Aug 2024 19:06:24 GMT
X-Ms-ApiVersion: Distribute 1.2
X-Ms-Region: prod-weu-z1
Accept-Ranges: bytes
Date: Tue, 20 Aug 2024 14:18:59 GMT
Via: 1.1 varnish
Age: 59889
X-Served-By: cache-nrt-rjtf7700073-NRT
X-Cache: HIT
X-Cache-Hits: 1
X-Timer: S1724163539.200758,VS0,VE1
X-CID: 3
X-CCC: JP
```

其中需要在响应头关注的内容：

- **accept-ranges**: bytes 表示可以分段下载
- **content-length**: 139516845 表示文件的大小

1. 这里我们把文件大小数值-1000000，下载最后1M大小的内容，保存为vscode.zip

```bash
curl -H "Range: bytes=138516845-" https://vscode.download.prss.microsoft.com/dbazure/download/stable/fee1edb8d6d72a0ddff41e5f71a671c23ed924b9/VSCode-win32-x64-1.92.2.zip -o vscode.zip
```

1. 最后使用zipinfo命令的`-s`参数查看文件列表

```bash
zipinfo -s vscode.zip
```

输出：

```bash
Archive:  vscode.zip
Zip file size: 1000000 bytes, number of entries: 1504
error [vscode.zip]:  missing 138516845 bytes in zipfile
  (attempting to process anyway)
drwx---     6.3 fat        0 bx stor 24-Aug-14 18:50 bin/
-rw-a--     6.3 fat     2001 bx defN 24-Aug-14 18:14 bin/code
-rwxa--     6.3 fat 20124728 bx defN 24-Aug-14 18:50 bin/code-tunnel.exe
-rwxa--     6.3 fat      178 bx defN 24-Aug-14 18:14 bin/code.cmd
-rw-a--     6.3 fat   150045 bx defN 24-Aug-14 18:14 chrome_100_percent.pak
-rw-a--     6.3 fat   225418 bx defN 24-Aug-14 18:14 chrome_200_percent.pak
-rwxa--     6.3 fat 167933360 bx defN 24-Aug-14 18:51 Code.exe
......
```
