# 认证系统示例

完整的用户认证系统实现，展示现代Web应用的安全认证最佳实践。

## 🎯 功能特性

- ✅ 用户注册和邮箱验证
- ✅ 安全登录和JWT令牌管理
- ✅ 密码重置和修改
- ✅ 会话管理和自动刷新
- ✅ 角色权限控制
- ✅ 设备管理和安全日志

## 🏗️ 技术架构

```
认证系统架构
├── 前端组件
│   ├── LoginForm.tsx          # 登录表单
│   ├── RegisterForm.tsx       # 注册表单
│   ├── AuthGuard.tsx          # 路由保护
│   └── UserProfile.tsx        # 用户资料
├── API路由
│   ├── /api/auth/register     # 用户注册
│   ├── /api/auth/login        # 用户登录
│   ├── /api/auth/refresh      # 令牌刷新
│   ├── /api/auth/logout       # 用户登出
│   └── /api/auth/profile      # 用户资料
├── 服务层
│   ├── AuthService            # 认证服务
│   ├── UserService            # 用户服务
│   └── EmailService           # 邮件服务
└── 中间件
    ├── authMiddleware         # 认证中间件
    ├── roleMiddleware         # 权限中间件
    └── rateLimitMiddleware    # 频率限制
```

## 📁 文件结构

```
auth-system/
├── components/
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── PasswordResetForm.tsx
│   ├── guards/
│   │   ├── AuthGuard.tsx
│   │   └── RoleGuard.tsx
│   └── profile/
│       ├── UserProfile.tsx
│       ├── SecuritySettings.tsx
│       └── SessionManager.tsx
├── pages/api/auth/
│   ├── register.ts
│   ├── login.ts
│   ├── refresh.ts
│   ├── logout.ts
│   ├── profile.ts
│   └── reset-password.ts
├── lib/
│   ├── services/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── email.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── role.ts
│   ├── validations/
│   │   └── auth.ts
│   └── utils/
│       ├── jwt.ts
│       └── password.ts
├── prisma/
│   └── schema.prisma
├── types/
│   └── auth.ts
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install bcryptjs jsonwebtoken
npm install @types/bcryptjs @types/jsonwebtoken
npm install zod @hookform/resolvers
npm install react-hook-form
```

### 2. 数据库配置

```prisma
// prisma/schema.prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String      @map("password_hash")
  name         String?
  role         UserRole    @default(USER)
  status       UserStatus  @default(PENDING)
  avatar       String?
  emailVerified DateTime?  @map("email_verified")
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")
  lastActiveAt DateTime?   @map("last_active_at")
  
  sessions     UserSession[]
  
  @@index([email])
  @@index([status])
  @@map("users")
}

model UserSession {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  refreshToken String   @unique @map("refresh_token")
  deviceInfo   String?  @map("device_info")
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")
  lastUsedAt   DateTime @default(now()) @map("last_used_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([expiresAt])
  @@map("user_sessions")
}

enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
  INACTIVE
}
```

### 3. 环境变量

