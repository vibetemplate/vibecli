# VibeCLI 技术栈集成指南

## 🚀 Next.js 14 核心特性

### App Router
VibeCLI 项目默认使用 Next.js 14 的 App Router：
```typescript
// app/layout.tsx - 根布局
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

// app/page.tsx - 首页
export default function HomePage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">欢迎使用 VibeCLI</h1>
    </main>
  )
}
```

### Server Components
充分利用 React Server Components：
```typescript
// 服务端组件 - 直接访问数据库
async function PostList() {
  const posts = await prisma.post.findMany()
  
  return (
    <div className="grid gap-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

## 🎨 样式系统 (Tailwind + Radix)

### Tailwind CSS 配置
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
```

### Radix UI 组件集成
```typescript
// components/ui/Button.tsx
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

interface ButtonProps {
  asChild?: boolean
  variant?: 'default' | 'destructive' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

## 🗄 数据库 (Prisma)

### Schema 设计
```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
  profile   Profile?

  @@map("users")
}

model Post {
  id          String   @id @default(cuid())
  title       String
  content     String?
  published   Boolean  @default(false)
  authorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  author      User     @relation(fields: [authorId], references: [id])

  @@map("posts")
}
```

### 数据访问层
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## ✅ 数据验证 (Zod)

### Schema 定义
```typescript
// types/schemas.ts
import { z } from 'zod'

export const CreatePostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100字符'),
  content: z.string().optional(),
  published: z.boolean().default(false),
})

export type CreatePostInput = z.infer<typeof CreatePostSchema>
```

### API 路由验证
```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { CreatePostSchema } from '@/types/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreatePostSchema.parse(body)
    
    const post = await prisma.post.create({
      data: validatedData
    })
    
    return NextResponse.json(post)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '创建失败' },
      { status: 500 }
    )
  }
}
```

这些技术栈的集成确保了 VibeCLI 项目的现代化、类型安全和高性能。