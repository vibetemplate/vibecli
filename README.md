# VibeCLI - AI驱动的智能全栈开发工具

🚀 **从命令驱动到智能对话驱动的革命性升级** - VibeCLI是一个集成模板商店生态、智能部署生成器、多语言支持的下一代Web全栈应用CLI工具。通过Model Context Protocol (MCP)协议实现AI智能上下文感知，为开发者提供32x效率提升的现代化开发体验。

![VibeCLI Demo](https://raw.githubusercontent.com/vibetemplate/vibecli/main/docs/demo.gif)

[![npm version](https://badge.fury.io/js/vibe-cli-tool.svg)](https://badge.fury.io/js/vibe-cli-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.17.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)

## 🚀 快速开始

### 1️⃣ 安装VibeCLI

```bash
# NPM全局安装
npm install -g vibe-cli-tool

# 或使用Yarn
yarn global add vibe-cli-tool

# 验证安装
vibecli --version
```

### 2️⃣ 启动MCP智能服务

```bash
# 启动MCP服务器
vibecli-mcp-server

# 配置AI客户端（Cursor/Claude Desktop/VS Code）
# 详见下方配置指南
```

### 3️⃣ 创建你的第一个项目

```bash
# 智能对话式创建
vibecli create my-awesome-app

# 或指定模板
vibecli create my-blog --template blog

# 进入项目目录
cd my-awesome-app

# 启动开发服务器
npm run dev
```

🎉 **恭喜！** 你的现代化全栈应用已经运行在 `http://localhost:3000`

## 🔧 MCP客户端配置

### Cursor配置

在 `.cursor/mcp.json` 文件中添加：

```json
{
  "mcpServers": {
    "vibecli": {
      "command": "npx",
      "args": ["-y", "--package=vibe-cli-tool", "vibecli-mcp-server"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Claude Desktop配置

在Claude Desktop配置文件中添加：

```json
{
  "mcpServers": {
    "vibecli": {
      "command": "npx", 
      "args": ["-y", "--package=vibe-cli-tool", "vibecli-mcp-server"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### VS Code配置

```json
{
  "mcp.servers": [
    {
      "name": "vibecli",
      "command": "npx",
      "args": ["-y", "--package=vibe-cli-tool", "vibecli-mcp-server"],
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
```

## 📋 核心命令

### 项目管理
```bash
# 创建新项目
vibecli create <project-name> [options]

# 模板商店操作
vibecli template install <template-name>
vibecli template list
vibecli template search <keyword>
vibecli template update

# 功能添加
vibecli add <feature> [options]
vibecli add auth          # 认证系统
vibecli add payment       # 支付集成
vibecli add admin         # 管理面板
vibecli add blog          # 博客系统
```

### 智能功能
```bash
# AI助手对话
vibecli chat

# 交互式学习
vibecli learn [topic]

# 智能部署
vibecli deploy [platform]

# 环境检查
vibecli doctor

# 代码生成
vibecli generate <type> <name>
```

### 语言和配置
```bash
# 语言切换
vibecli config set language zh-CN
vibecli config set language en-US

# 配置管理
vibecli config list
vibecli config reset
```

## ✨ 核心特性

### 🏪 **模板商店生态系统**
- **远程模板市场** - 安全安装验证，数字签名保护
- **本地模板管理** - 离线开发支持，版本化管理
- **智能模板匹配** - 多层次匹配策略（精确、特征、相似度、动态生成）
- **社区驱动** - 开源模板生态，持续更新

### 🧠 **智能部署生成器**
- **多平台支持** - Vercel、Netlify、AWS、Docker一键配置
- **环境自动检测** - 智能识别项目类型和依赖关系
- **配置文件生成** - 自动生成部署配置和CI/CD流程
- **最佳实践集成** - 安全性、性能优化自动应用

### 🌍 **国际化支持**
- **多语言CLI界面** - 中文、英文界面切换
- **本地化模板** - 适应不同地区的开发习惯
- **区域化配置** - 自动适配时区、货币等本地设置
- **社区翻译** - 开放式翻译贡献机制

### 🎓 **交互式学习系统**
- **分步教程指导** - 内置学习路径，从入门到进阶
- **实时代码提示** - 智能代码补全和最佳实践建议
- **错误诊断** - 友好的错误信息和解决方案
- **知识库集成** - 文档、示例、FAQ一站式查询

### 🔒 **企业级安全**
- **Ed25519数字签名** - 模板和代码包完整性验证
- **SHA-256哈希验证** - 文件传输安全保障
- **权限管理** - 细粒度的文件系统访问控制
- **安全审计** - 代码生成安全性检查

### 🤖 **MCP智能上下文**
- **AI决策引擎** - 基于上下文的智能项目分析
- **渐进式理解** - 多轮对话构建完整项目画像
- **智能降级处理** - 当无完美匹配时提供最佳替代方案
- **上下文感知** - 记住用户偏好和项目历史

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 14** - App Router + Server Components
- **TypeScript** - 全栈类型安全
- **Tailwind CSS** - 现代化样式系统
- **Radix UI** - 无障碍组件库
- **React Query** - 服务器状态管理

### 后端技术栈
- **Next.js API Routes** - RESTful API设计
- **Prisma ORM** - 类型安全的数据库操作
- **PostgreSQL/MySQL** - 生产级数据库支持
- **JWT Authentication** - 安全认证机制
- **Zod** - 运行时数据验证

### 开发工具链
- **TypeScript** - 严格模式类型检查
- **ESLint + Prettier** - 代码质量保证
- **Jest** - 单元测试和集成测试
- **Prisma Studio** - 数据库可视化管理
- **Hot Reload** - 快速开发反馈

### 智能特性
- **MCP Protocol** - AI上下文协议集成
- **Template Engine** - Mustache模板渲染
- **Digital Signature** - Ed25519安全签名
- **Multi-language** - i18n国际化支持

## 📁 项目结构

生成的项目采用现代化的目录结构：

```
my-app/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # 认证页面组
│   │   ├── api/             # API路由
│   │   ├── globals.css      # 全局样式
│   │   └── layout.tsx       # 根布局
│   ├── components/          # React组件
│   │   ├── ui/             # 基础UI组件
│   │   ├── auth/           # 认证组件
│   │   └── layout/         # 布局组件
│   ├── lib/                # 工具函数
│   │   ├── auth.ts         # 认证逻辑
│   │   ├── db.ts           # 数据库连接
│   │   ├── validations.ts  # 数据验证
│   │   └── utils.ts        # 通用工具
│   └── types/              # TypeScript类型
├── prisma/                 # 数据库模式
│   ├── schema.prisma
│   └── migrations/
├── public/                 # 静态资源
├── package.json           # 项目配置
└── next.config.js         # Next.js配置
```

## 🎯 使用场景

### 📝 **内容管理系统**
```bash
vibecli create my-cms --template cms
vibecli add auth admin blog
```

### 🛒 **电商平台**
```bash
vibecli create my-store --template ecommerce
vibecli add payment cart inventory
```

### 💼 **SaaS应用**
```bash
vibecli create my-saas --template saas
vibecli add subscription analytics dashboard
```

### 🎨 **作品集网站**
```bash
vibecli create my-portfolio --template portfolio
vibecli add blog gallery contact
```

## 🌟 高级功能

### 智能模板匹配
VibeCLI实现多层次模板匹配策略：

1. **精确匹配** (90%+) - 直接命中现有模板
2. **特征匹配** (70-90%) - 基于功能需求组合
3. **相似度匹配** (50-70%) - 最接近模板作为基础
4. **动态生成** (<50%) - 生成定制化方案
5. **智能降级** - 提供替代方案和指导

### 智能部署配置
自动检测项目特征，生成最优部署配置：

- **环境检测** - 自动识别框架和依赖
- **平台适配** - 针对不同平台优化配置
- **安全配置** - CORS、CSP、环境变量管理
- **性能优化** - CDN、缓存、压缩配置

### 交互式学习
内置分步教程系统：

- **入门指南** - 从零开始的完整教程
- **最佳实践** - 行业标准和开发规范
- **问题诊断** - 常见问题和解决方案
- **进阶技巧** - 高级功能和优化技巧

## 🤝 参与贡献

我们欢迎社区贡献！查看详细的贡献指南：

- **[开发指南](DEVELOPMENT.md)** - 本地开发环境搭建
- **[架构文档](ARCHITECTURE.md)** - 项目架构和设计原则
- **[API文档](API.md)** - API设计规范和使用指南
- **[部署指南](DEPLOYMENT.md)** - 部署配置和最佳实践

### 快速贡献流程

```bash
# 1. Fork并克隆项目
git clone https://github.com/your-username/vibecli.git
cd vibecli

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run dev

# 4. 运行测试
npm test

# 5. 构建项目
npm run build
```

## 📄 许可证

VibeCLI采用 [MIT许可证](LICENSE.md) 开源。

## 🔗 相关链接

- **[GitHub仓库](https://github.com/vibetemplate/vibecli)** - 源代码和issue追踪
- **[NPM包](https://www.npmjs.com/package/vibe-cli-tool)** - 官方发布版本
- **[官方网站](https://vibecli.150404.xyz)** - 文档和教程
- **[更新日志](https://vibecli.150404.xyz/changelog)** - 版本历史和新功能
- **[社区讨论](https://github.com/vibetemplate/vibecli/discussions)** - 问题讨论和功能建议

## 💡 提示

> **对于AI开发工具用户：** VibeCLI特别为AI辅助开发优化。在使用Claude Code、Cursor或其他AI工具时，直接引用我们的架构文档，获得最佳的代码生成效果。查看 [AI工具集成指南](docs/ai-integration.md) 了解更多。

---

**让AI驱动你的全栈开发之旅！** 🚀✨