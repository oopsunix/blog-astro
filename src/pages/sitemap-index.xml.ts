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

  // 生成spec页面URL
  const specUrls = specs.map((spec: CollectionEntry<'spec'>) => ({
    url: `${site.url}/${spec.slug}`,
    lastmod: new Date(),
    changefreq: 'monthly',
    priority: 0.6,
  }))

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
  ]

  // 合并所有URL
  const allUrls = [...staticPages, ...postUrls, ...specUrls]

  // 生成XML
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    ({ url, lastmod, changefreq, priority }) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod instanceof Date ? lastmod.toISOString() : new Date(lastmod).toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('')}
</urlset>`

  return new Response(xmlContent.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
