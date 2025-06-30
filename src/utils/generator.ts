import fs from 'fs-extra'
import path from 'path'
import mustache from 'mustache'

export interface ProjectConfig {
  template: string
  database: string
  features: string[]
  uiFramework: string
  auth: boolean
  admin: boolean
  upload: boolean
  email: boolean
  payment: boolean
  realtime: boolean
}

export class ProjectGenerator {
  constructor(
    private projectName: string,
    private projectPath: string,
    private config: ProjectConfig
  ) {}

  async generate() {
    // 创建项目目录
    await fs.ensureDir(this.projectPath)

    // 生成基础项目结构
    await this.generateBaseProject()

    // 生成配置文件
    await this.generateConfigFiles()

    // 生成数据库模式
    await this.generateDatabaseSchema()

    // 生成功能模块
    await this.generateFeatures()

    // 生成页面和组件
    await this.generatePages()

    // 复制静态文件
    await this.copyStaticFiles()
  }

  private async generateBaseProject() {
    const templatePath = path.join(__dirname, '../templates/base')
    
    // 生成package.json
    const packageTemplate = await fs.readFile(
      path.join(templatePath, 'package.json.mustache'),
      'utf-8'
    )
    
    const packageJson = mustache.render(packageTemplate, {
      projectName: this.projectName,
      hasAuth: this.config.auth,
      hasUpload: this.config.upload,
      hasEmail: this.config.email,
      hasPayment: this.config.payment,
      hasRealtime: this.config.realtime,
      database: this.config.database,
      uiFramework: this.config.uiFramework
    })

    await fs.writeFile(
      path.join(this.projectPath, 'package.json'),
      packageJson
    )

    // 生成Next.js配置
    const nextConfigTemplate = await fs.readFile(
      path.join(templatePath, 'next.config.js.mustache'),
      'utf-8'
    )

    const nextConfig = mustache.render(nextConfigTemplate, this.config)
    await fs.writeFile(
      path.join(this.projectPath, 'next.config.js'),
      nextConfig
    )

    // 生成TypeScript配置
    await fs.copy(
      path.join(templatePath, 'tsconfig.json'),
      path.join(this.projectPath, 'tsconfig.json')
    )

    // 生成Tailwind配置
    if (this.config.uiFramework === 'tailwind-radix') {
      await fs.copy(
        path.join(templatePath, 'tailwind.config.js'),
        path.join(this.projectPath, 'tailwind.config.js')
      )
    }
  }

  private async generateConfigFiles() {
    const templatePath = path.join(__dirname, '../templates/config')

    // 环境变量模板
    const envTemplate = await fs.readFile(
      path.join(templatePath, '.env.example.mustache'),
      'utf-8'
    )

    const envContent = mustache.render(envTemplate, {
      database: this.config.database,
      hasAuth: this.config.auth,
      hasEmail: this.config.email,
      hasPayment: this.config.payment,
      hasUpload: this.config.upload
    })

    await fs.writeFile(
      path.join(this.projectPath, '.env.example'),
      envContent
    )

    // ESLint配置
    await fs.copy(
      path.join(templatePath, '.eslintrc.json'),
      path.join(this.projectPath, '.eslintrc.json')
    )

    // Prettier配置
    await fs.copy(
      path.join(templatePath, '.prettierrc'),
      path.join(this.projectPath, '.prettierrc')
    )

    // GitIgnore
    await fs.copy(
      path.join(templatePath, '.gitignore'),
      path.join(this.projectPath, '.gitignore')
    )
  }

  private async generateDatabaseSchema() {
    const templatePath = path.join(__dirname, '../templates/database')
    
    // 创建prisma目录
    const prismaDir = path.join(this.projectPath, 'prisma')
    await fs.ensureDir(prismaDir)

    // 生成schema.prisma
    const schemaTemplate = await fs.readFile(
      path.join(templatePath, 'schema.prisma.mustache'),
      'utf-8'
    )

    const schemaContent = mustache.render(schemaTemplate, {
      database: this.config.database,
      hasAuth: this.config.auth,
      hasUpload: this.config.upload,
      template: this.config.template
    })

    await fs.writeFile(
      path.join(prismaDir, 'schema.prisma'),
      schemaContent
    )

    // 生成种子文件
    if (this.config.auth || this.config.template !== 'default') {
      const seedTemplate = await fs.readFile(
        path.join(templatePath, 'seed.ts.mustache'),
        'utf-8'
      )

      const seedContent = mustache.render(seedTemplate, this.config)
      await fs.writeFile(
        path.join(prismaDir, 'seed.ts'),
        seedContent
      )
    }
  }

