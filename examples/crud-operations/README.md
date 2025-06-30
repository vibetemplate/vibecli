# CRUD 操作示例

完整的数据管理系统实现，展示现代 Web 应用的数据操作最佳实践。

## 🎯 功能特性

- ✅ 完整的增删改查操作
- ✅ 数据验证和错误处理
- ✅ 分页和搜索功能
- ✅ 批量操作支持
- ✅ 乐观锁防止并发冲突
- ✅ 软删除和数据恢复
- ✅ 操作日志和审计追踪

## 🏗️ 技术架构

```
CRUD 系统架构
├── 前端组件
│   ├── DataTable.tsx           # 数据表格
│   ├── CreateForm.tsx          # 创建表单
│   ├── EditForm.tsx            # 编辑表单
│   ├── SearchFilter.tsx        # 搜索过滤
│   └── BulkActions.tsx         # 批量操作
├── API路由
│   ├── /api/posts              # GET,POST - 列表和创建
│   ├── /api/posts/[id]         # GET,PUT,DELETE - 详情、更新、删除
│   ├── /api/posts/search       # POST - 搜索
│   └── /api/posts/bulk         # POST - 批量操作
├── 服务层
│   ├── PostService             # 文章服务
│   ├── ValidationService       # 验证服务
│   └── AuditService            # 审计服务
└── 数据层
    ├── Post Model              # 文章模型
    ├── Category Model          # 分类模型
    └── AuditLog Model          # 审计日志模型
```

## 📁 文件结构

```
crud-operations/
├── components/
│   ├── data-table/
│   │   ├── DataTable.tsx
│   │   ├── TablePagination.tsx
│   │   ├── TableFilters.tsx
│   │   └── BulkActions.tsx
│   ├── forms/
│   │   ├── PostForm.tsx
│   │   ├── CreatePostForm.tsx
│   │   └── EditPostForm.tsx
│   └── ui/
│       ├── SearchInput.tsx
│       ├── StatusBadge.tsx
│       └── ConfirmDialog.tsx
├── pages/api/posts/
│   ├── index.ts                # GET /api/posts, POST /api/posts
│   ├── [id].ts                 # GET,PUT,DELETE /api/posts/[id]
│   ├── search.ts               # POST /api/posts/search
│   └── bulk.ts                 # POST /api/posts/bulk
├── lib/
│   ├── services/
│   │   ├── post.ts
│   │   ├── validation.ts
│   │   └── audit.ts
│   ├── hooks/
│   │   ├── usePosts.ts
│   │   ├── usePostMutation.ts
│   │   └── useBulkActions.ts
│   ├── validations/
│   │   └── post.ts
│   └── utils/
│       ├── pagination.ts
│       └── search.ts
├── prisma/
│   └── schema.prisma
├── types/
│   └── post.ts
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers
npm install zod date-fns
npm install lucide-react
```

### 2. 数据库模型

```prisma
// prisma/schema.prisma
model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String?   @db.Text
  excerpt     String?
  status      PostStatus @default(DRAFT)
  featured    Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  version     Int       @default(1)
  
  // 关联
  authorId    String    @map("author_id")
  author      User      @relation(fields: [authorId], references: [id])
  categoryId  String?   @map("category_id")
  category    Category? @relation(fields: [categoryId], references: [id])
  
  // 标签多对多关系
  tags        PostTag[]
  
  // 审计日志
  auditLogs   AuditLog[]
  
  @@index([status, publishedAt])
  @@index([authorId])
  @@index([categoryId])
  @@index([deletedAt])
  @@map("posts")
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  color       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  posts       Post[]
  
  @@map("categories")
}

model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  color     String?
  createdAt DateTime  @default(now()) @map("created_at")
  
  posts     PostTag[]
  
  @@map("tags")
}

model PostTag {
  postId String
  tagId  String
  
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
  @@map("post_tags")
}

model AuditLog {
  id        String      @id @default(cuid())
  action    AuditAction
  tableName String      @map("table_name")
  recordId  String      @map("record_id")
  oldData   Json?       @map("old_data")
  newData   Json?       @map("new_data")
  userId    String      @map("user_id")
  ipAddress String?     @map("ip_address")
  userAgent String?     @map("user_agent")
  createdAt DateTime    @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id])
  post Post? @relation(fields: [recordId], references: [id])
  
  @@index([tableName, recordId])
  @@index([userId])
  @@map("audit_logs")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  RESTORE
}
```

