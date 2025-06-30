# VibeCLI - 现代化 Web 全栈应用 CLI 工具

VibeCLI 是一个强大的命令行工具，用于快速创建现代化、生产就绪的 Web 全栈应用程序。它基于 Next.js、TypeScript、Prisma 和行业最佳实践，提供了一个有主见但灵活的开发基础。

本仓库提供三个核心组件：用于快速搭建应用的 CLI 工具、用于添加常用功能的特性生成器，以及构建可扩展 Web 应用的全面文档。

- 对于构建现代 Web 应用的开发者，我们旨在消除样板代码并加速开发
- 对于采用全栈 TypeScript 的团队，我们提供经过实战验证的模式和配置

VibeCLI 生成的应用自带身份验证、数据库集成、API 设计模式和部署配置。我们专注于开发者体验，同时保持生产级的代码质量、安全性和性能。

## 开发者指南

VibeCLI 的核心是创建完整的 Next.js 应用，预配置了 TypeScript、Prisma ORM、身份验证系统和现代 UI 组件。入门很简单：安装 CLI，运行一个命令，你就有了一个准备好开发的全栈应用。

安装 CLI 工具：

```bash
npm install -g vibe-cli-tool
```

基本使用流程：

1. 运行 `vibecli create my-app` 通过交互式配置创建新应用
2. 运行 `vibecli add auth` 为现有项目添加身份验证功能
3. 运行 `vibecli generate api users` 生成 API 端点和相关代码
4. 运行 `vibecli deploy` 将应用部署到云平台

完整示例和文档请查看 [examples/](./examples/) 目录，详细架构信息请参考 [ARCHITECTURE.md](ARCHITECTURE.md)。

## AI 工具提示词模板

像 Claude Code 这样的 AI 工具在提供适当上下文时，特别擅长构建全栈应用。当提示 AI 编程工具构建或扩展 Web 应用时，请简要说明你的需求，然后将以下上下文添加到你的指令中。

> 我想使用 VibeCLI 模式构建一个现代化的 Web 全栈应用。请按照以下步骤：
>
> 1. **仔细阅读技术规范：**
>    - <https://github.com/vibetemplate/vibecli/blob/main/README.md> - VibeCLI 架构概览、功能特性和开发模式
>    - <https://github.com/vibetemplate/vibecli/blob/main/ARCHITECTURE.md> - 完整的应用结构和技术架构
>    - <https://github.com/vibetemplate/vibecli/blob/main/API.md> - API 设计模式、身份验证和数据流
>    - <https://github.com/vibetemplate/vibecli/tree/main/examples> - 参考实现，包括身份验证和 CRUD 操作
> 2. **创建正确的应用结构：**
>    - 按照 ARCHITECTURE.md 规范生成有效的 Next.js 14 App Router 应用
>    - 实现 Prisma ORM 的正确数据库模型和迁移
>    - 包含基于 JWT 的身份验证和安全会话管理
>    - 添加适当的错误处理、验证和安全措施
> 3. **遵循最佳开发实践：**
>    - 使用 TypeScript 和 Zod 验证实现类型安全的 API 通信
>    - 用清晰的关注点分离和可重用模式构建组件
>    - 充分利用 Next.js SSR/SSG 功能和现代 React 模式
>    - 添加适当的日志记录、调试功能和开发工具
>    - 包含完整的文档和部署配置
> 4. **测试注意事项：**
>    - 验证所有 API 端点返回正确结构的响应
>    - 验证数据库操作和身份验证流程正常工作
>    - 测试组件渲染和用户交互模式
>
> 生成完整的、可立即部署的生产就绪代码。专注于安全性、性能、清晰的错误信息，并遵循现代 Web 开发标准以确保与 React/Next.js 生态系统兼容。

## 项目结构

### 最小应用

带有身份验证和数据库集成的基础 Next.js 应用。

### 示例：全栈电商应用

```text
my-ecommerce-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 身份验证页面
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/               # API 路由
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   └── orders/
│   │   ├── admin/             # 管理员仪表板
│   │   ├── products/          # 产品页面
│   │   └── layout.tsx         # 根布局
│   ├── components/            # React 组件
│   │   ├── ui/               # 基础 UI 组件
│   │   ├── auth/             # 身份验证组件
│   │   ├── product/          # 产品相关组件
│   │   └── admin/            # 管理员组件
│   ├── lib/                  # 核心工具
│   │   ├── auth.ts           # 身份验证工具
│   │   ├── db.ts             # 数据库连接
│   │   ├── validations.ts    # Zod 模式
│   │   └── utils.ts          # 辅助函数
│   └── types/                # TypeScript 定义
├── prisma/                   # 数据库模式和迁移
│   ├── schema.prisma
│   └── migrations/
├── public/                   # 静态资源
├── package.json             # 依赖和脚本
└── next.config.js           # Next.js 配置
```