  private async generateFeatures() {
    const featuresPath = path.join(this.projectPath, 'lib')
    await fs.ensureDir(featuresPath)

    // 生成认证功能
    if (this.config.auth) {
      await this.generateAuthFeature()
    }

    // 生成文件上传功能
    if (this.config.upload) {
      await this.generateUploadFeature()
    }

    // 生成邮件功能
    if (this.config.email) {
      await this.generateEmailFeature()
    }

    // 生成支付功能
    if (this.config.payment) {
      await this.generatePaymentFeature()
    }

    // 生成实时功能
    if (this.config.realtime) {
      await this.generateRealtimeFeature()
    }
  }

  private async generateAuthFeature() {
    const authPath = path.join(this.projectPath, 'lib/auth')
    await fs.ensureDir(authPath)

    const templatePath = path.join(__dirname, '../templates/features/auth')
    
    // 复制认证相关文件
    const files = [
      'auth.ts',
      'jwt.ts',
      'middleware.ts',
      'validation.ts'
    ]

    for (const file of files) {
      await fs.copy(
        path.join(templatePath, file),
        path.join(authPath, file)
      )
    }

    // 生成API路由
    const apiPath = path.join(this.projectPath, 'pages/api/auth')
    await fs.ensureDir(apiPath)

    const apiFiles = [
      'login.ts',
      'register.ts',
      'logout.ts',
      'refresh.ts',
      'profile.ts'
    ]

    for (const file of apiFiles) {
      await fs.copy(
        path.join(templatePath, 'api', file),
        path.join(apiPath, file)
      )
    }
  }

  private async generateUploadFeature() {
    // 实现文件上传功能生成
  }

  private async generateEmailFeature() {
    // 实现邮件功能生成
  }

  private async generatePaymentFeature() {
    // 实现支付功能生成
  }

  private async generateRealtimeFeature() {
    // 实现实时功能生成
  }

  private async generatePages() {
    const pagesPath = path.join(this.projectPath, 'pages')
    await fs.ensureDir(pagesPath)

    const templatePath = path.join(__dirname, '../templates/pages')

    // 基础页面
    const basePages = ['_app.tsx', '_document.tsx', 'index.tsx']
    
    for (const page of basePages) {
      const pageTemplate = await fs.readFile(
        path.join(templatePath, `${page}.mustache`),
        'utf-8'
      )

      const pageContent = mustache.render(pageTemplate, this.config)
      await fs.writeFile(
        path.join(pagesPath, page),
        pageContent
      )
    }

    // 认证页面
    if (this.config.auth) {
      const authPages = ['login.tsx', 'register.tsx']
      
      for (const page of authPages) {
        await fs.copy(
          path.join(templatePath, 'auth', page),
          path.join(pagesPath, page)
        )
      }
    }

    // 管理页面
    if (this.config.admin) {
      const adminPath = path.join(pagesPath, 'admin')
      await fs.ensureDir(adminPath)
      
      await fs.copy(
        path.join(templatePath, 'admin'),
        adminPath
      )
    }
  }

  private async copyStaticFiles() {
    const staticPath = path.join(__dirname, '../templates/static')
    const publicPath = path.join(this.projectPath, 'public')
    
    await fs.copy(staticPath, publicPath)

    // 创建其他必要目录
    const dirs = [
      'components/ui',
      'components/layout',
      'components/forms',
      'lib/services',
      'lib/hooks',
      'lib/stores',
      'lib/utils',
      'lib/validations',
      'types',
      'styles'
    ]

    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.projectPath, dir))
    }

    // 生成README
    const readmeTemplate = await fs.readFile(
      path.join(__dirname, '../templates/README.md.mustache'),
      'utf-8'
    )

    const readmeContent = mustache.render(readmeTemplate, {
      projectName: this.projectName,
      ...this.config
    })

    await fs.writeFile(
      path.join(this.projectPath, 'README.md'),
      readmeContent
    )
  }
}
