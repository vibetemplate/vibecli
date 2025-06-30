# Web全栈架构规范

本文档定义了基于Next.js的Web全栈应用的完整架构规范和项目结构。

## 🏗️ 架构概览

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 全栈应用                          │
├─────────────────────────────────────────────────────────────┤
│  前端层 (React + TypeScript)                                │
│  ├── Pages/App Router                                       │
│  ├── React Components (UI组件)                              │
│  ├── State Management (Zustand + React Query)              │
│  └── Client-side Routing                                   │
├─────────────────────────────────────────────────────────────┤
│  API层 (Next.js API Routes)                                │
│  ├── RESTful API Endpoints (/api/*)                        │
│  ├── Authentication & Authorization                         │
│  ├── Business Logic Services                               │
│  └── Error Handling & Validation                           │
├─────────────────────────────────────────────────────────────┤
│  数据层 (Prisma ORM + Database)                             │
│  ├── Database Schema (PostgreSQL/MySQL)                    │
│  ├── Data Models & Relations                               │
│  ├── Query Optimization                                    │
│  └── Database Migrations                                   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 项目结构规范

### 完整目录结构

```
my-web-app/
├── components/                 # React组件
│   ├── ui/                    # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Select.tsx
│   │   ├── Table.tsx
│   │   └── index.ts          # 组件导出
│   ├── layout/                # 布局组件
│   │   ├── Layout.tsx
│   │   ├── Navigation.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── forms/                 # 表单组件
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── index.ts
│   └── features/              # 功能模块组件
│       ├── auth/
│       ├── dashboard/
│       └── settings/
├── pages/                     # Next.js页面 (Pages Router)
│   ├── api/                   # API路由
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── refresh.ts
│   │   │   └── logout.ts
│   │   ├── users/
│   │   │   ├── index.ts
│   │   │   ├── [id].ts
│   │   │   └── profile.ts
│   │   ├── admin/
│   │   └── health.ts
│   ├── _app.tsx              # App组件
│   ├── _document.tsx         # Document组件
│   ├── index.tsx             # 首页
│   ├── login.tsx             # 登录页
│   ├── register.tsx          # 注册页
│   ├── dashboard.tsx         # 仪表板
│   ├── profile.tsx           # 个人资料
│   └── admin/                # 管理页面
├── lib/                       # 核心库文件
│   ├── services/             # 业务服务层
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── api.ts
│   │   └── logger.ts
│   ├── hooks/                # React Hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── stores/               # 状态管理
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── config.ts
│   │   └── index.ts
│   ├── middleware/           # API中间件
│   │   ├── auth.ts
│   │   ├── error-handler.ts
│   │   ├── enhanced-api.ts
│   │   ├── validation.ts
│   │   └── rate-limit.ts
│   ├── utils/                # 工具函数
│   │   ├── auth-fetch.ts
│   │   ├── errors.ts
│   │   ├── response.ts
│   │   ├── cn.ts
│   │   └── constants.ts
│   ├── validations/          # 数据验证
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── common.ts
│   │   └── index.ts
│   └── db/                   # 数据库配置
│       ├── prisma.ts
│       └── connection.ts
├── prisma/                   # Prisma配置
│   ├── schema.prisma         # 数据库模式
│   ├── migrations/           # 数据库迁移
│   └── seed.ts              # 种子数据
├── styles/                   # 样式文件
│   ├── globals.css
│   ├── components.css
│   └── utils.css
├── types/                    # TypeScript类型定义
│   ├── auth.ts
│   ├── user.ts
│   ├── api.ts
│   ├── database.ts
│   └── index.ts
├── public/                   # 静态资源
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── docs/                     # 项目文档
├── tests/                    # 测试文件
│   ├── __mocks__/
│   ├── components/
│   ├── pages/
│   └── utils/
├── .env.example              # 环境变量示例
├── .env.local               # 本地环境变量
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── prisma.config.js
└── README.md
```

### 目录职责说明

#### `/components` - 组件目录
- **ui/**: 可复用的基础UI组件，遵循设计系统
- **layout/**: 页面布局相关组件
- **forms/**: 表单组件，包含验证逻辑
- **features/**: 按功能模块组织的业务组件

#### `/pages` - 页面和API目录
- **api/**: Next.js API路由，按功能模块组织
- **页面文件**: 直接对应URL路径的页面组件

#### `/lib` - 核心业务逻辑
- **services/**: 业务服务层，封装复杂业务逻辑
- **hooks/**: 自定义React Hooks
- **stores/**: 客户端状态管理
- **middleware/**: API中间件和通用处理逻辑
- **utils/**: 纯函数工具库
- **validations/**: 数据验证schema
- **db/**: 数据库连接和配置

## 🔧 技术架构规范

### 1. 前端架构

#### 组件设计原则

```typescript
// 组件设计模式
interface ComponentProps {
  // 必需属性
  children: React.ReactNode
  className?: string
  
  // 功能属性
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  
  // 事件处理
  onClick?: () => void
  onChange?: (value: string) => void
}

// 使用forwardRef支持ref传递
const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn(baseStyles, className)}
        {...props}
      >
        {children}
      </element>
    )
  }
)

Component.displayName = 'Component'
```

#### 状态管理架构

```typescript
// Zustand Store模式
interface AuthState {
  // 状态定义
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // 操作方法
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  clearError: () => void
  
  // 计算属性
  isAdmin: () => boolean
  hasPermission: (permission: string) => boolean
}

// React Query配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

### 2. API架构

#### API路由设计模式

```typescript
// 标准API路由结构
// pages/api/users/[id].ts

import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware/auth'
import { withValidation } from '@/lib/middleware/validation'
import { userService } from '@/lib/services/user'
import { userUpdateSchema } from '@/lib/validations/user'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id } = req.query
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res, id as string)
    case 'PUT':
      return handlePut(req, res, id as string)
    case 'DELETE':
      return handleDelete(req, res, id as string)
    default:
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      })
  }
}

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const user = await userService.getUserById(id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    throw error // 由错误中间件处理
  }
}

export default withAuth(
  withValidation(userUpdateSchema, handler, { methods: ['PUT'] })
)
```

#### 中间件架构

```typescript
// 增强型API中间件
export function withEnhancedApi(
  handler: ApiHandler,
  options: ApiMiddlewareOptions = {}
) {
  const {
    enableLogging = true,
    enableRateLimit = false,
    requireAuth = false,
    requiredPermissions = [],
    validationSchema,
  } = options

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 请求预处理
    const enhancedReq = enhanceRequest(req)
    
    try {
      // 日志记录
      if (enableLogging) {
        logRequest(enhancedReq)
      }

      // 频率限制
      if (enableRateLimit) {
        await checkRateLimit(enhancedReq, res)
      }

      // 认证检查
      if (requireAuth) {
        await authenticateRequest(enhancedReq)
      }

      // 权限检查
      if (requiredPermissions.length > 0) {
        await checkPermissions(enhancedReq, requiredPermissions)
      }

      // 数据验证
      if (validationSchema) {
        validateRequestData(enhancedReq, validationSchema)
      }

      // 执行处理器
      await handler(enhancedReq, res)

      // 成功日志
      if (enableLogging) {
        logSuccess(enhancedReq, res)
      }

    } catch (error) {
      // 错误处理
      handleApiError(error, enhancedReq, res)
    }
  }
}
```

### 3. 数据库架构

#### Prisma Schema设计规范

```prisma
// 基础模型设计
model User {
  // 主键使用cuid
  id        String   @id @default(cuid())
  
  // 基础字段
  email     String   @unique
  username  String?  @unique
  name      String?
  
  // 状态字段
  status    UserStatus @default(ACTIVE)
  tier      UserTier   @default(FREE)
  
  // 安全字段
  passwordHash String @map("password_hash")
  
  // 时间戳
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  lastActiveAt DateTime? @map("last_active_at")
  
  // 关系定义
  sessions  UserSession[]
  posts     Post[]
  comments  Comment[]
  
  // 索引优化
  @@index([email])
  @@index([status])
  @@index([createdAt])
  
  // 表名映射
  @@map("users")
}

// 枚举定义
enum UserStatus {
  ACTIVE
  SUSPENDED
  INACTIVE
  PENDING
}

enum UserTier {
  FREE
  PRO
  ADMIN
}
```

#### 数据库服务层模式

```typescript
// 服务层抽象
export abstract class BaseService<T> {
  protected abstract model: any
  
  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({
      where: { id }
    })
  }
  
  async findMany(where?: any, options?: any): Promise<T[]> {
    return await this.model.findMany({
      where,
      ...options
    })
  }
  
  async create(data: any): Promise<T> {
    return await this.model.create({
      data
    })
  }
  
  async update(id: string, data: any): Promise<T> {
    return await this.model.update({
      where: { id },
      data
    })
  }
  
  async delete(id: string): Promise<T> {
    return await this.model.delete({
      where: { id }
    })
  }
}

// 具体服务实现
export class UserService extends BaseService<User> {
  protected model = prisma.user
  
  async createUser(data: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 12)
    
    return await this.model.create({
      data: {
        ...data,
        passwordHash,
        password: undefined // 移除明文密码
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        tier: true,
        createdAt: true
      }
    })
  }
  
  async getUserWithStats(id: string): Promise<UserWithStats | null> {
    return await this.model.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            comments: true
          }
        },
        sessions: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          },
          take: 1
        }
      }
    })
  }
}
```

## 🔒 安全架构

### 认证授权流程

```typescript
// JWT认证流程
export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // 1. 验证用户凭据
    const user = await this.validateCredentials(credentials)
    
    // 2. 生成令牌
    const tokens = await this.generateTokens(user)
    
    // 3. 保存会话
    await this.createSession(user.id, tokens.refreshToken)
    
    // 4. 返回结果
    return {
      user: this.sanitizeUser(user),
      tokens
    }
  }
  
  private async generateTokens(user: User): Promise<Tokens> {
    const payload = {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      permissions: await this.getUserPermissions(user.id)
    }
    
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1h'
    })
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    )
    
    return { accessToken, refreshToken }
  }
}
```

### 数据验证架构

```typescript
// Zod验证Schema
export const createUserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少8位')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
  name: z.string().min(1, '姓名不能为空').optional(),
  terms: z.boolean().refine(val => val === true, '必须同意服务条款')
})

// 运行时验证
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        '数据验证失败',
        error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      )
    }
    throw error
  }
}
```

## 📊 性能架构

### 缓存策略

```typescript
// 多层缓存架构
export class CacheManager {
  private memoryCache = new Map()
  private redisCache?: Redis
  
  async get<T>(key: string): Promise<T | null> {
    // 1. 内存缓存
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)
    }
    
    // 2. Redis缓存
    if (this.redisCache) {
      const cached = await this.redisCache.get(key)
      if (cached) {
        const data = JSON.parse(cached)
        this.memoryCache.set(key, data)
        return data
      }
    }
    
    return null
  }
  
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    // 设置内存缓存
    this.memoryCache.set(key, value)
    
    // 设置Redis缓存
    if (this.redisCache) {
      await this.redisCache.setex(key, ttl, JSON.stringify(value))
    }
    
    // 内存缓存TTL
    setTimeout(() => {
      this.memoryCache.delete(key)
    }, ttl * 1000)
  }
}
```

### 数据库优化

```typescript
// 查询优化模式
export class OptimizedUserService {
  async getUsersWithPagination(params: PaginationParams) {
    const { page = 1, limit = 20, search, filters } = params
    
    // 构建查询条件
    const where = this.buildWhereClause(search, filters)
    
    // 并行执行查询和计数
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }
}
```

这个架构规范为Web全栈应用提供了完整的技术架构指导，确保项目的可维护性、可扩展性和性能。
