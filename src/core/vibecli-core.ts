// VibeCLI核心API - 将CLI逻辑抽象为可编程接口

import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import Mustache from 'mustache'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { ensureDependenciesInstalled } from '../utils/dependency-checker.js'
import { verifySha256 } from '../utils/signature.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取模板目录的绝对路径
function getTemplatesDirectory(): string {
  // 从当前文件路径向上查找，直到找到templates目录
  let currentDir = __dirname
  
  while (currentDir !== path.dirname(currentDir)) {
    const templatesPath = path.join(currentDir, 'templates')
    if (fs.existsSync(templatesPath)) {
      return templatesPath
    }
    // 向上一级目录查找
    currentDir = path.dirname(currentDir)
  }
  
  // 如果找不到，尝试使用相对路径（开发环境）
  const fallbackPath = path.join(__dirname, '../../templates')
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath
  }
  
  throw new Error('无法找到templates目录。请确保VibeCLI正确安装。')
}
import {
  ProjectConfig,
  ProjectResult,
  FeatureConfig,
  FeatureResult,
  DeploymentConfig,
  DeploymentResult,
  GenerationConfig,
  GenerationResult,
  ProjectStatus,
  ValidationResult
} from './types.js'
import { validateProjectName, validateProjectDirectory } from '../utils/validation.js'

/**
 * 获取跨平台的默认项目目录
 */
function getDefaultProjectDirectory(): string {
  const homeDir = os.homedir()
  const platform = os.platform()
  
  switch (platform) {
    case 'darwin': // Mac
      return path.join(homeDir, 'Development', 'VibeCLI')
    case 'win32': // Windows  
      return path.join(homeDir, 'Documents', 'VibeCLI')
    default: // Linux等
      return path.join(homeDir, 'Projects', 'VibeCLI')
  }
}

/**
 * 确保目录存在，如果不存在则创建
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.ensureDir(dirPath)
  } catch (error) {
    throw new Error(`无法创建目录 ${dirPath}: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 验证目录权限
 */
async function validateDirectoryPermissions(dirPath: string): Promise<boolean> {
  try {
    // 尝试在目录中创建一个临时文件来测试写入权限
    const testFile = path.join(dirPath, '.vibecli-test')
    await fs.writeFile(testFile, 'test')
    await fs.remove(testFile)
    return true
  } catch (error) {
    return false
  }
}

/**
 * 获取平台特定的启动指令
 */
function getPlatformSpecificInstructions(projectPath: string): string[] {
  const platform = os.platform()
  const relativePath = path.basename(projectPath)
  
  const instructions = [
    '📋 下一步操作:',
    '1. 打开终端 (Terminal)',
    `2. 进入项目目录:`
  ]
  
  if (platform === 'win32') {
    instructions.push(`   cd "${projectPath}"`)
  } else {
    instructions.push(`   cd "${projectPath}"`)
  }
  
  instructions.push(
    '3. 安装依赖:',
    '   npm install',
    '4. 启动开发服务器:',
    '   npm run dev', 
    '5. 打开浏览器访问: http://localhost:3000',
    '',
    '💡 提示: 您也可以直接在文件管理器中打开项目文件夹进行开发'
  )
  
  return instructions
}

