# VibeCLI v1.5.0 - 智能模板匹配与降级处理系统

VibeCLI 是一个AI驱动的命令行工具，通过**Model Context Protocol (MCP)**协议提供智能项目分析和代码生成能力。它基于 Next.js、TypeScript、Prisma 和行业最佳实践，结合多轮对话上下文进行智能匹配，为开发者提供个性化的Web全栈应用开发体验。

## 🎯 v1.5.0 重大更新

### 🧠 智能模板匹配系统
- **多层次匹配策略** - 精确匹配、特征匹配、相似度匹配、动态生成和智能降级
- **需求特征提取** - 深度分析用户描述，识别核心业务需求和技术特性
- **模板相似度评分** - 智能计算模板与需求的匹配度，提供最佳推荐

### 🎭 智能降级处理机制
- **混合方案** - 当无完美匹配时，智能组合多个模板特性
- **渐进式构建** - 复杂需求分阶段实现，降低开发风险
- **定制指导** - 独特需求提供专业的定制开发指导
- **社区方案** - 推荐相关开源解决方案和最佳实践

### 🤖 交互式需求澄清
- **智能问题生成** - 基于缺失信息自动生成澄清问题
- **上下文感知选项** - 提供具体的选择项和影响分析
- **决策辅助** - 为关键技术决策提供利弊分析

### 🔧 跨平台目录管理 (v1.4.0继承)
- **默认目录策略** - Mac: `~/Development/VibeCLI`, Windows: `~/Documents/VibeCLI`
- **智能权限检查** - 自动验证目录权限并创建必要路径
- **清晰位置提示** - 明确告知用户文件生成位置和启动方式

## 开发者指南

VibeCLI 的核心是创建完整的 Next.js 应用，预配置了 TypeScript、Prisma ORM、身份验证系统和现代 UI 组件。入门很简单：安装 CLI，运行一个命令，你就有了一个准备好开发的全栈应用。

## 🚀 快速开始

### 安装 VibeCLI v1.5.0

```bash
# 全局安装最新版本
npm install -g vibe-cli-tool@1.5.0

# 启动MCP智能提示词生成服务器
vibecli-mcp-server
```

### 基本使用流程

1. **启动MCP服务器**: `vibecli-mcp-server` 
2. **配置AI客户端**: 在Cursor、Claude Desktop或VS Code中配置MCP连接
3. **智能对话生成**: 通过自然语言描述项目需求，系统会渐进式理解并生成专业提示词
4. **项目快速创建**: `vibecli create my-app` 使用生成的提示词快速搭建应用
5. **智能功能扩展**: `vibecli add auth` 基于上下文智能添加功能模块

完整示例和文档请查看 [examples/](./examples/) 目录，详细架构信息请参考 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 🧠 智能模板匹配与项目生成系统

VibeCLI v1.5.0 实现了革命性的**智能模板匹配系统**，能够处理任何类型的项目需求。即使没有完美匹配的模板，系统也会提供智能的降级方案和详细的实施指导。

### 🎯 核心智能功能

#### 📝 多层次模板匹配
- **精确匹配**: 直接命中现有模板 (80%+ 匹配度)
- **特征匹配**: 基于功能需求组合模板 (60-80% 匹配度)  
- **相似度匹配**: 使用最接近的模板作为基础 (40-60% 匹配度)
- **动态生成**: 生成定制化实施方案 (< 40% 匹配度)
- **智能降级**: 提供替代方案和详细指导

#### 🤖 智能需求分析
- **业务类型识别**: 电商、SaaS、博客、作品集、仪表板等
- **功能特征提取**: 认证、支付、搜索、分析、实时通信等
- **技术栈推荐**: 基于项目复杂度和用户经验智能匹配
- **复杂度评估**: 自动估算开发时间和技术难度

#### 🎭 智能降级处理
- **混合方案**: 组合多个模板特性，覆盖90%+需求
- **渐进式实施**: 复杂项目分阶段开发，降低风险
- **定制指导**: 提供专业的架构设计和实施建议
- **资源推荐**: 相关库、文档、教程和社区资源

#### 💬 交互式澄清系统
- **智能问题生成**: 基于缺失信息自动生成具体问题
- **上下文感知选项**: 提供详细的选择说明和影响分析
- **决策辅助工具**: 技术选型的利弊对比和推荐理由

### 📦 MCP 安装

#### NPM 全局安装
```bash
npm install -g vibe-cli-tool@1.5.0
```

> **当前版本**: v1.5.0 🎉  
> **包地址**: https://www.npmjs.com/package/vibe-cli-tool  
> **新特性**: 智能模板匹配与降级处理系统

