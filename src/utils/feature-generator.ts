import * as fs from 'fs-extra'
import * as path from 'path'
import chalk from 'chalk'
// 移除未使用的导入

export interface FeatureConfig {
  name: string
  type: 'auth' | 'admin' | 'payment' | 'blog' | 'ecommerce' | 'chat' | 'api'
  files: string[]
  dependencies?: string[]
  devDependencies?: string[]
  scripts?: Record<string, string>
}

export const FEATURES: Record<string, FeatureConfig> = {
  auth: {
    name: '认证系统',
    type: 'auth',
    files: [
      'src/lib/auth.ts',
      'src/app/api/auth/route.ts',
      'src/components/LoginForm.tsx',
      'src/components/RegisterForm.tsx',
      'src/middleware.ts'
    ],
    dependencies: [
      'next-auth@^4.24.5',
      '@auth/prisma-adapter@^1.4.0',
      'bcryptjs@^2.4.3'
    ],
    devDependencies: ['@types/bcryptjs@^2.4.6']
  },
  admin: {
    name: '管理面板',
    type: 'admin',
    files: [
      'src/app/admin/layout.tsx',
      'src/app/admin/page.tsx',
      'src/app/admin/users/page.tsx',
      'src/components/admin/Sidebar.tsx',
      'src/components/admin/DataTable.tsx'
    ]
  },
  payment: {
    name: '支付系统',
    type: 'payment',
    files: [
      'src/lib/stripe.ts',
      'src/app/api/payment/route.ts',
      'src/components/PaymentForm.tsx',
      'src/components/PricingCard.tsx'
    ],
    dependencies: ['stripe@^14.21.0']
  },
  blog: {
    name: '博客系统',
    type: 'blog',
    files: [
      'src/app/blog/page.tsx',
      'src/app/blog/[slug]/page.tsx',
      'src/components/blog/PostCard.tsx',
      'src/components/blog/PostEditor.tsx',
      'src/lib/markdown.ts'
    ],
    dependencies: [
      'gray-matter@^4.0.3',
      'remark@^15.0.1',
      'remark-html@^16.0.1'
    ]
  },
  ecommerce: {
    name: '电商系统',
    type: 'ecommerce',
    files: [
      'src/app/products/page.tsx',
      'src/app/cart/page.tsx',
      'src/components/ProductCard.tsx',
      'src/components/ShoppingCart.tsx',
      'src/lib/cart.ts'
    ]
  },
  chat: {
    name: '实时聊天',
    type: 'chat',
    files: [
      'src/app/chat/page.tsx',
      'src/components/ChatRoom.tsx',
      'src/components/MessageList.tsx',
      'src/lib/socket.ts'
    ],
    dependencies: ['socket.io-client@^4.7.5'],
    devDependencies: ['@types/socket.io-client@^3.0.0']
  },
  api: {
    name: 'RESTful API',
    type: 'api',
    files: [
      'src/app/api/users/route.ts',
      'src/app/api/posts/route.ts',
      'src/lib/api-helpers.ts',
      'src/lib/validation.ts'
    ],
    dependencies: ['zod@^3.22.4']
  }
}

export async function generateFeature(featureName: string, projectRoot: string, force = false): Promise<void> {
  const feature = FEATURES[featureName.toLowerCase()]
  
  if (!feature) {
    throw new Error(`不支持的功能: ${featureName}\\n支持的功能: ${Object.keys(FEATURES).join(', ')}`)
  }

  console.log(chalk.blue(`正在生成 ${feature.name} 功能...`))

  // 生成文件
  for (const filePath of feature.files) {
    const fullPath = path.join(projectRoot, filePath)
    const templateName = getTemplateNameFromPath(filePath, feature.type)
    
    if (await fs.pathExists(fullPath) && !force) {
      console.log(chalk.yellow(`跳过已存在的文件: ${filePath}`))
      continue
    }

    await fs.ensureDir(path.dirname(fullPath))
    const content = await generateFeatureFile(templateName, feature.type)
    await fs.writeFile(fullPath, content)
    console.log(chalk.green(`✓ 创建文件: ${filePath}`))
  }

  // 更新 package.json
  if (feature.dependencies || feature.devDependencies || feature.scripts) {
    await updatePackageJson(projectRoot, feature)
  }

  console.log(chalk.green(`\\n✅ ${feature.name} 功能生成完成！`))
  
  if (feature.dependencies?.length) {
    console.log(chalk.yellow('\\n📦 请运行以下命令安装新的依赖:'))
    console.log(chalk.cyan('npm install'))
  }
}