export class VibeCLICore {
  /**
   * 创建新项目
   */
  async createProject(config: ProjectConfig): Promise<ProjectResult> {
    try {
      // 验证项目配置
      const validation = await this.validateProjectConfig(config)
      if (!validation.valid) {
        return {
          success: false,
          projectPath: '',
          message: '项目配置验证失败',
          generatedFiles: [],
          nextSteps: [],
          error: validation.errors.join(', ')
        }
      }

      // 使用跨平台默认目录逻辑
      let projectPath: string
      if (config.targetDirectory) {
        // 用户指定了目录，直接使用
        projectPath = path.resolve(config.targetDirectory, config.name)
      } else {
        // 使用默认目录
        const defaultBaseDir = getDefaultProjectDirectory()
        projectPath = path.join(defaultBaseDir, config.name)
      }

      // 确保父目录存在
      const parentDir = path.dirname(projectPath)
      await ensureDirectoryExists(parentDir)

      // 验证目录权限
      const hasPermissions = await validateDirectoryPermissions(parentDir)
      if (!hasPermissions) {
        return {
          success: false,
          projectPath,
          message: '目录权限不足',
          generatedFiles: [],
          nextSteps: [],
          error: `没有权限在 ${parentDir} 创建项目。请检查目录权限或选择其他位置。`
        }
      }

      // 检查目录是否存在
      if (fs.existsSync(projectPath) && !config.overwrite) {
        return {
          success: false,
          projectPath,
          message: '目标目录已存在',
          generatedFiles: [],
          nextSteps: [],
          error: `目录 ${config.name} 已存在于 ${parentDir}。请使用不同的项目名称或启用覆盖选项。`
        }
      }

      // 如果需要覆盖，先删除现有目录
      if (fs.existsSync(projectPath) && config.overwrite) {
        await fs.remove(projectPath)
      }

      // 生成项目
      const generatedFiles = await this.generateProjectStructure(projectPath, config)

      // 安装依赖
      await this.installDependencies(projectPath)

      // 初始化数据库（仅当项目包含Prisma时）
      if (this.projectUsesPrisma(projectPath)) {
        await this.initializeDatabase(projectPath)
      }

      return {
        success: true,
        projectPath,
        message: '项目创建成功',
        generatedFiles,
        nextSteps: getPlatformSpecificInstructions(projectPath)
      }
    } catch (error) {
      // 构建错误情况下的项目路径
      let errorProjectPath: string
      if (config.targetDirectory) {
        errorProjectPath = path.resolve(config.targetDirectory, config.name)
      } else {
        const defaultBaseDir = getDefaultProjectDirectory()
        errorProjectPath = path.join(defaultBaseDir, config.name)
      }

      return {
        success: false,
        projectPath: errorProjectPath,
        message: '项目创建失败',
        generatedFiles: [],
        nextSteps: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 添加功能模块
   */
  async addFeature(projectPath: string, feature: FeatureConfig): Promise<FeatureResult> {
    try {
      // 检查项目是否存在
      const projectStatus = await this.getProjectStatus(projectPath)
      if (!projectStatus.exists || !projectStatus.isVibeCLIProject) {
        return {
          success: false,
          feature: feature.name,
          message: '无效的VibeCLI项目',
          addedFiles: [],
          modifiedFiles: [],
          instructions: [],
          error: '项目不存在或不是VibeCLI项目'
        }
      }

      // 检查功能是否已存在
      if (projectStatus.features.includes(feature.name) && !feature.force) {
        return {
          success: false,
          feature: feature.name,
          message: '功能已存在',
          addedFiles: [],
          modifiedFiles: [],
          instructions: [],
          error: `Feature ${feature.name} already exists. Use force option to overwrite.`
        }
      }

      // 根据功能类型生成相应文件
      const result = await this.generateFeatureFiles(projectPath, feature)

      return {
        success: true,
        feature: feature.name,
        message: `${feature.name} 功能添加成功`,
        addedFiles: result.addedFiles,
        modifiedFiles: result.modifiedFiles,
        instructions: result.instructions
      }
    } catch (error) {
      return {
        success: false,
        feature: feature.name,
        message: '功能添加失败',
        addedFiles: [],
        modifiedFiles: [],
        instructions: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 部署项目
   */
  async deployProject(projectPath: string, config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      // 检查项目是否存在
      const projectStatus = await this.getProjectStatus(projectPath)
      if (!projectStatus.exists || !projectStatus.isVibeCLIProject) {
        return {
          success: false,
          platform: config.platform,
          message: '无效的VibeCLI项目',
          error: '项目不存在或不是VibeCLI项目'
        }
      }

      // 构建项目
      await this.buildProject(projectPath)

      // 根据平台执行部署
      const result = await this.executeDeployment(projectPath, config)

      return {
        success: true,
        platform: config.platform,
        url: result.url,
        message: '部署成功',
        deploymentId: result.deploymentId
      }
    } catch (error) {
      return {
        success: false,
        platform: config.platform,
        message: '部署失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 生成代码
   */
  async generateCode(projectPath: string, config: GenerationConfig): Promise<GenerationResult> {
    try {
      const projectStatus = await this.getProjectStatus(projectPath)
      if (!projectStatus.exists || !projectStatus.isVibeCLIProject) {
        return {
          success: false,
          type: config.type,
          name: config.name,
          message: '无效的VibeCLI项目',
          generatedFiles: [],
          instructions: [],
          error: '项目不存在或不是VibeCLI项目'
        }
      }

      const result = await this.generateCodeFiles(projectPath, config)

      return {
        success: true,
        type: config.type,
        name: config.name,
        message: `${config.type} ${config.name} 生成成功`,
        generatedFiles: result.generatedFiles,
        instructions: result.instructions
      }
    } catch (error) {
      return {
        success: false,
        type: config.type,
        name: config.name,
        message: '代码生成失败',
        generatedFiles: [],
        instructions: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 获取项目状态
   */
  async getProjectStatus(projectPath: string): Promise<ProjectStatus> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json')
      const exists = fs.existsSync(packageJsonPath)

      if (!exists) {
        return {
          exists: false,
          isVibeCLIProject: false,
          features: [],
          framework: '',
          database: '',
          version: ''
        }
      }

      const packageJson = await fs.readJson(packageJsonPath)
      const isVibeCLIProject = packageJson.keywords?.includes('vibecli') || 
                              packageJson.devDependencies?.['vibe-cli-tool'] ||
                              fs.existsSync(path.join(projectPath, '.vibecli'))

      // 检测已安装的功能
      const features = []
      if (fs.existsSync(path.join(projectPath, 'src/lib/services/auth.ts'))) features.push('auth')
      if (fs.existsSync(path.join(projectPath, 'src/lib/services/upload.ts'))) features.push('upload')
      if (fs.existsSync(path.join(projectPath, 'src/lib/services/email.ts'))) features.push('email')

      return {
        exists: true,
        isVibeCLIProject,
        features,
        framework: packageJson.dependencies?.next ? 'Next.js' : 'Unknown',
        database: this.detectDatabase(projectPath),
        version: packageJson.version || '0.1.0'
      }
    } catch (error) {
      return {
        exists: false,
        isVibeCLIProject: false,
        features: [],
        framework: '',
        database: '',
        version: ''
      }
    }
  }

  // 私有方法

  private async validateProjectConfig(config: ProjectConfig): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证项目名称
    const nameValidation = validateProjectName(config.name)
    if (!nameValidation.valid) {
      errors.push(...nameValidation.errors)
    }
    warnings.push(...nameValidation.warnings)

    // 验证目标目录
    if (config.targetDirectory) {
      const dirValidation = await validateProjectDirectory(config.targetDirectory)
      if (!dirValidation.valid) {
        errors.push(...dirValidation.errors)
      }
      warnings.push(...dirValidation.warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private async generateProjectStructure(projectPath: string, config: ProjectConfig): Promise<string[]> {
    const generatedFiles = []

    // 根据模板生成项目
    const templateName = this.getTemplateName(config)
    const templatesDir = getTemplatesDirectory()
    const templatePath = path.join(templatesDir, templateName)
    
    // 检查模板是否存在
    if (!fs.existsSync(templatePath)) {
      throw new Error(`模板 ${templateName} 不存在。模板目录: ${templatesDir}，可用模板: default, auth-system, ecommerce`)
    }

    // 准备模板变量
    const templateVars = this.prepareTemplateVariables(config)

    // 复制和渲染模板文件
    await this.copyAndRenderTemplate(templatePath, projectPath, templateVars)

    // 校验模板文件签名
    const sigFiles = (await this.getAllFiles(templatePath)).filter(f => f.endsWith('.sha256'))
    for (const sigFile of sigFiles) {
      const targetRel = path.relative(templatePath, sigFile.replace(/\.sha256$/, ''))
      const targetFile = path.join(projectPath, targetRel)
      const ok = await verifySha256(targetFile, sigFile)
      if (!ok) {
        console.warn(`[VibeCLI] 签名校验失败: ${targetRel}`)
      }
    }

    // 将官方defaults复制为项目覆盖层，供用户自定义
    try {
      const defaultsDir = path.join(__dirname, '../mcp/config/defaults')
      const targetConfigDir = path.join(projectPath, 'vibecli-config')
      await fs.copy(defaultsDir, targetConfigDir, { overwrite: false, errorOnExist: false })

      // 收集拷贝的文件列表
      const copied = await this.getAllFiles(targetConfigDir)
      generatedFiles.push(...copied.map(f => path.relative(projectPath, f)))
    } catch (copyErr) {
      console.warn('[VibeCLI] 复制默认配置失败:', copyErr)
    }

    // 递归获取所有生成的文件
    const allFiles = await this.getAllFiles(projectPath)
    generatedFiles.push(...allFiles.map(file => path.relative(projectPath, file)))

    return generatedFiles
  }

  private generatePackageJson(config: ProjectConfig) {
    const packageJson: any = {
      name: config.name,
      version: "0.1.0",
      private: true,
      keywords: ["vibecli", "nextjs", "fullstack"],
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

    // 根据UI框架添加依赖
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

    // 根据功能添加依赖
    if (config.features.auth) {
      packageJson.dependencies = {
        ...packageJson.dependencies,
        "jsonwebtoken": "^9.0.2",
        "bcryptjs": "^2.4.3",
        "next-auth": "^4.24.5"
      }
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        "@types/jsonwebtoken": "^9.0.5",
        "@types/bcryptjs": "^2.4.6"
      }
    }

    return packageJson
  }

  private async generateBasicFiles(projectPath: string, config: ProjectConfig): Promise<string[]> {
    const files = []
    
    // Next.js基本文件
    const layout = this.generateLayoutFile(config)
    await fs.writeFile(path.join(projectPath, 'src', 'app', 'layout.tsx'), layout)
    files.push('src/app/layout.tsx')

    const page = this.generatePageFile(config)
    await fs.writeFile(path.join(projectPath, 'src', 'app', 'page.tsx'), page)
    files.push('src/app/page.tsx')

    const globalsCss = this.generateGlobalsCss()
    await fs.writeFile(path.join(projectPath, 'src', 'app', 'globals.css'), globalsCss)
    files.push('src/app/globals.css')

    // TypeScript配置
    const tsConfig = this.generateTsConfig()
    await fs.writeFile(path.join(projectPath, 'tsconfig.json'), tsConfig)
    files.push('tsconfig.json')

    // Next.js配置
    const nextConfig = this.generateNextConfig()
    await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig)
    files.push('next.config.js')

    // Prisma schema
    const prismaSchema = this.generatePrismaSchema(config)
    await fs.writeFile(path.join(projectPath, 'prisma', 'schema.prisma'), prismaSchema)
    files.push('prisma/schema.prisma')

    // 环境变量示例
    const envExample = this.generateEnvExample(config)
    await fs.writeFile(path.join(projectPath, '.env.example'), envExample)
    files.push('.env.example')

    // Tailwind配置（如果使用）
    if (config.uiFramework === 'tailwind-radix') {
      const tailwindConfig = this.generateTailwindConfig()
      await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig)
      files.push('tailwind.config.js')

      const postcssConfig = this.generatePostcssConfig()
      await fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfig)
      files.push('postcss.config.js')
    }

    // VibeCLI标识文件
    const vibecliConfig = {
      version: "2.0.0",
      template: config.template,
      database: config.database,
      uiFramework: config.uiFramework,
      features: config.features,
      createdAt: new Date().toISOString()
    }
    await fs.writeJson(path.join(projectPath, '.vibecli'), vibecliConfig, { spaces: 2 })
    files.push('.vibecli')

    return files
  }

  private async generateFeatureFiles(projectPath: string, feature: FeatureConfig): Promise<{addedFiles: string[], modifiedFiles: string[], instructions: string[]}> {
    const addedFiles: string[] = []
    const modifiedFiles: string[] = []
    const instructions: string[] = []
    
    // 简化逻辑：只实现auth功能，从auth-system模板提取
    if (feature.name === 'auth') {
      const templatesDir = getTemplatesDirectory()
      const authTemplatePath = path.join(templatesDir, 'auth-system')
      
      if (!fs.existsSync(authTemplatePath)) {
        throw new Error('认证模板不存在')
      }

      // 复制认证功能文件到项目
      await this.copyAuthFeatureToProject(projectPath, authTemplatePath, addedFiles, modifiedFiles)

      instructions.push('✅ 认证功能已添加到项目')
      instructions.push('📝 请运行 npm install 安装新依赖')
      instructions.push('🔑 请配置 .env.local 中的JWT密钥')
      instructions.push('📧 建议配置邮件服务以启用邮箱验证')
    } else {
      throw new Error(`功能 ${feature.name} 暂未支持。当前可用功能: auth`)
    }

    return { addedFiles, modifiedFiles, instructions }
  }

  private async installDependencies(projectPath: string): Promise<void> {
    // 使用依赖检查器自动安装缺失的核心依赖
    const deps = {
      tailwindcss: '^3',
      autoprefixer: '^10',
      postcss: '^8',
      prisma: '^5',
      '@prisma/client': '^5'
    }
    await ensureDependenciesInstalled(projectPath, deps)

    // 执行常规安装，确保 lockfile 与依赖同步
    process.chdir(projectPath)
    execSync('npm install', { stdio: 'pipe' })
  }

  private projectUsesPrisma(projectPath: string): boolean {
    // 检查是否存在prisma目录和schema文件
    const prismaSchemaPath = path.join(projectPath, 'prisma', 'schema.prisma')
    return fs.existsSync(prismaSchemaPath)
  }

  private async initializeDatabase(projectPath: string): Promise<void> {
    process.chdir(projectPath)
    execSync('npx prisma generate', { stdio: 'pipe' })
  }

  private async buildProject(projectPath: string): Promise<void> {
    process.chdir(projectPath)
    execSync('npm run build', { stdio: 'pipe' })
  }

  private async executeDeployment(projectPath: string, config: DeploymentConfig): Promise<{url?: string, deploymentId?: string}> {
    // 这里会根据config.platform执行相应的部署逻辑
    // 暂时返回模拟数据
    return {
      url: `https://${config.platform}-deployed-app.com`,
      deploymentId: `deploy_${Date.now()}`
    }
  }

  private async generateCodeFiles(projectPath: string, config: GenerationConfig): Promise<{generatedFiles: string[], instructions: string[]}> {
    // 这里会根据config.type生成相应的代码文件
    // 暂时返回模拟数据
    return {
      generatedFiles: [`src/${config.type}s/${config.name}.ts`],
      instructions: [`${config.type} ${config.name} 已生成，请查看文件了解详情`]
    }
  }

  private detectDatabase(projectPath: string): string {
    try {
      const prismaSchemaPath = path.join(projectPath, 'prisma', 'schema.prisma')
      if (fs.existsSync(prismaSchemaPath)) {
        const schema = fs.readFileSync(prismaSchemaPath, 'utf-8')
        if (schema.includes('provider = "postgresql"')) return 'PostgreSQL'
        if (schema.includes('provider = "mysql"')) return 'MySQL'
        if (schema.includes('provider = "sqlite"')) return 'SQLite'
      }
      return 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  // 文件生成器方法
  private generateLayoutFile(config: ProjectConfig): string {
    return `import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '${config.name}',
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
  }

  private generatePageFile(config: ProjectConfig): string {
    return `export default function Home() {
  return (
    <main className="container px-4 py-8 mx-auto">
      <h1 className="mb-8 text-4xl font-bold text-center">
        欢迎使用 ${config.name}
      </h1>
      <p className="text-center text-gray-600">
        你的全栈应用已经准备就绪！模板：${config.template}
      </p>
    </main>
  )
}
`
  }

  private generateGlobalsCss(): string {
    return `@tailwind base;
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
  }

  private generateTsConfig(): string {
    return `{
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
  }

  private generateNextConfig(): string {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
`
  }

  private generatePrismaSchema(config: ProjectConfig): string {
    return `generator client {
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
  }

  private generateEnvExample(config: ProjectConfig): string {
    let dbUrl = ''
    switch (config.database) {
      case 'postgresql':
        dbUrl = 'postgresql://username:password@localhost:5432/database'
        break
      case 'mysql':
        dbUrl = 'mysql://username:password@localhost:3306/database'
        break
      case 'sqlite':
        dbUrl = 'file:./dev.db'
        break
    }

    return `# Database
DATABASE_URL="${dbUrl}"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
`
  }

  private generateTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
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
  }

  private generatePostcssConfig(): string {
    return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
  }

  // 新的模板系统辅助方法

  private getTemplateName(config: ProjectConfig): string {
    // 如果指定了模板，直接使用指定的模板
    if (config.template && config.template !== 'default') {
      return config.template
    }

    // 根据项目特征自动选择模板
    // 如果有支付功能，使用电商模板
    if (config.features.payment) {
      return 'ecommerce'
    }

    // 如果启用了认证功能，使用auth-system模板
    if (config.features.auth) {
      return 'auth-system'
    }

    // 否则使用简洁的default模板
    return 'default'
  }

  private prepareTemplateVariables(config: ProjectConfig): any {
    const databaseUrls = {
      postgresql: 'postgresql://username:password@localhost:5432/' + config.name.toLowerCase(),
      mysql: 'mysql://username:password@localhost:3306/' + config.name.toLowerCase(),
      sqlite: 'file:./dev.db'
    }

    return {
      projectName: config.name,
      description: `${config.name} - 基于VibeCLI创建的Next.js项目`,
      version: '0.1.0',
      databaseProvider: config.database,
      databaseUrl: databaseUrls[config.database],
      jwtSecret: this.generateSecret(64),
      jwtRefreshSecret: this.generateSecret(64),
      nextAuthSecret: this.generateSecret(32)
    }
  }

  private generateSecret(length: number): string {
    return crypto.randomBytes(length).toString('hex')
  }

  private async copyAndRenderTemplate(templatePath: string, projectPath: string, variables: any): Promise<void> {
    try {
      await fs.ensureDir(projectPath)
      
      // 验证模板路径存在
      if (!await fs.pathExists(templatePath)) {
        throw new Error(`模板路径不存在: ${templatePath}`)
      }
      
      const templateFiles = await this.getAllFiles(templatePath)
      console.log(`找到 ${templateFiles.length} 个模板文件`)
      
      for (const filePath of templateFiles) {
        try {
          const relativePath = path.relative(templatePath, filePath)
          
          // 跳过template.json配置文件和其他不需要的文件
          if (path.basename(filePath) === 'template.json' || 
              path.basename(filePath) === '.DS_Store' ||
              path.basename(filePath).startsWith('.git')) {
            continue
          }
          
          let targetPath = path.join(projectPath, relativePath)
          
          // 确保目标目录存在
          await fs.ensureDir(path.dirname(targetPath))
          
          if (filePath.endsWith('.mustache')) {
            // 渲染模板文件
            const template = await fs.readFile(filePath, 'utf-8')
            
            // 使用更安全的模板渲染
            let rendered: string
            try {
              // 禁用HTML转义，支持代码模板
              rendered = Mustache.render(template, variables, {}, { 
                escape: (text) => text,
                tags: ['{{', '}}'] 
              })
            } catch (renderError) {
              console.warn(`模板渲染警告 ${relativePath}:`, renderError)
              // 如果模板渲染失败，使用原始内容
              rendered = template
            }
            
            // 移除.mustache扩展名
            targetPath = targetPath.replace('.mustache', '')
            await fs.writeFile(targetPath, rendered, 'utf-8')
            console.log(`✓ 渲染模板: ${relativePath}`)
            
          } else {
            // 直接复制非模板文件
            await fs.copy(filePath, targetPath)
            console.log(`✓ 复制文件: ${relativePath}`)
          }
          
        } catch (fileError) {
          console.error(`处理文件失败 ${filePath}:`, fileError)
          // 继续处理其他文件，不中断整个流程
        }
      }
      
      console.log('✅ 模板文件处理完成')
      
         } catch (error: any) {
       console.error('模板复制和渲染失败:', error)
       throw new Error(`模板处理失败: ${error?.message || '未知错误'}`)
     }
  }

  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = []
    
    const items = await fs.readdir(dirPath)
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = await fs.stat(itemPath)
      
      if (stat.isDirectory()) {
        const subFiles = await this.getAllFiles(itemPath)
        files.push(...subFiles)
      } else {
        files.push(itemPath)
      }
    }
    
    return files
  }

  // 简化的add功能实现

  private async copyAuthFeatureToProject(
    projectPath: string, 
    authTemplatePath: string, 
    addedFiles: string[], 
    modifiedFiles: string[]
  ): Promise<void> {
    // 1. 复制认证文件
    const authDirs = ['lib', 'components', 'pages', 'types']
    
    for (const dir of authDirs) {
      const sourcePath = path.join(authTemplatePath, dir)
      const targetPath = path.join(projectPath, dir)
      
      if (fs.existsSync(sourcePath)) {
        await fs.copy(sourcePath, targetPath)
        addedFiles.push(`${dir}/`)
      }
    }

    // 2. 更新package.json依赖
    await this.updatePackageJsonForAuth(projectPath)
    modifiedFiles.push('package.json')

    // 3. 添加环境变量
    await this.addAuthEnvironmentVars(projectPath)
    modifiedFiles.push('.env.example')

    // 4. 如果项目有数据库，创建Prisma schema
    if (!fs.existsSync(path.join(projectPath, 'prisma'))) {
      await fs.ensureDir(path.join(projectPath, 'prisma'))
      await fs.copy(
        path.join(authTemplatePath, 'prisma/schema.prisma.mustache'),
        path.join(projectPath, 'prisma/schema.prisma')
      )
      addedFiles.push('prisma/schema.prisma')
    }
  }

  private async updatePackageJsonForAuth(projectPath: string): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json')
    const packageJson = await fs.readJson(packageJsonPath)
    
    // 添加认证依赖
    const newDeps = {
      'bcryptjs': '^2.4.3',
      'jsonwebtoken': '^9.0.0',
      'zod': '^3.22.0',
      'react-hook-form': '^7.47.0',
      '@hookform/resolvers': '^3.3.0',
      'zustand': '^4.4.0',
      'nodemailer': '^6.9.0',
      '@prisma/client': '^5.0.0',
      'prisma': '^5.0.0'
    }
    
    const newDevDeps = {
      '@types/bcryptjs': '^2.4.0',
      '@types/jsonwebtoken': '^9.0.0',
      '@types/nodemailer': '^6.4.0'
    }
    
    packageJson.dependencies = { ...packageJson.dependencies, ...newDeps }
    packageJson.devDependencies = { ...packageJson.devDependencies, ...newDevDeps }
    
    // 添加数据库脚本
    packageJson.scripts = {
      ...packageJson.scripts,
      'db:generate': 'prisma generate',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev',
      'db:studio': 'prisma studio'
    }
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
  }

  private async addAuthEnvironmentVars(projectPath: string): Promise<void> {
    const envPath = path.join(projectPath, '.env.example')
    const authEnvVars = `

# 认证系统配置
DATABASE_URL="postgresql://username:password@localhost:5432/database"
JWT_SECRET="${this.generateSecret(64)}"
JWT_REFRESH_SECRET="${this.generateSecret(64)}"
NEXTAUTH_SECRET="${this.generateSecret(32)}"

# 邮件配置 (可选)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"`

    if (fs.existsSync(envPath)) {
      const existing = await fs.readFile(envPath, 'utf-8')
      await fs.writeFile(envPath, existing + authEnvVars)
    } else {
      await fs.writeFile(envPath, authEnvVars.trim())
    }
  }
}