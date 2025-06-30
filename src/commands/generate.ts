import chalk from 'chalk'
import ora from 'ora'
import * as fs from 'fs-extra'
import * as path from 'path'
// 移除未使用的导入

interface GenerateOptions {
  model?: string
}

export async function generateApi(type: string, name: string, options: GenerateOptions) {
  const spinner = ora('正在生成...').start()
  
  try {
    // 检查是否在项目目录中
    const projectRoot = process.cwd()
    const packageJsonPath = path.join(projectRoot, 'package.json')
    
    if (!await fs.pathExists(packageJsonPath)) {
      spinner.fail('未找到 package.json，请确保在项目根目录中运行此命令')
      return
    }

    switch (type.toLowerCase()) {
      case 'api':
      case 'route':
        await generateApiRoute(name, options, projectRoot, spinner)
        break
      case 'component':
        await generateComponent(name, options, projectRoot, spinner)
        break
      case 'service':
        await generateService(name, options, projectRoot, spinner)
        break
      case 'model':
        await generateModel(name, options, projectRoot, spinner)
        break
      default:
        spinner.fail(`不支持的生成类型: ${type}`)
        console.log(chalk.yellow('支持的类型: api, component, service, model'))
        return
    }
    
  } catch (error) {
    spinner.fail('生成失败')
    console.error(chalk.red(error instanceof Error ? error.message : '未知错误'))
  }
}

async function generateApiRoute(name: string, options: GenerateOptions, projectRoot: string, spinner: any) {
  const routePath = path.join(projectRoot, 'src', 'app', 'api', name)
  await fs.ensureDir(routePath)
  
  const routeTemplate = `import { NextRequest, NextResponse } from 'next/server'

// GET /api/${name}
export async function GET(request: NextRequest) {
  try {
    // TODO: 实现获取${name}逻辑
    return NextResponse.json({ message: '${name} API endpoint' })
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// POST /api/${name}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // TODO: 实现创建${name}逻辑
    return NextResponse.json({ message: '创建成功', data: body })
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// PUT /api/${name}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    // TODO: 实现更新${name}逻辑
    return NextResponse.json({ message: '更新成功', data: body })
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// DELETE /api/${name}
export async function DELETE(request: NextRequest) {
  try {
    // TODO: 实现删除${name}逻辑
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
`

  const routeFile = path.join(routePath, 'route.ts')
  await fs.writeFile(routeFile, routeTemplate)
  
  spinner.succeed(`成功生成 API 路由: ${chalk.green(routeFile)}`)
}

async function generateComponent(name: string, options: GenerateOptions, projectRoot: string, spinner: any) {
  const componentPath = path.join(projectRoot, 'src', 'components')
  await fs.ensureDir(componentPath)
  
  const componentName = name.charAt(0).toUpperCase() + name.slice(1)
  const componentTemplate = `interface ${componentName}Props {
  // TODO: 定义组件 props
}

export default function ${componentName}({ }: ${componentName}Props) {
  return (
    <div className="${name}">
      <h2>${componentName} 组件</h2>
      {/* TODO: 实现组件内容 */}
    </div>
  )
}
`

  const componentFile = path.join(componentPath, `${componentName}.tsx`)
  await fs.writeFile(componentFile, componentTemplate)
  
  spinner.succeed(`成功生成组件: ${chalk.green(componentFile)}`)
}

async function generateService(name: string, options: GenerateOptions, projectRoot: string, spinner: any) {
  const servicePath = path.join(projectRoot, 'src', 'services')
  await fs.ensureDir(servicePath)
  
  const serviceTemplate = `export class ${name.charAt(0).toUpperCase() + name.slice(1)}Service {
  
  // 获取${name}列表
  static async getAll() {
    try {
      const response = await fetch('/api/${name}')
      if (!response.ok) throw new Error('获取数据失败')
      return await response.json()
    } catch (error) {
      console.error('获取${name}列表失败:', error)
      throw error
    }
  }

  // 创建${name}
  static async create(data: any) {
    try {
      const response = await fetch('/api/${name}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('创建失败')
      return await response.json()
    } catch (error) {
      console.error('创建${name}失败:', error)
      throw error
    }
  }

  // 更新${name}
  static async update(id: string, data: any) {
    try {
      const response = await fetch(\`/api/${name}/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('更新失败')
      return await response.json()
    } catch (error) {
      console.error('更新${name}失败:', error)
      throw error
    }
  }

  // 删除${name}
  static async delete(id: string) {
    try {
      const response = await fetch(\`/api/${name}/\${id}\`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('删除失败')
      return await response.json()
    } catch (error) {
      console.error('删除${name}失败:', error)
      throw error
    }
  }
}
`

  const serviceFile = path.join(servicePath, `${name}Service.ts`)
  await fs.writeFile(serviceFile, serviceTemplate)
  
  spinner.succeed(`成功生成服务: ${chalk.green(serviceFile)}`)
}

async function generateModel(name: string, options: GenerateOptions, projectRoot: string, spinner: any) {
  const modelsPath = path.join(projectRoot, 'src', 'models')
  await fs.ensureDir(modelsPath)
  
  const modelTemplate = `// Prisma 模型定义
// 请将以下内容添加到 prisma/schema.prisma 文件中

/*
model ${name.charAt(0).toUpperCase() + name.slice(1)} {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // TODO: 添加其他字段
  
  @@map("${name}")
}
*/

// TypeScript 类型定义
export interface ${name.charAt(0).toUpperCase() + name.slice(1)} {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  // TODO: 添加其他字段类型
}

// 创建${name}的输入类型
export interface Create${name.charAt(0).toUpperCase() + name.slice(1)}Input {
  name: string
  // TODO: 添加其他必需字段
}

// 更新${name}的输入类型
export interface Update${name.charAt(0).toUpperCase() + name.slice(1)}Input {
  name?: string
  // TODO: 添加其他可选字段
}
`

  const modelFile = path.join(modelsPath, `${name}.ts`)
  await fs.writeFile(modelFile, modelTemplate)
  
  spinner.succeed(`成功生成模型: ${chalk.green(modelFile)}`)
  console.log(chalk.yellow('提示: 请记得将 Prisma 模型定义添加到 prisma/schema.prisma 文件中'))
}