function getTemplateNameFromPath(filePath: string, featureType: string): string {
  const fileName = path.basename(filePath, path.extname(filePath))
  const isComponent = filePath.includes('/components/')
  const isApi = filePath.includes('/api/')
  const isPage = filePath.includes('/app/') && !isApi
  
  if (isApi) return `${featureType}-api`
  if (isComponent) return `${featureType}-component-${fileName.toLowerCase()}`
  if (isPage) return `${featureType}-page`
  return `${featureType}-${fileName.toLowerCase()}`
}

async function generateFeatureFile(templateName: string, featureType: string): Promise<string> {
  // 这里应该从模板文件生成内容，现在先返回基本模板
  switch (featureType) {
    case 'auth':
      return generateAuthTemplate(templateName)
    case 'admin':
      return generateAdminTemplate(templateName)
    case 'payment':
      return generatePaymentTemplate(templateName)
    case 'blog':
      return generateBlogTemplate(templateName)
    case 'ecommerce':
      return generateEcommerceTemplate(templateName)
    case 'chat':
      return generateChatTemplate(templateName)
    case 'api':
      return generateApiTemplate(templateName)
    default:
      return '// TODO: 实现功能'
  }
}

function generateAuthTemplate(templateName: string): string {
  if (templateName.includes('api')) {
    return `import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // TODO: 实现认证逻辑
    const hashedPassword = await bcrypt.hash(password, 12)
    
    return NextResponse.json({ message: '认证成功' })
  } catch (error) {
    return NextResponse.json({ error: '认证失败' }, { status: 401 })
  }
}
`
  }
  
  if (templateName.includes('component')) {
    return `'use client'
    
import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 实现登录逻辑
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label htmlFor="password">密码</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
        登录
      </button>
    </form>
  )
}
`
  }
  
  return '// TODO: 实现认证功能'
}

function generateAdminTemplate(templateName: string): string {
  return `// TODO: 实现管理面板功能
export default function AdminComponent() {
  return (
    <div>
      <h2>管理面板</h2>
    </div>
  )
}
`
}

function generatePaymentTemplate(templateName: string): string {
  return '// TODO: 实现支付功能'
}

function generateBlogTemplate(templateName: string): string {
  return '// TODO: 实现博客功能'
}

function generateEcommerceTemplate(templateName: string): string {
  return '// TODO: 实现电商功能'
}

function generateChatTemplate(templateName: string): string {
  return '// TODO: 实现聊天功能'
}

function generateApiTemplate(templateName: string): string {
  return `import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: 实现 API 逻辑
    return NextResponse.json({ data: [] })
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
`
}

async function updatePackageJson(projectRoot: string, feature: FeatureConfig): Promise<void> {
  const packageJsonPath = path.join(projectRoot, 'package.json')
  const packageJson = await fs.readJson(packageJsonPath)

  // 添加依赖
  if (feature.dependencies) {
    packageJson.dependencies = packageJson.dependencies || {}
    for (const dep of feature.dependencies) {
      const [name, version] = dep.split('@')
      packageJson.dependencies[name] = version
    }
  }

  // 添加开发依赖
  if (feature.devDependencies) {
    packageJson.devDependencies = packageJson.devDependencies || {}
    for (const dep of feature.devDependencies) {
      const [name, version] = dep.split('@')
      packageJson.devDependencies[name] = version
    }
  }

  // 添加脚本
  if (feature.scripts) {
    packageJson.scripts = { ...packageJson.scripts, ...feature.scripts }
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
}