import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'
import { validateProjectName, validateProjectDirectory, displayValidationErrors } from '../utils/validation'

interface CreateOptions {
  template?: string
  database?: 'postgresql' | 'mysql' | 'sqlite'
  auth?: boolean
  admin?: boolean
}

export async function createApp(projectName: string, options: CreateOptions) {
  console.log(chalk.blue.bold('\n🚀 创建Web全栈应用\n'))

  // 验证项目名称
  const nameValidation = validateProjectName(projectName)
  if (!nameValidation.valid) {
    console.error(chalk.red('❌ 项目名称无效'))
    displayValidationErrors(nameValidation)
    process.exit(1)
  }

  // 检查目录是否存在
  const projectPath = path.resolve(process.cwd(), projectName)
  if (fs.existsSync(projectPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `目录 ${projectName} 已存在，是否覆盖？`,
        default: false
      }
    ])

    if (!overwrite) {
      console.log(chalk.yellow('❌ 操作已取消'))
      process.exit(0)
    }

    await fs.remove(projectPath)
  }

  // 交互式配置
  const config = await promptForConfig(options)

  // 生成项目
  const spinner = ora('正在创建项目...').start()
  
  try {
    await generateProject(projectName, projectPath, config)
    
    spinner.succeed('项目创建成功!')

    // 安装依赖
    spinner.start('正在安装依赖...')
    process.chdir(projectPath)
    execSync('npm install', { stdio: 'pipe' })
    spinner.succeed('依赖安装完成!')

    // 初始化数据库
    if (config.database !== 'sqlite') {
      spinner.start('正在初始化数据库...')
      execSync('npx prisma generate', { stdio: 'pipe' })
      spinner.succeed('数据库初始化完成!')
    }

    // 显示完成信息
    console.log(chalk.green.bold('\n✅ 项目创建完成!\n'))
    console.log(chalk.blue('下一步操作:'))
    console.log(`  cd ${projectName}`)
    console.log('  npm run dev')
    console.log('')
    console.log(chalk.blue('其他命令:'))
    console.log('  npm run build     # 构建生产版本')
    console.log('  npm run db:studio # 打开数据库管理界面')
    console.log('  web-cli add auth  # 添加认证功能')
    console.log('')

  } catch (error) {
    spinner.fail('项目创建失败')
    console.error(chalk.red(error))
    process.exit(1)
  }
}

async function promptForConfig(options: CreateOptions) {
  const questions = []

  // 项目模板选择
  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: '选择项目模板:',
      choices: [
        { name: '默认模板 (基础功能)', value: 'default' },
        { name: '电商模板 (商品管理)', value: 'ecommerce' },
        { name: '博客模板 (内容管理)', value: 'blog' },
        { name: '仪表板模板 (数据展示)', value: 'dashboard' },
        { name: 'SaaS模板 (多租户)', value: 'saas' }
      ],
      default: 'default'
    })
  }

  // 数据库选择
  if (!options.database) {
    questions.push({
      type: 'list',
      name: 'database',
      message: '选择数据库:',
      choices: [
        { name: 'PostgreSQL (推荐)', value: 'postgresql' },
        { name: 'MySQL', value: 'mysql' },
        { name: 'SQLite (开发)', value: 'sqlite' }
      ],
      default: 'postgresql'
    })
  }

  // 功能选择
  questions.push({
    type: 'checkbox',
    name: 'features',
    message: '选择功能模块:',
    choices: [
      { name: '用户认证系统', value: 'auth', checked: options.auth !== false },
      { name: '管理员面板', value: 'admin', checked: options.admin !== false },
      { name: '文件上传', value: 'upload', checked: true },
      { name: '邮件发送', value: 'email', checked: false },
      { name: '支付集成', value: 'payment', checked: false },
      { name: '实时通信', value: 'realtime', checked: false }
    ]
  })

  // UI框架选择
  questions.push({
    type: 'list',
    name: 'uiFramework',
    message: '选择UI框架:',
    choices: [
      { name: 'Tailwind CSS + Radix UI (推荐)', value: 'tailwind-radix' },
      { name: 'Ant Design', value: 'antd' },
      { name: 'Material-UI', value: 'mui' },
      { name: 'Chakra UI', value: 'chakra' }
    ],
    default: 'tailwind-radix'
  })

  const answers = await inquirer.prompt(questions)

  return {
    template: options.template || answers.template,
    database: options.database || answers.database,
    features: answers.features || [],
    uiFramework: answers.uiFramework,
    auth: options.auth !== false && answers.features.includes('auth'),
    admin: options.admin !== false && answers.features.includes('admin'),
    upload: answers.features.includes('upload'),
    email: answers.features.includes('email'),
    payment: answers.features.includes('payment'),
    realtime: answers.features.includes('realtime')
  }
}