### 3. API 路由实现

```typescript
// pages/api/posts/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/middleware/auth'
import { postService } from '@/lib/services/post'
import { auditService } from '@/lib/services/audit'

const createPostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题过长'),
  content: z.string().optional(),
  excerpt: z.string().max(500, '摘要过长').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  publishedAt: z.string().datetime().optional()
})

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = querySchema.parse(req.query)
    
    const result = await postService.findMany({
      page: query.page,
      limit: Math.min(query.limit, 100), // 限制最大页面大小
      search: query.search,
      status: query.status,
      categoryId: query.categoryId,
      authorId: query.authorId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      includeDeleted: false
    })

    res.status(200).json({
      success: true,
      data: result.posts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
        hasNext: query.page < Math.ceil(result.total / query.limit),
        hasPrev: query.page > 1
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: '查询参数无效',
        details: error.errors
      })
    }

    console.error('Posts query error:', error)
    res.status(500).json({
      success: false,
      error: '获取文章列表失败'
    })
  }
}

async function handlePost(req: any, res: NextApiResponse) {
  try {
    const data = createPostSchema.parse(req.body)
    
    // 生成 slug
    const slug = await postService.generateSlug(data.title)
    
    // 创建文章
    const post = await postService.create({
      ...data,
      slug,
      authorId: req.user.id
    })

    // 记录审计日志
    await auditService.log({
      action: 'CREATE',
      tableName: 'posts',
      recordId: post.id,
      newData: post,
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    })

    res.status(201).json({
      success: true,
      data: post,
      message: '文章创建成功'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('Post creation error:', error)
    res.status(500).json({
      success: false,
      error: '创建文章失败'
    })
  }
}

export default withAuth(async (req, res) => {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      })
  }
})
```

### 4. 数据表格组件

```typescript
// components/data-table/DataTable.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { TablePagination } from './TablePagination'
import { BulkActions } from './BulkActions'
import { usePosts } from '@/lib/hooks/usePosts'

interface PostsTableProps {
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
  onView?: (post: Post) => void
}

export function PostsTable({ onEdit, onDelete, onView }: PostsTableProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = usePosts({
    page,
    search,
    status: status || undefined,
    limit: 10
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(data?.posts.map(post => post.id) || [])
    } else {
      setSelectedPosts([])
    }
  }

  const handleSelectPost = (postId: string, checked: boolean) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, postId])
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId))
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      DRAFT: 'secondary',
      PUBLISHED: 'success',
      ARCHIVED: 'warning'
    } as const

    const labels = {
      DRAFT: '草稿',
      PUBLISHED: '已发布',
      ARCHIVED: '已归档'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">加载失败</p>
          <Button onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索文章..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有状态</option>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
            <option value="ARCHIVED">已归档</option>
          </select>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedPosts.length > 0 && (
        <BulkActions
          selectedCount={selectedPosts.length}
          selectedIds={selectedPosts}
          onClear={() => setSelectedPosts([])}
        />
      )}

      {/* 表格 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedPosts.length === data?.posts.length && data?.posts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标题
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作者
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">加载中...</p>
                </td>
              </tr>
            ) : data?.posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              data?.posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {post.title}
                        </div>
                        {post.excerpt && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {post.excerpt}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(post.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {post.author.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView?.(post)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(post)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {data && (
        <TablePagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
```

### 5. 表单组件

