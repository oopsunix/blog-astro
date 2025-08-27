# 博客系统更新记录

## 功能更新：文章隐藏功能 (2025-08-27)

### 📋 需求描述

在文章头部增加一个 `hide` 参数，当设置 `hide: true` 时：

- 文章可以正常渲染和访问
- 不会在页面的最新发布列表中显示
- 不会在归档页面中显示
- 不会在分类和标签页面中显示
- 不会在RSS订阅中显示
- 只能通过直接链接访问

### 🔧 实现方案

#### 1. 修改内容配置 (`src/content/config.ts`)

在 `postsCollection` 的 schema 中添加 `hide` 字段：

```typescript
const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    lastMod: z.date().optional(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    comments: z.boolean().default(true),
    draft: z.boolean().default(false),
    sticky: z.number().default(0),
    hide: z.boolean().default(false), // 新增字段
  }),
})
```

**变更说明**：

- 添加 `hide` 字段，类型为布尔值
- 默认值为 `false`（不隐藏）
- 支持在markdown文件头部设置 `hide: true`

#### 2. 修改内容查询逻辑 (`src/utils/content.ts`)

**新增函数**：

```typescript
// 获取所有文章（包括隐藏文章），仅用于单独访问
export async function getAllPostsIncludingHidden() {
  const allPosts = await getCollection('posts', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  return allPosts
}

// 获取所有文章（包括隐藏文章），置顶优先，发布日期降序，用于RSS订阅
export async function getSortedPostsIncludingHidden() {
  const allPosts = await getAllPostsIncludingHidden()

  return allPosts.sort((a, b) => {
    if (a.data.sticky !== b.data.sticky) {
      return b.data.sticky - a.data.sticky
    } else {
      return b.data.date.valueOf() - a.data.date.valueOf()
    }
  })
}
```

**修改现有函数**：

```typescript
// 获取所有可显示的文章（过滤隐藏文章）
async function getAllPosts() {
  const allPosts = await getCollection('posts', ({ data }) => {
    const isNotDraft = import.meta.env.PROD ? data.draft !== true : true
    const isNotHidden = !data.hide
    return isNotDraft && isNotHidden
  })

  return allPosts
}
```

**变更说明**：

- 新增 `getAllPostsIncludingHidden()` 函数用于文章详情页面
- 新增 `getSortedPostsIncludingHidden()` 函数用于RSS订阅
- 修改 `getAllPosts()` 函数，增加隐藏文章过滤逻辑
- 保持向后兼容性，其他依赖函数无需修改

#### 3. 修改文章详情页面 (`src/pages/posts/[...slug].astro`)

**修改静态路径生成**：

```typescript
export const getStaticPaths = (async () => {
  // 获取所有文章（包括隐藏文章）用于生成路径
  const allPosts = await getAllPostsIncludingHidden()
  // 获取可显示的文章用于导航
  const sortedPosts = await getSortedPosts()

  return allPosts.map((post) => {
    // 找到当前文章在可显示文章中的位置（用于导航）
    const visibleIndex = sortedPosts.findIndex((p) => p.slug === post.slug)

    return {
      params: { slug: post.slug },
      props: {
        current: post,
        // 只有在可显示文章列表中才提供导航链接
        prev: visibleIndex > 0 ? sortedPosts[visibleIndex - 1] : undefined,
        next:
          visibleIndex >= 0 && visibleIndex < sortedPosts.length - 1
            ? sortedPosts[visibleIndex + 1]
            : undefined,
      },
    }
  })
}) satisfies GetStaticPaths
```

**变更说明**：

- 使用 `getAllPostsIncludingHidden()` 为所有文章（包括隐藏）生成路径
- 使用 `getSortedPosts()` 生成导航链接，确保隐藏文章不出现在上一篇/下一篇中
- 隐藏文章仍可直接访问，但不会影响其他文章的导航

#### 4. 修改RSS订阅 (`src/pages/rss.xml.ts`)

**修改RSS逻辑**：

