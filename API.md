# API设计规范

本文档定义了Web全栈应用的API设计规范、接口标准和最佳实践。

## 🎯 API设计原则

### RESTful设计规范

- **资源导向**: URL表示资源，HTTP方法表示操作
- **无状态**: 每个请求包含所有必要信息
- **统一接口**: 一致的API设计模式
- **分层系统**: 清晰的架构层次

### HTTP方法使用规范

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 获取资源 | `GET /api/users` - 获取用户列表 |
| POST | 创建资源 | `POST /api/users` - 创建新用户 |
| PUT | 更新整个资源 | `PUT /api/users/123` - 更新用户信息 |
| PATCH | 部分更新资源 | `PATCH /api/users/123` - 更新用户部分字段 |
| DELETE | 删除资源 | `DELETE /api/users/123` - 删除用户 |

## 📋 API响应格式

### 标准响应结构

```typescript
// 成功响应
interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  meta?: {
    pagination?: PaginationMeta
    timestamp: string
    requestId: string
  }
}

// 错误响应
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: ValidationError[]
  meta?: {
    timestamp: string
    requestId: string
  }
}

// 分页元数据
interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}
```

### 响应示例

#### 成功响应示例

```json
// 获取用户列表
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "user@example.com",
        "name": "张三",
        "status": "ACTIVE",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_abc123"
  }
}

// 创建用户
{
  "success": true,
  "data": {
    "id": "user_456",
    "email": "newuser@example.com",
    "name": "李四",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "用户创建成功"
}
```

#### 错误响应示例

```json
// 验证错误
{
  "success": false,
  "error": "数据验证失败",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    },
    {
      "field": "password",
      "message": "密码至少8位"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_def456"
  }
}

// 认证错误
{
  "success": false,
  "error": "认证失败",
  "code": "AUTHENTICATION_ERROR",
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_ghi789"
  }
}
```

## 🔐 认证API

### 用户注册

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string
  password: string
  name?: string
  terms: boolean
}

interface RegisterResponse {
  success: true
  data: {
    user: {
      id: string
      email: string
      name: string
      status: 'ACTIVE' | 'PENDING'
      createdAt: string
    }
    tokens: {
      accessToken: string
      refreshToken: string
      expiresAt: string
    }
  }
  message: "注册成功"
}
```

**实现示例:**

```typescript
// pages/api/auth/register.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { registerSchema } from '@/lib/validations/auth'
import { authService } from '@/lib/services/auth'
import { withEnhancedApi } from '@/lib/middleware/enhanced-api'

async function registerHandler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const validatedData = registerSchema.parse(req.body)
    const result = await authService.register(validatedData)
    
    res.status(201).json({
      success: true,
      data: result,
      message: '注册成功'
    })
  } catch (error) {
    throw error // 由中间件处理
  }
}

export default withEnhancedApi(registerHandler, {
  enableRateLimit: true,
  rateLimitMax: 5,
  rateLimitWindow: 15 * 60 * 1000
})
```

### 用户登录

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string
  password: string
  clientInfo?: {
    version?: string
    platform?: string
    deviceId?: string
  }
}

interface LoginResponse {
  success: true
  data: {
    user: {
      id: string
      email: string
      name: string
      tier: 'FREE' | 'PRO' | 'ADMIN'
      status: 'ACTIVE'
    }
    tokens: {
      accessToken: string
      refreshToken: string
      expiresAt: string
    }
  }
  message: "登录成功"
}
```

### 令牌刷新

```typescript
// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string
}

interface RefreshResponse {
  success: true
  data: {
    accessToken: string
    refreshToken: string
    expiresAt: string
  }
}
```

### 用户登出

```typescript
// POST /api/auth/logout
// Headers: Authorization: Bearer <accessToken>

interface LogoutResponse {
  success: true
  message: "登出成功"
}
```

## 👥 用户管理API

### 获取用户信息

```typescript
// GET /api/users/profile
// Headers: Authorization: Bearer <accessToken>

interface UserProfileResponse {
  success: true
  data: {
    id: string
    email: string
    name: string
    avatar?: string
    tier: string
    status: string
    createdAt: string
    lastActiveAt: string
    stats: {
      totalRequests: number
      totalTokens: number
      monthlyUsage: number
    }
  }
}
```

### 更新用户信息

```typescript
// PUT /api/users/profile
// Headers: Authorization: Bearer <accessToken>

interface UpdateProfileRequest {
  name?: string
  avatar?: string
  currentPassword?: string
  newPassword?: string
}

interface UpdateProfileResponse {
  success: true
  data: {
    id: string
    email: string
    name: string
    avatar?: string
    updatedAt: string
  }
  message: "个人信息更新成功"
}
```

### 获取用户列表 (管理员)

```typescript
// GET /api/admin/users?page=1&limit=20&search=keyword&status=ACTIVE
// Headers: Authorization: Bearer <adminToken>

interface UsersListResponse {
  success: true
  data: {
    users: Array<{
      id: string
      email: string
      name: string
      tier: string
      status: string
      createdAt: string
      lastActiveAt: string
    }>
  }
  meta: {
    pagination: PaginationMeta
  }
}
```

## 📊 数据管理API

### 通用CRUD模式