#### NPX 临时使用
```bash
npx --package=vibe-cli-tool@1.5.0 vibecli-mcp-server
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
npx --package=vibe-cli-tool@1.5.0 vibecli-mcp-server

# 调试模式
npx --package=vibe-cli-tool@1.5.0 vibecli-mcp-server --debug
```

#### 2. 配置 MCP 客户端

**Cursor 配置**

在 Cursor 的 `.cursor/mcp.json` 文件中添加：
```json
{
  "mcpServers": {
    "vibecli": {
      "command": "npx",
      "args": ["-y", "--package=vibe-cli-tool@1.5.0", "vibecli-mcp-server"],
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
      "args": ["-y", "--package=vibe-cli-tool@1.5.0", "vibecli-mcp-server"],
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
      "args": ["-y", "--package=vibe-cli-tool@1.3.0", "vibecli-mcp-server"],
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

**🎨 prompt_generator** - MCP智能提示词生成器 [v1.3.0 NEW]
```
我想开发一个电商网站，需要支付功能和用户管理
```
系统会通过多轮对话逐步理解您的需求，生成专业的开发指导提示词。

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
npx --package=vibe-cli-tool@1.3.0 vibecli-mcp-server --help

# 查看版本信息
npx --package=vibe-cli-tool@1.3.0 vibecli-mcp-server --version

# 启用调试模式查看详细日志
npx --package=vibe-cli-tool@1.3.0 vibecli-mcp-server --debug
```

### 💡 v1.3.0 智能提示词生成示例

**MCP智能对话流程** [NEW]:
```
1. 用户: "我想做一个电商网站"
2. VibeCLI: "理解程度:40%，需要更多信息。您希望项目包含哪些主要功能？"
3. 用户: "需要用户登录、商品管理、购物车、支付"  
4. VibeCLI: "理解程度:75%，项目类型:电商，功能:认证+支付+管理"
5. 用户: "生成提示词"
6. VibeCLI: 自动生成专业的电商开发指导提示词，包含完整技术栈和实现细节
```

**智能上下文累积**:
- 📝 **渐进式理解**: 通过多轮对话逐步构建完整的项目画像
- 🎯 **智能澄清**: 置信度不足时自动提出针对性问题
- 💾 **会话记忆**: 跨对话轮次保持项目信息和用户偏好
- 🎨 **模板匹配**: 基于累积上下文选择最适合的提示词模板
- 📊 **动态评估**: 实时评估理解程度并调整对话策略

**传统项目生成流程**:
```
1. AI客户端: "我想创建一个SaaS项目，包含用户订阅、支付和数据分析功能"
2. VibeCLI分析: 智能识别为SaaS类型，推荐Next.js + PostgreSQL + Stripe技术栈
3. 生成项目: 自动创建完整的模板代码、数据库模式和配置文件
4. 添加功能: 逐步添加认证、支付、分析等功能模块
5. 部署上线: 自动配置部署到Vercel或其他平台
```

### 🎯 v1.3.0 MCP智能提示词使用指南

一旦配置完成 MCP 客户端，你可以使用 `@vibecli` 前缀来唤醒 VibeCLI MCP 服务器。v1.3.0新增的智能提示词生成系统会通过多轮对话理解您的需求：

#### 🎨 智能提示词生成 [v1.3.0 NEW]

**简单描述开始**:
```
@vibecli 我想开发一个在线商城
```

**渐进式对话示例**:
```
用户: "我想做一个博客网站"
VibeCLI: "理解度:50%，请问您希望博客支持多用户发布还是个人博客？需要评论功能吗？"
用户: "个人博客，需要评论和分类功能"  
VibeCLI: "理解度:80%，项目类型:个人博客，功能:评论+分类。请问您的技术水平如何？"
用户: "中级开发者，生成提示词"
VibeCLI: [自动生成针对中级开发者的个人博客开发指导提示词]
```

#### 🏗️ 传统项目创建提示词

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

### 🎪 v1.3.0 MCP智能对话技巧

1. **从简单描述开始**：无需提供完整需求，系统会通过对话逐步理解
2. **相信渐进式过程**：让VibeCLI通过多轮问答构建完整项目画像
3. **及时回应澄清问题**：系统的问题都是为了更好地理解您的需求
4. **说明技术水平**：告知您的开发经验，获得更合适的指导内容
5. **充分利用会话记忆**：在同一会话中可以持续优化和调整需求

**v1.3.0 特有优势**:
- 🔒 **隐私安全**: 不依赖外部AI服务，使用MCP原生上下文
- ⚡ **响应快速**: 本地化处理，无网络延迟
- 🧠 **智能学习**: 会话内记忆用户偏好和项目信息
- 🎯 **精准匹配**: 基于累积上下文选择最佳模板

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
