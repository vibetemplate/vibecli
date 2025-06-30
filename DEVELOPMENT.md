# 开发工作流指南

本文档提供Web全栈应用的完整开发工作流程、最佳实践和开发工具使用指南。

## 🚀 快速开始

### 环境要求

- **Node.js**: >=18.17.0
- **npm**: >=9.0.0
- **数据库**: PostgreSQL >=12 或 MySQL >=8.0
- **Git**: 最新版本

### 项目初始化

```bash
# 1. 创建Next.js项目
npx create-next-app@latest my-web-app --typescript --tailwind --eslint

# 2. 进入项目目录
cd my-web-app

# 3. 安装核心依赖
npm install @prisma/client prisma
npm install @tanstack/react-query zustand
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot
npm install bcryptjs jsonwebtoken zod
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install react-hook-form @hookform/resolvers

# 4. 安装开发依赖
npm install -D @types/bcryptjs @types/jsonwebtoken
npm install -D prettier prettier-plugin-tailwindcss
npm install -D tsx

# 5. 初始化Prisma
npx prisma init

# 6. 设置环境变量
cp .env.example .env.local

# 7. 配置数据库
npx prisma migrate dev --name init
npx prisma generate

# 8. 启动开发服务器
npm run dev
```

## 📁 项目结构创建

### 创建目录结构

```bash
# 创建组件目录
mkdir -p components/{ui,layout,forms,features}

# 创建lib目录
mkdir -p lib/{services,hooks,stores,middleware,utils,validations,db}

# 创建类型定义目录
mkdir -p types

# 创建API目录结构
mkdir -p pages/api/{auth,users,admin}

# 创建样式目录
mkdir -p styles

# 创建测试目录
mkdir -p tests/{components,pages,api,utils}
```

### 基础配置文件

#### package.json脚本配置

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### TypeScript配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/types/*": ["types/*"],
      "@/styles/*": ["styles/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Tailwind配置 (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## 🔧 开发工作流

### 1. 功能开发流程

#### Git工作流

```bash
# 1. 创建功能分支
git checkout -b feature/user-authentication

# 2. 开发过程中定期提交
git add .
git commit -m "feat: add user login form"

# 3. 推送到远程分支
git push origin feature/user-authentication

# 4. 创建Pull Request
# 5. 代码审查
# 6. 合并到主分支
```

#### 提交信息规范

```bash
# 功能开发
git commit -m "feat: add user authentication system"

# 修复bug
git commit -m "fix: resolve login form validation issue"

# 文档更新
git commit -m "docs: update API documentation"

# 样式调整
git commit -m "style: improve button component styling"

# 重构代码
git commit -m "refactor: extract auth logic to service layer"

# 性能优化
git commit -m "perf: optimize database queries"

# 测试相关
git commit -m "test: add unit tests for auth service"
```

### 2. 数据库开发流程

#### Prisma开发工作流

```bash
# 1. 修改schema
# 编辑 prisma/schema.prisma

# 2. 生成迁移
npx prisma migrate dev --name add_user_sessions

# 3. 生成客户端
npx prisma generate

# 4. 查看数据库
npx prisma studio

# 5. 重置数据库(开发环境)
npx prisma migrate reset

# 6. 部署迁移(生产环境)
npx prisma migrate deploy
```

#### 数据库Schema示例

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String?
  tier         UserTier @default(FREE)
  status       UserStatus @default(ACTIVE)
  avatar       String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  lastActiveAt DateTime? @map("last_active_at")
  
  sessions     UserSession[]
  posts        Post[]
  
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
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([expiresAt])
  @@map("user_sessions")
}

enum UserTier {
  FREE
  PRO
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  INACTIVE
  PENDING
}
```

### 3. API开发流程

#### API开发步骤

```bash
# 1. 定义数据验证schema
# lib/validations/auth.ts

# 2. 创建服务层
# lib/services/auth.ts

# 3. 实现API路由
# pages/api/auth/login.ts

# 4. 添加中间件
# lib/middleware/auth.ts

# 5. 测试API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### 服务层开发模式

```typescript
// lib/services/auth.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'
import { AuthenticationError } from '@/lib/utils/errors'

export class AuthService {
  async login(email: string, password: string) {
    // 1. 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new AuthenticationError('邮箱或密码错误')
    }

    // 2. 验证密码
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      throw new AuthenticationError('邮箱或密码错误')
    }

    // 3. 生成令牌
    const tokens = await this.generateTokens(user)

    // 4. 更新最后活跃时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    })

    return {
      user: this.sanitizeUser(user),
      tokens
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      userId: user.id,
      email: user.email,
      tier: user.tier
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '1h'
    })

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '7d'
    })

    // 保存会话
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deviceInfo: 'Web Browser',
        ipAddress: '127.0.0.1'
      }
    })

    return { accessToken, refreshToken }
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user
    return sanitized
  }
}

export const authService = new AuthService()
```

### 4. 前端开发流程

#### 组件开发模式

```typescript
// components/ui/Button.tsx
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
```

#### 状态管理开发

```typescript
// lib/stores/auth.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  tier: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
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
              isAuthenticated: true,
              isLoading: false
            })
          } else {
            set({
              error: data.error,
              isLoading: false
            })
          }
        } catch (error) {
          set({
            error: '登录失败，请稍后重试',
            isLoading: false
          })
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      refreshToken: async () => {
        // 实现token刷新逻辑
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```

## 🧪 测试开发

### 单元测试配置

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### 测试示例

```typescript
// tests/lib/services/auth.test.ts
import { authService } from '@/lib/services/auth'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/db/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userSession: {
    create: jest.fn(),
  }
}))

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password', 12),
        name: 'Test User',
        tier: 'FREE',
        status: 'ACTIVE'
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.userSession.create as jest.Mock).mockResolvedValue({})

      const result = await authService.login('test@example.com', 'password')

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tokens')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw error with invalid credentials', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('邮箱或密码错误')
    })
  })
})
```

## 🚀 部署流程

### 环境变量配置

```bash
# .env.example
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/myapp"

# JWT配置
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Next.js配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# API配置
API_RATE_LIMIT_MAX="100"
API_RATE_LIMIT_WINDOW="900000"

# 文件上传
UPLOAD_MAX_SIZE="10485760"
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif"

# 邮件配置
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# 开发配置
NODE_ENV="development"
LOG_LEVEL="debug"
```

### 构建和部署

```bash
# 1. 安装依赖
npm ci

# 2. 生成Prisma客户端
npx prisma generate

# 3. 运行数据库迁移
npx prisma migrate deploy

# 4. 构建应用
npm run build

# 5. 启动生产服务器
npm start
```

### Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

## 🔧 开发工具配置

### VS Code配置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### ESLint配置

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier配置

```json
// .prettierrc
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

这套开发工作流指南提供了从项目初始化到部署的完整开发流程，确保开发效率和代码质量。