```typescript
import { getSortedPostsIncludingHidden } from '@/utils/content'

export async function GET(context: APIContext) {
  const sortedPosts = await getSortedPostsIncludingHidden()
  // ... 其余代码保持不变
}
```

**变更说明**：

- 修改为使用 `getSortedPostsIncludingHidden()` 函数
- RSS订阅中将包含隐藏文章，让订阅者可以获取完整内容
- 隐藏文章只在网站页面中隐藏，但RSS中仍然可访问

### 📁 影响的文件清单

1. **`src/content/config.ts`**
   - 添加 `hide` 字段到 posts 集合 schema

2. **`src/utils/content.ts`**
   - 新增 `getAllPostsIncludingHidden()` 函数
   - 新增 `getSortedPostsIncludingHidden()` 函数
   - 修改 `getAllPosts()` 函数过滤逻辑

3. **`src/pages/posts/[...slug].astro`**
   - 更新导入语句
   - 修改静态路径生成逻辑

4. **`src/pages/rss.xml.ts`**
   - 修改为使用 `getSortedPostsIncludingHidden()` 函数
   - 保持RSS订阅包含隐藏文章

5. **测试文件：`src/content/posts/docker-compose.md`**
   - 添加 `hide: true` 用于功能验证

### 🎯 功能验证

**隐藏文章测试**：

- 在 `docker-compose.md` 头部添加 `hide: true`
- 该文章将从以下位置消失：
  - 首页最新发布列表
  - 归档页面
  - 相关分类页面
  - 相关标签页面
- 但仍可通过 `/posts/docker-compose` 直接访问
- **RSS订阅中仍然包含该文章**

### 🔄 不同显示策略

以下功能的显示策略：

**过滤隐藏文章的页面**：

- **首页列表** (`src/pages/[...page].astro`) - 使用 `getSortedPosts()`
- **归档页面** (`src/pages/archives.astro`) - 使用 `getOldestPosts()`
- **分类页面** (`src/pages/categories/[category].astro`) - 使用 `getOldestPosts()`
- **标签页面** (`src/pages/tags/[tag].astro`) - 使用 `getOldestPosts()`
- **分类统计** - 使用基于 `getAllPosts()` 的函数
- **标签统计** - 使用基于 `getAllPosts()` 的函数

**包含隐藏文章的功能**：

- **文章详情页面** (`src/pages/posts/[...slug].astro`) - 使用 `getAllPostsIncludingHidden()`
- **RSS订阅** (`src/pages/rss.xml.ts`) - 使用 `getSortedPostsIncludingHidden()`

### 📝 使用方法

在markdown文件头部添加 `hide` 字段：

```yaml
---
title: 这是一篇隐藏文章
date: 2024-04-04
summary: 这篇文章只能通过直接链接访问
category: 测试
tags: [隐藏, 测试]
hide: true # 设置为隐藏
---
```

### 🚀 技术优势

1. **向后兼容**：现有文章无需修改，默认 `hide: false`
2. **性能友好**：在数据查询层面过滤，减少不必要的处理
3. **灵活的RSS策略**：RSS订阅包含隐藏文章，让订阅者获取完整内容
4. **用户体验**：隐藏文章不影响正常文章的导航逻辑
5. **类型安全**：通过TypeScript类型检查确保数据一致性
6. **SEO友好**：隐藏文章不会出现在网站内部链接中，但仍可直接访问

### ✅ 完成状态

- [x] 内容配置修改
- [x] 查询逻辑更新
- [x] 文章详情页面修改
- [x] RSS订阅修改以包含隐藏文章
- [x] 功能测试验证
- [x] 文档记录完成

---

**更新时间**：2025-08-27  
**版本**：v1.1  
**兼容性**：完全向后兼容  
**主要变更**：RSS订阅保持包含隐藏文章

---

## 功能修复：站点地图问题 (2025-08-27)

### 📋 问题描述

在实现文章隐藏功能后，站点地图无法正常工作，原因是：

- sitemap插件包含了所有生成的页面，包括隐藏文章页面
- 需要配置sitemap插件排除隐藏文章，确保站点地图只包含可访问的页面