```typescript
// components/forms/PostForm.tsx
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'

const postSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题过长'),
  content: z.string().optional(),
  excerpt: z.string().max(500, '摘要过长').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  featured: z.boolean(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()),
  publishedAt: z.string().optional()
})

type PostFormData = z.infer<typeof postSchema>

interface PostFormProps {
  initialData?: Partial<PostFormData>
  onSubmit: (data: PostFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  categories?: Array<{ id: string; name: string }>
  tags?: Array<{ id: string; name: string }>
}

export function PostForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  categories = [],
  tags = []
}: PostFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      status: 'DRAFT',
      featured: false,
      tagIds: [],
      ...initialData
    }
  })

  const status = watch('status')

  useEffect(() => {
    if (initialData) {
      reset({
        status: 'DRAFT',
        featured: false,
        tagIds: [],
        ...initialData
      })
    }
  }, [initialData, reset])

  const handleFormSubmit = async (data: PostFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Input
              {...register('title')}
              placeholder="输入文章标题..."
              error={errors.title?.message}
              className="text-lg font-semibold"
            />
          </div>

          <div>
            <Textarea
              {...register('content')}
              placeholder="开始写作..."
              rows={20}
              error={errors.content?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              摘要
            </label>
            <Textarea
              {...register('excerpt')}
              placeholder="文章摘要（可选）"
              rows={3}
              error={errors.excerpt?.message}
            />
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 发布设置 */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">发布设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  状态
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">草稿</option>
                  <option value="PUBLISHED">发布</option>
                  <option value="ARCHIVED">归档</option>
                </select>
              </div>

              {status === 'PUBLISHED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    发布时间
                  </label>
                  <Input
                    {...register('publishedAt')}
                    type="datetime-local"
                    error={errors.publishedAt?.message}
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  {...register('featured')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  设为推荐文章
                </label>
              </div>
            </div>
          </div>

          {/* 分类和标签 */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">分类和标签</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择分类</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tags.map(tag => (
                    <label key={tag.id} className="flex items-center">
                      <input
                        type="checkbox"
                        value={tag.id}
                        {...register('tagIds')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          type="submit"
          loading={isLoading}
        >
          {initialData ? '更新文章' : '创建文章'}
        </Button>
      </div>
    </form>
  )
}
```

## 🧪 测试示例

```typescript
// tests/posts.test.ts
import { postService } from '@/lib/services/post'
import { prisma } from '@/lib/db/prisma'

describe('Post CRUD Operations', () => {
  const testPost = {
    title: 'Test Post',
    content: 'This is a test post content',
    status: 'DRAFT' as const,
    authorId: 'test-user-id'
  }

  afterEach(async () => {
    await prisma.post.deleteMany({
      where: { title: testPost.title }
    })
  })

  it('should create a post', async () => {
    const post = await postService.create(testPost)
    
    expect(post.title).toBe(testPost.title)
    expect(post.status).toBe(testPost.status)
    expect(post.slug).toBeDefined()
  })

  it('should find posts with pagination', async () => {
    await postService.create(testPost)
    
    const result = await postService.findMany({
      page: 1,
      limit: 10
    })

    expect(result.posts).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('should update a post', async () => {
    const post = await postService.create(testPost)
    
    const updated = await postService.update(post.id, {
      title: 'Updated Title',
      version: post.version
    })

    expect(updated.title).toBe('Updated Title')
    expect(updated.version).toBe(post.version + 1)
  })

  it('should soft delete a post', async () => {
    const post = await postService.create(testPost)
    
    await postService.delete(post.id)
    
    const deleted = await prisma.post.findUnique({
      where: { id: post.id }
    })

    expect(deleted?.deletedAt).not.toBeNull()
  })
})
```

## 📚 最佳实践

1. **数据验证**: 在客户端和服务端都进行验证
2. **乐观锁**: 使用版本号防止并发更新冲突
3. **软删除**: 保留数据以支持恢复功能
4. **审计日志**: 记录所有重要操作
5. **分页优化**: 限制单页数据量，使用索引优化查询
6. **错误处理**: 提供友好的错误信息和恢复选项

这个 CRUD 操作示例提供了完整的数据管理功能，可以作为构建管理后台的基础。