### 示例：SaaS 仪表板应用

```text
my-saas-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/       # 受保护的仪表板路由
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── billing/
│   │   ├── api/               # API 路由
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── subscriptions/
│   │   │   └── webhooks/
│   │   └── (marketing)/       # 公共营销页面
│   ├── components/            # React 组件
│   │   ├── dashboard/        # 仪表板专用组件
│   │   ├── billing/          # 计费和订阅组件
│   │   └── marketing/        # 落地页组件
│   ├── lib/                  # 核心工具
│   │   ├── stripe.ts         # 支付处理
│   │   ├── email.ts          # 邮件工具
│   │   └── middleware.ts     # 身份验证中间件
│   └── hooks/                # 自定义 React hooks
├── prisma/                   # 数据库模式
└── emails/                   # 邮件模板
```

### 技术栈集成

**前端技术栈：**

- Next.js 14 + App Router 用于现代 React 开发
- TypeScript 在整个应用中提供类型安全
- Tailwind CSS + Radix UI 提供一致、无障碍的设计系统
- React Query 用于服务器状态管理和缓存

**后端技术栈：**

- Next.js API 路由 + 中间件用于身份验证和验证
- Prisma ORM + PostgreSQL/MySQL 用于类型安全的数据库操作
- JWT 身份验证 + 安全会话管理
- Zod 用于运行时验证和类型推断

**开发工具：**

- ESLint 和 Prettier 用于代码质量和格式化
- TypeScript 严格模式进行全面类型检查
- Prisma Studio 用于数据库管理和可视化
- 热重载开发 + 快速刷新

**生产特性：**

- 自动代码分割和性能优化
- 内置安全头和 CORS 配置
- 错误边界实现和结构化日志记录
- Vercel、Netlify 和 Docker 的部署配置

## 可用命令

### 核心命令

- `vibecli create <project-name>` - 创建新的全栈应用
- `vibecli add <feature>` - 为现有项目添加预构建功能
- `vibecli generate <type> <name>` - 生成 API 路由、组件或服务
- `vibecli deploy [platform]` - 将应用部署到云平台

### Create 命令选项

```bash
vibecli create my-app [options]

选项:
  -t, --template <template>    选择项目模板 (default, blog, ecommerce, saas)
  -d, --database <database>    数据库类型 (postgresql, mysql, sqlite)
  --no-auth                    跳过身份验证系统
  --no-admin                   跳过管理员面板
```

### Add 命令功能

```bash
vibecli add <feature> [options]

功能:
  auth         基于 JWT 的用户身份验证系统
  admin        带用户管理的管理员仪表板
  payment      Stripe 支付集成
  blog         支持 Markdown 的博客系统
  upload       带云存储的文件上传
  email        带模板的邮件系统
  realtime     实时功能的 WebSocket 集成

选项:
  -f, --force  覆盖现有文件
```

### Generate 命令类型

```bash
vibecli generate <type> <name> [options]

类型:
  api          带 CRUD 操作的 REST API 路由
  component    带 TypeScript 的 React 组件
  service      业务逻辑的服务层
  model        数据库模型和 TypeScript 类型

选项:
  -m, --model <model>  与现有模型关联
```

## 示例和模板

浏览 [examples/](./examples/) 目录获取完整的参考实现：

- **[身份验证系统](examples/auth-system/)** - 完整的用户管理，包含注册、登录和基于角色的访问
- **[CRUD 操作](examples/crud-operations/)** - 完整的数据管理模式，包含验证和错误处理
- **[文件上传](examples/file-upload/)** - 图像和文件处理，集成云存储
- **[实时功能](examples/realtime/)** - WebSocket 实现，支持实时更新和通知

每个示例包含：

- 带 TypeScript 的完整源代码
- 数据库模式和迁移
- API 文档和测试示例
- 部署配置
- 安全性和性能考虑

---

**注意：** VibeCLI 生成具有安全最佳实践的生产就绪代码，但在部署到生产环境之前，请始终审查和自定义生成的代码以满足你的特定需求。