### 🔧 修复方案

#### 修改Astro配置 (`astro.config.js`)

**添加导入**：

```javascript
import { getSortedPosts } from './src/utils/content'
```

**修改sitemap配置**：

```javascript
sitemap({
  filter: async (page) => {
    // 获取所有可显示的文章（不包括隐藏文章）
    const posts = await getSortedPosts()
    const visiblePostUrls = posts.map((post) => `${site.url}/posts/${post.slug}`)

    // 如果是文章页面，只包含可显示的文章
    if (page.includes('/posts/')) {
      return visiblePostUrls.some((url) => page === url)
    }

    // 其他页面都包含
    return true
  },
})
```

### 🎯 修复效果

**修复后的站点地图行为**：

- ✅ 包含所有可显示的文章页面
- ❌ 排除隐藏文章页面（`hide: true`）
- ✅ 包含其他静态页面（首页、归档、分类、标签等）
- ✅ 站点地图链接 `/sitemap-index.xml` 正常工作

### 📁 影响的文件

1. **`astro.config.js`**
   - 添加 `getSortedPosts` 导入
   - 配置 sitemap 插件的 filter 选项

### ✅ 验证方法

1. 构建项目：`pnpm build`
2. 检查生成的 `dist/sitemap-index.xml` 文件
3. 确认隐藏文章不在站点地图中
4. 访问页面底部的"站点地图"链接验证正常工作

### 🚀 技术优势

1. **SEO友好**：站点地图只包含可访问的页面，避免搜索引擎索引隐藏内容
2. **自动同步**：利用现有的 `getSortedPosts()` 函数，确保与页面显示逻辑一致
3. **性能优化**：减少站点地图中不必要的页面条目
4. **维护友好**：配置简洁，易于理解和维护

---

**修复时间**：2025-08-27  
**版本**：v1.2  
**修复内容**：站点地图排除隐藏文章

---

## 问题修复：站点地图404错误 (2025-08-27)

### 📋 问题描述

在之前的sitemap配置修复后，站点地图仍然出现404错误：

```
Possible dynamic routes being matched: src/pages/[spec].astro, src/pages/[...page].astro.
[404] /sitemap-index.xml 4ms
[WARN] [router] A `getStaticPaths()` route pattern was matched, but no matching static path was found for requested path `/sitemap-index.xml`.
```

**根本原因**：

- Astro sitemap插件的filter功能在异步操作时可能存在问题
- 动态路由匹配了sitemap-index.xml路径，导致冲突
- 需要更稳定的sitemap生成解决方案

### 🔧 最终修复方案

#### 1. 移除sitemap插件 (`astro.config.js`)

**移除问题插件**：

```javascript
// 移除这些导入和配置
import sitemap from '@astrojs/sitemap'
// 从 integrations 中移除
sitemap()
```

#### 2. 创建自定义sitemap生成器 (`src/pages/sitemap-index.xml.ts`)

**新建文件**：