async function generateProject(projectName: string, projectPath: string, config: any) {
  // 创建项目目录
  await fs.ensureDir(projectPath)
  
  // 生成基本的 Next.js 项目结构
  const packageJson: any = {
    name: projectName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build", 
      start: "next start",
      lint: "next lint",
      "db:generate": "prisma generate",
      "db:push": "prisma db push",
      "db:studio": "prisma studio"
    },
    dependencies: {
      "next": "14.0.0",
      "react": "^18",
      "react-dom": "^18",
      "@prisma/client": "^5.7.0",
      "prisma": "^5.7.0"
    },
    devDependencies: {
      "typescript": "^5",
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      "eslint": "^8",
      "eslint-config-next": "14.0.0"
    }
  }

  // 添加根据配置选择的依赖
  if (config.uiFramework === 'tailwind-radix') {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      "tailwindcss": "^3.3.0",
      "autoprefixer": "^10.4.16",
      "postcss": "^8.4.32"
    }
    packageJson.dependencies = {
      ...packageJson.dependencies,
      "@radix-ui/react-slot": "^1.0.2",
      "class-variance-authority": "^0.7.0",
      "clsx": "^2.0.0",
      "tailwind-merge": "^2.0.0"
    }
  }

  // 写入 package.json
  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 })

  // 创建基本目录结构
  await fs.ensureDir(path.join(projectPath, 'src', 'app'))
  await fs.ensureDir(path.join(projectPath, 'src', 'components'))
  await fs.ensureDir(path.join(projectPath, 'src', 'lib'))
  await fs.ensureDir(path.join(projectPath, 'prisma'))

  // 生成基本文件
  await generateBasicFiles(projectPath, config)
}

async function generateBasicFiles(projectPath: string, config: any) {
  // Next.js app router layout
  const layout = `import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '${config.projectName || 'My App'}',
  description: 'Generated by VibeCLI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
`

  // Next.js app router page
  const page = `export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        欢迎使用 VibeCLI
      </h1>
      <p className="text-center text-gray-600">
        你的全栈应用已经准备就绪！
      </p>
    </main>
  )
}
`

  // Tailwind CSS 配置
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`

  // Global CSS
  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
`

  // TypeScript 配置
  const tsConfig = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`

  // Next.js 配置
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
`

  // Prisma schema
  const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${config.database}"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
`

  // 环境变量示例
  const envExample = `# Database
DATABASE_URL="${config.database}://username:password@localhost:5432/database"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
`

  // 写入文件
  await fs.writeFile(path.join(projectPath, 'src', 'app', 'layout.tsx'), layout)
  await fs.writeFile(path.join(projectPath, 'src', 'app', 'page.tsx'), page)
  await fs.writeFile(path.join(projectPath, 'src', 'app', 'globals.css'), globalsCss)
  await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig)
  await fs.writeFile(path.join(projectPath, 'tsconfig.json'), tsConfig)
  await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig)
  await fs.writeFile(path.join(projectPath, 'prisma', 'schema.prisma'), prismaSchema)
  await fs.writeFile(path.join(projectPath, '.env.example'), envExample)

  // PostCSS 配置 (如果使用 Tailwind)
  if (config.uiFramework === 'tailwind-radix') {
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
    await fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfig)
  }
}
