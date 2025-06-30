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

## 🤖 MCP 协议集成 (AI 智能助手)

VibeCLI v1.2.0 新增了对 Model Context Protocol (MCP) 的完整支持，提供AI驱动的智能项目分析和生成能力。通过MCP协议，你可以在支持的AI客户端中直接使用VibeCLI的智能功能。

### 📦 MCP 安装

#### NPM 全局安装
```bash
npm install -g vibe-cli-tool@latest
```

> **当前版本**: v1.2.7  
> **包地址**: https://www.npmjs.com/package/vibe-cli-tool

#### NPX 临时使用
```bash
npx --package=vibe-cli-tool@latest vibecli-mcp-server
```

#### 从源码安装
```bash
git clone https://github.com/vibetemplate/vibecli.git
cd vibecli
npm install
npm run build
npm run mcp:dev
```

### 🚀 MCP 快速开始

#### 1. 启动 MCP 服务器

```bash
# 全局安装后直接使用
vibecli-mcp-server

# 或使用 npx 临时运行
npx --package=vibe-cli-tool@latest vibecli-mcp-server

# 调试模式
npx --package=vibe-cli-tool@latest vibecli-mcp-server --debug
```

#### 2. 配置 MCP 客户端

**Cursor 配置**

在 Cursor 的 `.cursor/mcp.json` 文件中添加：
```json
{
  "mcpServers": {
    "vibecli": {
      "command": "npx",
      "args": ["-y", "--package=vibe-cli-tool@latest", "vibecli-mcp-server"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Claude Desktop 配置**

在 Claude Desktop 配置文件中添加：
```json
{
  "mcpServers": {
    "vibecli": {
      "command": "npx",
      "args": ["-y", "--package=vibe-cli-tool@latest", "vibecli-mcp-server"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**VS Code 配置**

对于支持MCP的VS Code扩展：
```json
{
  "mcp.servers": [
    {
      "name": "vibecli",
      "command": "npx",
      "args": ["-y", "--package=vibe-cli-tool@latest", "vibecli-mcp-server"],
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
```

#### 3. MCP 工具使用

一旦配置完成，你就可以在AI客户端中使用以下VibeCLI MCP工具：

**🎯 project_analyzer** - 智能项目分析
```
请帮我分析一个电商网站项目，需要包含用户认证、商品管理、购物车和支付功能，团队规模2人，预算中等，时间要求正常。
```

**🏗️ template_generator** - 智能模板生成
```
基于刚才的分析结果，请生成完整的项目模板到 /path/to/my-ecommerce-site 目录。
```

**⚡ feature_composer** - 功能模块组合
```
为我的项目 /path/to/project 添加 JWT 认证功能，包含邮箱验证。
```

**🚀 deployment_manager** - 部署管理
```
帮我将项目部署到 Vercel，环境设置为生产环境，自定义域名为 my-awesome-app.com。
```

### 🔧 MCP 高级配置

#### 服务器配置选项

```bash
# 环境变量配置
export VIBECLI_MCP_PORT=9529          # MCP服务器端口
export VIBECLI_LOG_LEVEL=info         # 日志级别
export VIBECLI_SESSION_TIMEOUT=1800   # 会话超时时间(秒)
export VIBECLI_MAX_PROJECTS=50        # 最大并发项目数
```

#### 会话管理

VibeCLI MCP 支持智能会话管理：
- **断线重连**: 自动恢复中断的任务
- **任务状态**: 实时跟踪项目生成进度 
- **事件重播**: 重连时恢复丢失的进度信息
- **并发支持**: 同时处理多个项目分析和生成

#### 安全考虑

- MCP服务器默认只监听本地连接
- 支持会话级别的访问控制
- 所有文件操作都有权限验证
- 生成的项目代码遵循安全最佳实践

### 🔗 MCP 命令行使用

除了在 AI 客户端中使用，你也可以直接通过命令行测试 MCP 功能：

```bash
# 测试 MCP 服务器是否正常启动
npx --package=vibe-cli-tool@latest vibecli-mcp-server --help

# 查看版本信息
npx --package=vibe-cli-tool@latest vibecli-mcp-server --version

# 启用调试模式查看详细日志
npx --package=vibe-cli-tool@latest vibecli-mcp-server --debug
```

### 💡 MCP 使用示例

**完整项目生成流程**:
```
1. AI客户端: "我想创建一个SaaS项目，包含用户订阅、支付和数据分析功能"
2. VibeCLI分析: 智能识别为SaaS类型，推荐Next.js + PostgreSQL + Stripe技术栈
3. 生成项目: 自动创建完整的模板代码、数据库模式和配置文件
4. 添加功能: 逐步添加认证、支付、分析等功能模块
5. 部署上线: 自动配置部署到Vercel或其他平台
```

**AI智能决策展示**:
- 🧠 **项目类型识别**: 基于自然语言描述自动识别项目类型
- 📊 **复杂度评估**: 智能评估项目复杂度和开发时间
- 🏗️ **架构推荐**: 根据约束条件推荐最适合的技术架构
- ⚠️ **风险评估**: 识别潜在风险并提供缓解方案
- 🔄 **替代方案**: 提供多个可选的技术栈组合

### 🎯 MCP 提示词使用指南

一旦配置完成 MCP 客户端，你可以使用 `@vibecli` 前缀来唤醒 VibeCLI MCP 服务器。以下是一些实用的提示词示例：

#### 🏗️ 项目创建提示词

```
@vibecli 帮我创建一个电商网站，需要包含：
- 用户注册和登录功能
- 商品展示和购买功能
- 购物车和订单管理
- 管理员后台管理
- 支付集成（Stripe）
项目名称：my-ecommerce-store
```

```
@vibecli create a new SaaS project with:
- User authentication and subscription management
- Dashboard with analytics
- Stripe payment integration
- Email notifications
- Admin panel
Project name: my-saas-app
```

#### ⚡ 功能添加提示词

```
@vibecli 为我的项目 /path/to/my-project 添加以下功能：
- JWT 认证系统
- 用户个人资料管理
- 密码重置功能
- 邮箱验证
```

```
@vibecli add real-time chat feature to my project at /path/to/my-project:
- WebSocket integration
- Message history
- User online status
- File sharing capability
```

#### 🔧 代码生成提示词

```
@vibecli 为我的项目生成以下 API 端点：
- POST /api/users - 创建用户
- GET /api/users - 获取用户列表
- PUT /api/users/:id - 更新用户信息
- DELETE /api/users/:id - 删除用户
包含完整的 TypeScript 类型定义和 Zod 验证
```

```
@vibecli generate a complete product management system:
- Product model with Prisma schema
- CRUD API routes
- React components for product listing
- Admin forms for product management
- Image upload functionality
```

#### 🚀 部署相关提示词

```
@vibecli 帮我将项目 /path/to/my-project 部署到：
- 平台：Vercel
- 环境：生产环境
- 域名：my-awesome-app.com
- 数据库：PostgreSQL
- 环境变量自动配置
```

```
@vibecli deploy my project to AWS with:
- Docker containerization
- RDS PostgreSQL database
- S3 for file storage
- CloudFront CDN
- SSL certificate setup
```

#### 🔍 项目分析提示词

```
@vibecli 分析我的项目 /path/to/my-project 并提供：
- 代码质量评估
- 性能优化建议
- 安全性检查
- 架构改进建议
- 依赖更新建议
```

```
@vibecli analyze my project structure and recommend:
- Better folder organization
- Code splitting strategies
- Performance optimizations
- Security improvements
- Testing strategies
```

#### 💡 智能问答提示词

```
@vibecli 我想在我的 Next.js 项目中实现：
- 用户权限管理系统
- 基于角色的访问控制
- 请推荐最佳实践和实现方案
```

```
@vibecli what's the best way to implement:
- Real-time notifications
- File upload with progress
- Advanced search functionality
- Multi-language support
in a Next.js application?
```

#### 🎨 模板定制提示词

```
@vibecli 基于我的需求定制一个模板：
- 行业：在线教育
- 功能：课程管理、学生管理、在线支付、视频播放
- 风格：现代简约
- 颜色主题：蓝色系
```

```
@vibecli customize a template for my startup:
- Industry: Fintech
- Features: User onboarding, KYC verification, transaction tracking
- Design: Professional corporate style
- Compliance: GDPR, PCI DSS
```

#### 📱 移动端适配提示词

```
@vibecli 为我的项目添加移动端支持：
- 响应式设计
- PWA 功能
- 移动端专用组件
- 触摸手势支持
- 离线功能
```

### 🎪 MCP 互动技巧

1. **具体描述需求**：提供详细的功能需求和技术要求
2. **指定路径**：明确项目路径和文件位置
3. **分步骤操作**：复杂功能可以分步骤实现
4. **利用上下文**：VibeCLI 会记住对话上下文，可以进行连续操作
5. **验证结果**：生成代码后可以要求解释和验证

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