```bash
# .env.local
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# 邮件配置
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 4. 运行迁移

```bash
npx prisma migrate dev --name add_auth_system
npx prisma generate
```

## 💻 代码示例

### 用户注册API

```typescript
// pages/api/auth/register.ts
import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { authService } from '@/lib/services/auth'
import { emailService } from '@/lib/services/email'

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少8位')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
  name: z.string().min(1, '姓名不能为空'),
  terms: z.boolean().refine(val => val === true, '必须同意服务条款')
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    // 验证请求数据
    const { email, password, name } = registerSchema.parse(req.body)

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: '该邮箱已被注册'
      })
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        status: 'PENDING'
      }
    })

    // 发送验证邮件
    await emailService.sendVerificationEmail(user.email, user.id)

    // 生成令牌
    const tokens = await authService.generateTokens(user)

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          role: user.role
        },
        tokens
      },
      message: '注册成功，请查收验证邮件'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试'
    })
  }
}
```

### 登录表单组件

```typescript
// components/forms/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/stores/auth'

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码')
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore(state => state.login)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    try {
      await login(data.email, data.password)
    } catch (error: any) {
      setError('root', {
        message: error.message || '登录失败，请稍后重试'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...register('email')}
          type="email"
          placeholder="邮箱地址"
          error={errors.email?.message}
        />
      </div>
      
      <div>
        <Input
          {...register('password')}
          type="password"
          placeholder="密码"
          error={errors.password?.message}
        />
      </div>

      {errors.root && (
        <div className="text-red-500 text-sm">
          {errors.root.message}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        loading={isLoading}
      >
        登录
      </Button>
    </form>
  )
}
```

### 认证中间件

```typescript
// lib/middleware/auth.ts
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string
    email: string
    role: string
  }
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: '未提供认证令牌'
        })
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      // 验证用户是否存在且状态正常
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          status: 'ACTIVE'
        }
      })

      if (!user) {
        return res.status(401).json({
          success: false,
          error: '用户不存在或已被禁用'
        })
      }

      // 更新最后活跃时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      })

      ;(req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role
      }

      return handler(req as AuthenticatedRequest, res)

    } catch (error) {
      return res.status(401).json({
        success: false,
        error: '认证令牌无效'
      })
    }
  }
}
```

### 状态管理

```typescript
// lib/stores/auth.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshTokens: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })

          const data = await response.json()
          
          if (data.success) {
            set({
              user: data.data.user,
              token: data.data.tokens.accessToken,
              refreshToken: data.data.tokens.refreshToken,
              isAuthenticated: true,
              isLoading: false
            })
          } else {
            throw new Error(data.error)
          }
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false
          })
          throw error
        }
      },

      logout: async () => {
        const { token } = get()
        
        try {
          if (token) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null
          })
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get()
        
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          })

          const data = await response.json()
          
          if (data.success) {
            set({
              token: data.data.accessToken,
              refreshToken: data.data.refreshToken
            })
          } else {
            throw new Error(data.error)
          }
        } catch (error) {
          // 刷新失败，清除认证状态
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false
          })
          throw error
        }
      },

      updateProfile: async (profileData: Partial<User>) => {
        const { token } = get()
        
        try {
          const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
          })

          const data = await response.json()
          
          if (data.success) {
            set(state => ({
              user: state.user ? { ...state.user, ...data.data } : null
            }))
          } else {
            throw new Error(data.error)
          }
        } catch (error: any) {
          set({ error: error.message })
          throw error
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```

## 🔒 安全特性

### 1. 密码安全
- bcrypt加密，盐值>=12
- 密码强度验证
- 密码重置令牌有效期限制

### 2. 令牌安全
- JWT短期有效期(1小时)
- Refresh Token长期有效期(7天)
- 令牌自动刷新机制

### 3. 会话管理
- 设备信息记录
- IP地址追踪
- 异常登录检测

### 4. API安全
- 请求频率限制
- CORS配置
- 输入验证和消毒

## 🧪 测试

```typescript
// tests/auth.test.ts
import { authService } from '@/lib/services/auth'
import { prisma } from '@/lib/db/prisma'

describe('Auth Service', () => {
  it('should register user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User'
    }

    const result = await authService.register(userData)
    
    expect(result.user.email).toBe(userData.email)
    expect(result.tokens).toHaveProperty('accessToken')
    expect(result.tokens).toHaveProperty('refreshToken')
  })

  it('should login with valid credentials', async () => {
    const result = await authService.login(
      'test@example.com',
      'Password123'
    )

    expect(result.user).toBeDefined()
    expect(result.tokens).toBeDefined()
  })
})
```

## 📚 最佳实践

1. **永远不要在客户端存储敏感信息**
2. **使用HTTPS传输所有认证数据**
3. **实施适当的会话超时机制**
4. **记录所有认证相关的安全事件**
5. **定期审查和更新安全策略**

这个认证系统示例提供了生产级别的安全性和可扩展性，可以直接用于实际项目中。