```typescript
import type { APIRoute } from 'astro'
import type { CollectionEntry } from 'astro:content'
import { getSortedPosts } from '@/utils/content'
import { getCollection } from 'astro:content'
import { site } from '@/config.json'

export const GET: APIRoute = async () => {
  // 获取所有可显示的文章（不包括隐藏文章）
  const posts = await getSortedPosts()

  // 获取其他页面集合
  const specs = await getCollection('spec')

  // 生成文章页面URL
  const postUrls = posts.map((post: CollectionEntry<'posts'>) => ({
    url: `${site.url}/posts/${post.slug}`,
    lastmod: post.data.lastMod || post.data.date,
    changefreq: 'weekly',
    priority: 0.8,
  }))

  // ... 其他页面和静态页面

  // 生成XML内容
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    // ... URL条目
  </urlset>`

  return new Response(xmlContent.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
```

### 🎯 修复效果

**修复后的行为**：

- ✅ **解决404错误**：`/sitemap-index.xml` 现在可以正常访问
- ✅ **排除隐藏文章**：使用 `getSortedPosts()` 确保只包含可显示的文章
- ✅ **包含所有页面**：文章、spec页面、静态页面都被正确包含
- ✅ **正确的XML格式**：符合sitemap标准，包含lastmod、changefreq、priority

### 📁 影响的文件

1. **`astro.config.js`**
   - 移除 `@astrojs/sitemap` 导入
   - 从 integrations 中移除 `sitemap()`

2. **`src/pages/sitemap-index.xml.ts`** (新建)
   - 自定义sitemap生成器
   - 使用 `getSortedPosts()` 过滤隐藏文章
   - 支持多种页面类型和完整的XML格式

### ✅ 验证方法

1. 重新启动开发服务器：`pnpm dev`
2. 访问：`http://localhost:4321/sitemap-index.xml`
3. 确认返回正确的XML内容而不是404错误
4. 检查隐藏文章不在sitemap中
5. 测试页面底部的"站点地图"链接

### 🚀 技术优势

1. **稳定性**：自定义实现避免了插件的异步问题
2. **精确控制**：可以精确控制哪些页面包含在sitemap中
3. **类型安全**：完整的TypeScript类型支持
4. **性能优化**：直接使用现有的内容查询函数，避免重复计算
5. **标准兼容**：生成的XML完全符合sitemap协议标准

---

**修复时间**：2025-08-27  
**版本**：v1.3  
**修复内容**：彻底解决站点地图404问题

---

## 问题修复：Sitemap中重复链接 (2025-08-27)

### 📋 问题描述

在自定义sitemap生成器中，`friends` 链接出现了重复：

```xml
<url>
  <loc>https://akams.cn/friends</loc>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://akams.cn/friends</loc>
  <priority>0.6</priority>
</url>
```

**原因分析**：

- 在 `staticPages` 数组中手动添加了 `/friends` 页面（优先级0.7）
- 在 `specUrls` 中，`src/content/spec/friends.md` 文件也生成了 `/friends` 页面（优先级0.6）
- 两个数据源生成了相同的URL，导致重复

### 🔧 修复方案

#### 修改sitemap生成器 (`src/pages/sitemap-index.xml.ts`)

**移除重复的静态页面**：

```typescript
// 静态页面（不包括spec页面，避免重复）
const staticPages = [
  {
    url: site.url,
    lastmod: new Date(),
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    url: `${site.url}/archives`,
    lastmod: new Date(),
    changefreq: 'weekly',
    priority: 0.9,
  },
  // 移除了 projects 和 friends，因为它们在 spec 集合中
]
```

**原理说明**：

- `src/content/spec/` 目录包含：`about.md`、`friends.md`、`projects.md`
- 这些文件会通过 `getCollection('spec')` 自动生成URL
- 不需要在 `staticPages` 中重复定义

### 🎯 修复效果

**修复后的sitemap行为**：

- ✅ **消除重复**：每个URL只出现一次
- ✅ **保持完整性**：所有页面仍然被正确包含
- ✅ **优化优先级**：spec页面使用统一的优先级(0.6)
- ✅ **清晰逻辑**：静态页面和spec页面分离管理

### 📁 影响的文件

1. **`src/pages/sitemap-index.xml.ts`**
   - 从 `staticPages` 数组中移除了 `projects` 和 `friends`
   - 添加了注释说明避免重复的原理

### ✅ 验证方法

1. 重新启动开发服务器：`pnpm dev`
2. 访问：`http://localhost:4321/sitemap-index.xml`
3. 搜索 `friends` 和 `projects` 链接，确认每个只出现一次
4. 检查所有页面都被正确包含

### 🚀 技术优势

1. **逻辑清晰**：明确区分静态页面和动态生成的页面
2. **避免重复**：通过统一的数据源管理相关页面
3. **易于维护**：当添加新的spec页面时，自动包含在sitemap中
4. **标准兼容**：符合sitemap协议的唯一性要求

---

**修复时间**：2025-08-27  
**版本**：v1.4  
**修复内容**：修复sitemap中的重复链接问题
