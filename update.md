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

### 📁 影响的文件清单

1. **`src/content/config.ts`**
   - 添加 `hide` 字段到 posts 集合 schema

2. **`src/utils/content.ts`**
   - 新增 `getAllPostsIncludingHidden()` 函数
   - 修改 `getAllPosts()` 函数过滤逻辑

3. **`src/pages/posts/[...slug].astro`**
   - 更新导入语句
   - 修改静态路径生成逻辑

4. **测试文件：`src/content/posts/docker-compose.md`**
   - 添加 `hide: true` 用于功能验证

### 🎯 功能验证

**隐藏文章测试**：

- 在 `docker-compose.md` 头部添加 `hide: true`
- 该文章将从以下位置消失：
  - 首页最新发布列表
  - 归档页面
  - 相关分类页面
  - 相关标签页面
  - RSS订阅
- 但仍可通过 `/posts/docker-compose` 直接访问

### 🔄 不受影响的功能

以下功能自动继承过滤逻辑，无需修改：

- **RSS订阅** (`src/pages/rss.xml.ts`) - 使用 `getSortedPosts()`
- **首页列表** (`src/pages/[...page].astro`) - 使用 `getSortedPosts()`
- **归档页面** (`src/pages/archives.astro`) - 使用 `getOldestPosts()`
- **分类页面** (`src/pages/categories/[category].astro`) - 使用 `getOldestPosts()`
- **标签页面** (`src/pages/tags/[tag].astro`) - 使用 `getOldestPosts()`
- **分类统计** - 使用基于 `getAllPosts()` 的函数
- **标签统计** - 使用基于 `getAllPosts()` 的函数

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
3. **SEO友好**：隐藏文章不会出现在sitemap和RSS中
4. **用户体验**：隐藏文章不影响正常文章的导航逻辑
5. **类型安全**：通过TypeScript类型检查确保数据一致性

### ✅ 完成状态

- [x] 内容配置修改
- [x] 查询逻辑更新
- [x] 文章详情页面修改
- [x] 功能测试验证
- [x] 文档记录完成

---

**更新时间**：2025-08-27  
**版本**：v1.0  
**兼容性**：完全向后兼容