```typescript
// 资源列表 - GET /api/resources
interface ListResourcesRequest {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  filters?: Record<string, any>
}

// 创建资源 - POST /api/resources
interface CreateResourceRequest {
  [key: string]: any
}

// 获取单个资源 - GET /api/resources/:id
interface GetResourceResponse {
  success: true
  data: Resource
}

// 更新资源 - PUT /api/resources/:id
interface UpdateResourceRequest {
  [key: string]: any
}

// 删除资源 - DELETE /api/resources/:id
interface DeleteResourceResponse {
  success: true
  message: "删除成功"
}
```

### 批量操作

```typescript
// POST /api/resources/batch
interface BatchOperationRequest {
  action: 'create' | 'update' | 'delete'
  items: Array<{
    id?: string
    data?: any
  }>
}

interface BatchOperationResponse {
  success: true
  data: {
    processed: number
    successful: number
    failed: number
    errors?: Array<{
      index: number
      error: string
    }>
  }
  message: "批量操作完成"
}
```

## 🔍 搜索和过滤API

### 高级搜索

```typescript
// POST /api/search
interface SearchRequest {
  query: string
  filters?: {
    type?: string[]
    dateRange?: {
      start: string
      end: string
    }
    status?: string[]
    tags?: string[]
  }
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
  pagination?: {
    page: number
    limit: number
  }
}

interface SearchResponse {
  success: true
  data: {
    results: Array<{
      id: string
      type: string
      title: string
      content: string
      relevance: number
      highlights: string[]
    }>
    aggregations: {
      types: Record<string, number>
      statuses: Record<string, number>
      tags: Record<string, number>
    }
  }
  meta: {
    pagination: PaginationMeta
    queryTime: number
  }
}
```

## 📁 文件上传API

### 单文件上传

```typescript
// POST /api/upload/single
// Content-Type: multipart/form-data

interface FileUploadResponse {
  success: true
  data: {
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    uploadedAt: string
  }
  message: "文件上传成功"
}
```

### 多文件上传

```typescript
// POST /api/upload/multiple
// Content-Type: multipart/form-data

interface MultiFileUploadResponse {
  success: true
  data: {
    files: Array<{
      id: string
      filename: string
      originalName: string
      mimeType: string
      size: number
      url: string
      uploadedAt: string
    }>
    total: number
    successful: number
    failed: number
  }
  message: "文件上传完成"
}
```

## 📈 分析统计API

### 使用统计

```typescript
// GET /api/analytics/usage?period=30d&granularity=day
interface UsageAnalyticsResponse {
  success: true
  data: {
    summary: {
      totalRequests: number
      totalTokens: number
      totalCost: number
      averageLatency: number
    }
    timeSeries: Array<{
      date: string
      requests: number
      tokens: number
      cost: number
      latency: number
    }>
    topEndpoints: Array<{
      endpoint: string
      requests: number
      percentage: number
    }>
  }
}
```

### 系统健康检查

```typescript
// GET /api/health
interface HealthCheckResponse {
  success: true
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    services: {
      database: {
        status: 'up' | 'down'
        latency: number
      }
      redis: {
        status: 'up' | 'down'
        latency: number
      }
      external: {
        status: 'up' | 'down'
        latency: number
      }
    }
    metrics: {
      uptime: number
      memoryUsage: number
      cpuUsage: number
    }
  }
}
```

## 🚦 HTTP状态码规范

### 成功状态码

- **200 OK**: 请求成功
- **201 Created**: 资源创建成功
- **202 Accepted**: 请求已接受，正在处理
- **204 No Content**: 请求成功，无返回内容

### 客户端错误

- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 无权限
- **404 Not Found**: 资源不存在
- **409 Conflict**: 资源冲突
- **422 Unprocessable Entity**: 数据验证失败
- **429 Too Many Requests**: 请求频率限制

### 服务器错误

- **500 Internal Server Error**: 服务器内部错误
- **502 Bad Gateway**: 网关错误
- **503 Service Unavailable**: 服务不可用
- **504 Gateway Timeout**: 网关超时

## 🔧 API实现模式

### 中间件链模式

```typescript
// 组合多个中间件
export default withEnhancedApi(handler, {
  enableLogging: true,
  enableRateLimit: true,
  rateLimitMax: 100,
  rateLimitWindow: 15 * 60 * 1000,
  requireAuth: true,
  requiredPermissions: ['users:read'],
  validationSchema: getUsersSchema
})
```

### 错误处理模式

```typescript
// 统一错误处理
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(
  error: any,
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.error('API Error:', error)
  
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      }
    })
  }
  
  // 默认服务器错误
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id']
    }
  })
}
```

### 数据验证模式

```typescript
// Zod验证集成
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: ApiHandler,
  options: { methods?: string[] } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { methods = ['POST', 'PUT', 'PATCH'] } = options
    
    if (methods.includes(req.method!)) {
      try {
        const validatedData = schema.parse(req.body)
        ;(req as any).validatedData = validatedData
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(422).json({
            success: false,
            error: '数据验证失败',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          })
        }
        throw error
      }
    }
    
    return handler(req, res)
  }
}
```

这套API设计规范确保了接口的一致性、可维护性和开发效率。
