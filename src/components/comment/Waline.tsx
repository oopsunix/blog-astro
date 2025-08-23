import { useEffect, useRef } from 'react'
import { init } from '@waline/client'
import '@waline/client/style'

export function Waline({ serverURL }: { serverURL: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const walineInst = init({
      el: ref.current,
      serverURL,
      dark: "[data-theme='dark']",
      login: 'force', // 强制登录，可选值：`enable`（可选登录）、`force`（强制登录）和 `disable`（关闭登录）
      imageUploader: false, // 是否启用图片上传功能
      search: false, // 是否启用评论搜索功能
      reaction: [
          // 为文章增加表情互动功能，设置为 true 提供默认表情，也可以通过设置表情地址数组来自定义表情图片，最大支持 8 个表情。
          "https://npm.elemecdn.com/@waline/emojis@1.1.0/bilibili/bb_heart_eyes.png",
          "https://npm.elemecdn.com/@waline/emojis@1.1.0/bilibili/bb_thumbsup.png",
          "https://npm.elemecdn.com/@waline/emojis@1.1.0/bilibili/bb_zhoumei.png",
          "https://npm.elemecdn.com/@waline/emojis@1.1.0/bilibili/bb_grievance.png",
          "https://npm.elemecdn.com/@waline/emojis@1.1.0/bilibili/bb_dizzy_face.png",
          "https://npm.elemecdn.com/@waline/emojis@1.1.0/bilibili/bb_slap.png",
      ],
      locale: {
          placeholder: "发条友善的评论吧（支持 Markdown 语法）…",
          reaction0: "非常有用",
          reaction1: "有帮助",
          reaction2: "一般",
          reaction3: "无帮助",
          reaction4: "看不懂",
          reaction5: "有错误",
          reactionTitle: "本站内容对你有帮助吗？",
          sofa: "还没有人留言哦！快来抢沙发吧~",
          comment: "留言",
      },
      emoji: [
          'https://jsd.akams.cn/gh/norevi/waline-blobcatemojis@1.0/blobs',
          "https://jsd.akams.cn/gh/walinejs/emojis@1.4.0/bmoji",
          "https://jsd.akams.cn/gh/walinejs/emojis@1.4.0/bilibili",
          "https://jsd.akams.cn/gh/walinejs/emojis@1.4.0/weibo",
          'https://jsd.akams.cn/gh/walinejs/emojis@1.4.0/qq',
          'https://jsd.akams.cn/gh/walinejs/emojis@1.4.0/tieba',
          'https://jsd.akams.cn/gh/walinejs/emojis@1.4.0/alus',
          'https://jsd.akams.cn/gh/walinejs/emojis@1.4.0/hoyoverse-hi3'
      ],
    })

    return () => {
      if (ref.current) {
        walineInst?.destroy()
      }
    }
  }, [serverURL])

  return <div ref={ref}></div>
}
